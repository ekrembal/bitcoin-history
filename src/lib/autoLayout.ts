import type { BitcoinHistoryJson, HistoryNode, HistoryConnection } from "@/types/historySchema";
import { toConnections } from "@/types/historySchema";
import type { BitcoinNode, BitcoinEdge, BitcoinNodeData, DetailContent } from "@/data/bitcoinHistory";

// ─── Layout constants ────────────────────────────────────────────────
const TIMELINE_SPACING = 220;
const TIMELINE_Y = 0;
const BRANCH_Y_START = 220;
const BRANCH_Y_STEP = 180;
const PROPOSED_Y = -220;
const MIN_X_GAP = 160;

// ─── Layout result ──────────────────────────────────────────────────
export interface LayoutResult {
  nodes: BitcoinNode[];
  edges: BitcoinEdge[];
  detailContents: Record<string, DetailContent>;
  nodeIds: Set<string>;
}

// ─── Helpers ────────────────────────────────────────────────────────
function parseYear(s: string): number {
  const n = parseInt(s, 10);
  return isNaN(n) ? 9999 : n;
}

function sortByDate(a: HistoryNode, b: HistoryNode): number {
  const ya = parseYear(a.year);
  const yb = parseYear(b.year);
  if (ya !== yb) return ya - yb;
  if (a.date && b.date) {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  }
  return 0;
}

function computeElapsed(prev: HistoryNode, curr: HistoryNode): string | undefined {
  if (!prev.date || !curr.date) return undefined;
  const p = new Date(prev.date);
  const c = new Date(curr.date);
  const diffDays = Math.round((c.getTime() - p.getTime()) / 86_400_000);
  if (diffDays <= 0) return undefined;
  if (diffDays < 30) return `${diffDays}d`;
  const months = Math.round(diffDays / 30.44);
  if (months < 12) return `${months}m`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0 ? `${years}y` : `${years}y ${rem}m`;
}

function nodeType(cat: string): string {
  switch (cat) {
    case "genesis":
    case "softfork":
      return "timelineDot";
    case "breakthrough":
      return "branchNode";
    case "proposed":
      return "proposedDot";
    default:
      return "branchNode";
  }
}

function edgeType(rel: string): string {
  switch (rel) {
    case "timeline":
      return "timelineDotted";
    case "dependency":
      return "branch";
    case "proposed-dependency":
      return "proposedEdge";
    default:
      return "branch";
  }
}

function parseLinkUrl(url: string): string {
  const m = url.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
  return m ? m[2] : url;
}

function toNodeData(node: HistoryNode): BitcoinNodeData {
  return {
    label: node.label,
    year: node.year,
    date: node.date,
    bips: node.bips,
    category: node.category,
    status: node.status,
    shortInfo: node.shortInfo,
    hasDetail: !!(node.sections && node.sections.length > 0),
    authors: node.authors,
  };
}

function toDetailContent(node: HistoryNode): DetailContent | null {
  if (!node.sections || node.sections.length === 0) return null;
  const subtitle =
    node.subtitle ||
    [node.authors?.join(", "), node.date].filter(Boolean).join(" · ") ||
    undefined;

  const links = node.links?.map((l) => ({
    label: l.label,
    url: parseLinkUrl(l.url),
  }));

  return {
    title: node.label,
    subtitle,
    sections: node.sections.map((s) => ({
      heading: s.heading,
      content: s.content,
      type: s.type as "text" | "list" | "diagram" | undefined,
      items: s.items,
    })),
    links,
  };
}

