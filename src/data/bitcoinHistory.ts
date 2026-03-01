import type { Node, Edge } from "@xyflow/react";

// ─── Types (used by React Flow components) ───────────────────────────
export type NodeCategory = "genesis" | "softfork" | "breakthrough" | "proposed";

export interface BitcoinNodeData {
  [key: string]: unknown;
  label: string;
  year: string;
  date?: string;
  bips?: number[];
  category: NodeCategory;
  status?: "deployed" | "proposed" | "experimental" | "research";
  shortInfo: string;
  hasDetail?: boolean;
  authors?: string[];
  color?: string;
  elapsedFromPrev?: string;
}

export type BitcoinNode = Node<BitcoinNodeData>;
export type BitcoinEdge = Edge;

// ─── Detail content (display structure for the detail panel) ────────
export interface DetailContent {
  title: string;
  subtitle?: string;
  sections: {
    heading: string;
    content: string;
    type?: "text" | "list" | "diagram";
    items?: string[];
  }[];
  links?: { label: string; url: string }[];
}
