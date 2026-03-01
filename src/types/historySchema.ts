// ─── Bitcoin History JSON Schema ─────────────────────────────────────
// Supports both "connections" (internal) and "edges" (gemini-pro format).

export interface BitcoinHistoryJson {
  version: 1;
  title: string;
  description?: string;
  author?: string;
  generatedAt?: string;
  nodes: HistoryNode[];
  connections?: HistoryConnection[];
  /** Gemini-style format: edges instead of connections */
  edges?: { from: string; to: string; relationship: string }[];
}

export interface HistoryNode {
  id: string;
  category: "genesis" | "softfork" | "breakthrough" | "proposed";
  label: string;
  year: string;
  date?: string;
  subtitle?: string;
  status: "deployed" | "proposed" | "experimental" | "research";
  shortInfo: string;
  authors?: string[];
  bips?: number[];
  description?: string;
  sections?: HistorySection[];
  links?: { label: string; url: string }[];
}

export interface HistorySection {
  heading: string;
  content: string;
  type?: "text" | "list" | "diagram";
  items?: string[];
}

export interface HistoryConnection {
  from: string;
  to: string;
  relationship: "timeline" | "dependency" | "proposed-dependency";
}

// ─── Visual Overrides (user customizations, NOT part of the data) ────
export interface VisualOverrides {
  positions: Record<string, { x: number; y: number }>;
  colors: Record<string, string>;
}

// ─── Share Payload ───────────────────────────────────────────────────
export interface SharePayload {
  v: 2;
  hash: string;
  data: BitcoinHistoryJson;
  visual: VisualOverrides;
}

/** Convert edges format to connections */
export function toConnections(data: BitcoinHistoryJson): HistoryConnection[] {
  if (data.connections && data.connections.length > 0) return data.connections;
  if (data.edges)
    return data.edges.map((e) => ({
      from: e.from,
      to: e.to,
      relationship: (e.relationship || "dependency") as HistoryConnection["relationship"],
    }));
  return [];
}

/** Normalize to always have connections (for store) */
export function normalizeHistoryData(data: BitcoinHistoryJson): BitcoinHistoryJson {
  const connections = toConnections(data);
  const { edges: _, ...rest } = data as BitcoinHistoryJson & { edges?: unknown };
  return { ...rest, connections };
}