// ─── Main layout function ───────────────────────────────────────────
export function autoLayout(data: BitcoinHistoryJson): LayoutResult {
  const connections: HistoryConnection[] = toConnections(data);

  // 1. Categorise & sort
  const timeline = data.nodes
    .filter((n) => n.category === "genesis" || n.category === "softfork")
    .sort(sortByDate);

  const breakthroughs = data.nodes
    .filter((n) => n.category === "breakthrough")
    .sort(sortByDate);

  const proposed = data.nodes
    .filter((n) => n.category === "proposed")
    .sort(sortByDate);

  // 2. Dependency lookup
  const incomingParents = new Map<string, string[]>();
  for (const c of connections) {
    if (c.relationship !== "timeline") {
      const arr = incomingParents.get(c.to) || [];
      arr.push(c.from);
      incomingParents.set(c.to, arr);
    }
  }

  const outgoing = new Map<string, string[]>();
  for (const c of connections) {
    const arr = outgoing.get(c.from) || [];
    arr.push(c.to);
    outgoing.set(c.from, arr);
  }

  // 3. Position timeline
  const positions: Record<string, { x: number; y: number }> = {};
  const xLookup: Record<string, number> = {};

  timeline.forEach((node, i) => {
    const x = i * TIMELINE_SPACING;
    positions[node.id] = { x, y: TIMELINE_Y };
    xLookup[node.id] = x;
  });

  const timelineYears = timeline.map((n) => parseYear(n.year));
  const minYear = Math.min(...timelineYears, 2008);
  const maxYear = Math.max(...timelineYears, 2026);
  const maxX = Math.max((timeline.length - 1) * TIMELINE_SPACING, 0);

  function yearToX(year: string): number {
    const y = parseYear(year);
    const range = maxYear - minYear || 1;
    return ((y - minYear) / range) * maxX;
  }

  // 4. Position breakthroughs
  const occupiedSlots: { x: number; y: number }[] = [];

  for (const node of breakthroughs) {
    const parents = incomingParents.get(node.id) || [];
    const knownXs = parents.map((p) => xLookup[p]).filter((v) => v !== undefined);

    const x = knownXs.length > 0
      ? knownXs.reduce((a, b) => a + b, 0) / knownXs.length
      : yearToX(node.year);

    let y = BRANCH_Y_START;
    for (let row = 0; row < 6; row++) {
      const rowY = BRANCH_Y_START + row * BRANCH_Y_STEP;
      const conflict = occupiedSlots.some(
        (s) => s.y === rowY && Math.abs(s.x - x) < MIN_X_GAP
      );
      if (!conflict) {
        y = rowY;
        break;
      }
    }

    positions[node.id] = { x, y };
    xLookup[node.id] = x;
    occupiedSlots.push({ x, y });
  }

  // 5. Position proposed nodes
  proposed.forEach((node, i) => {
    const targets = outgoing.get(node.id) || [];
    const knownXs = targets.map((t) => xLookup[t]).filter((v) => v !== undefined);

    const x = knownXs.length > 0
      ? knownXs.reduce((a, b) => a + b, 0) / knownXs.length
      : maxX + (i + 1) * TIMELINE_SPACING;

    positions[node.id] = { x, y: PROPOSED_Y };
    xLookup[node.id] = x;
  });

  // 6. Build BitcoinNode[]
  const nodes: BitcoinNode[] = data.nodes.map((node) => {
    const pos = positions[node.id] || { x: 0, y: 0 };
    const nd = toNodeData(node);

    if (node.category === "genesis" || node.category === "softfork") {
      const idx = timeline.findIndex((n) => n.id === node.id);
      if (idx > 0) {
        nd.elapsedFromPrev = computeElapsed(timeline[idx - 1], node);
      }
    }

    return { id: node.id, type: nodeType(node.category), position: pos, data: nd };
  });

  // 7. Build BitcoinEdge[]
  const edges: BitcoinEdge[] = connections.map((conn) => ({
    id: `e-${conn.from}-${conn.to}`,
    source: conn.from,
    target: conn.to,
    type: edgeType(conn.relationship),
  }));

  // 8. Build detail contents
  const detailContents: Record<string, DetailContent> = {};
  for (const node of data.nodes) {
    const detail = toDetailContent(node);
    if (detail) detailContents[node.id] = detail;
  }

  return { nodes, edges, detailContents, nodeIds: new Set(data.nodes.map((n) => n.id)) };
}
