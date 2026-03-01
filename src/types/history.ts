export type HistorySection =
  | { type: "text"; heading: string; content: string }
  | { type: "list"; heading: string; content: string; items: string[] };

export interface HistoryLink {
  label: string;
  url: string;
}

export interface HistoryNode {
  id: string;
  category: string;
  label: string;
  year: string;
  date: string;
  status: string;
  shortInfo: string;
  authors?: string[];
  bips?: number[];
  subtitle?: string;
  description: string;
  sections?: HistorySection[];
  links?: HistoryLink[];
}

export interface HistoryData {
  version: number;
  title: string;
  description: string;
  author: string;
  generatedAt: string;
  nodes: HistoryNode[];
  edges?: { from: string; to: string; relationship: string }[];
}
