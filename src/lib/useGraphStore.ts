import { useState, useMemo, useCallback, useEffect, createContext, useContext } from "react";
import { applyNodeChanges, applyEdgeChanges, type NodeChange, type EdgeChange } from "@xyflow/react";
import type { BitcoinNode, BitcoinEdge, BitcoinNodeData, DetailContent } from "@/data/bitcoinHistory";
import type { BitcoinHistoryJson, HistoryNode, VisualOverrides, SharePayload } from "@/types/historySchema";
import { normalizeHistoryData } from "@/types/historySchema";
import { autoLayout } from "@/lib/autoLayout";
import { loadFromUrlHash } from "@/lib/serialization";

const EMPTY_HISTORY: BitcoinHistoryJson = {
  version: 1,
  title: "",
  nodes: [],
  connections: [],
};

export interface GraphStore {
  nodes: BitcoinNode[];
  edges: BitcoinEdge[];
  isEditMode: boolean;
  setEditMode: (on: boolean) => void;
  getDetailContent: (nodeId: string) => DetailContent | null;
  addHistoryNode: (node: HistoryNode) => void;
  updateNodeData: (nodeId: string, data: Partial<BitcoinNodeData>) => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
  deleteNode: (nodeId: string) => void;
  setNodeParents: (nodeId: string, parentIds: string[]) => void;
  addConnection: (from: string, to: string, relationship: string) => void;
  reconnectEdge: (oldSource: string, oldTarget: string, newSource: string, newTarget: string) => void;
  setNodeColor: (nodeId: string, color: string) => void;
  historyData: BitcoinHistoryJson;
  positionOverrides: Record<string, { x: number; y: number }>;
  colorOverrides: Record<string, string>;
  loadHistoryJson: (data: BitcoinHistoryJson) => void;
  loadSharePayload: (payload: SharePayload) => void;
  getVisualOverrides: () => VisualOverrides;
  resetToDefault: () => void;
  onNodesChange: (changes: NodeChange<BitcoinNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<BitcoinEdge>[]) => void;
}

export const GraphStoreCtx = createContext<GraphStore | null>(null);

export function useGraphStore(): GraphStore {
  const ctx = useContext(GraphStoreCtx);
  if (!ctx) throw new Error("useGraphStore must be used within GraphStoreProvider");
  return ctx;
}

let _counter = 0;
export function nextUserNodeId(): string {
  return `user-${++_counter}`;
}

export function useGraphStoreProvider(initialData: BitcoinHistoryJson | null): GraphStore {
  const [initState] = useState(() => {
    const fromUrl = loadFromUrlHash();
    if (fromUrl) {
      const data = normalizeHistoryData(fromUrl.data);
      return { data, positions: fromUrl.visual?.positions ?? {}, colors: fromUrl.visual?.colors ?? {} };
    }
    const data = initialData ? normalizeHistoryData(initialData) : EMPTY_HISTORY;
    return { data, positions: {} as Record<string, { x: number; y: number }>, colors: {} as Record<string, string> };
  });

  const [historyData, setHistoryData] = useState<BitcoinHistoryJson>(initState.data);
  const [positionOverrides, setPositionOverrides] = useState<Record<string, { x: number; y: number }>>(initState.positions);
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>(initState.colors);
  const [isEditMode, setEditMode] = useState(false);
  const [sourceData, setSourceData] = useState<BitcoinHistoryJson | null>(initialData);

  useEffect(() => {
    if (initialData && initialData.nodes.length > 0) {
      const normalized = normalizeHistoryData(initialData);
      setSourceData(normalized);
      setHistoryData(normalized);
      setPositionOverrides({});
      setColorOverrides({});
    }
  }, [initialData]);

  const layout = useMemo(() => autoLayout(historyData), [historyData]);

  const computedNodes = useMemo<BitcoinNode[]>(() => {
    return layout.nodes.map((n) => ({
      ...n,
      position: positionOverrides[n.id] || n.position,
      data: { ...n.data, color: colorOverrides[n.id] || n.data.color },
    }));
  }, [layout.nodes, positionOverrides, colorOverrides]);

  const computedEdges = useMemo<BitcoinEdge[]>(() => {
    const nodeMap = new Map(computedNodes.map((n) => [n.id, n]));
    return layout.edges.map((e) => {
      const target = nodeMap.get(e.target);
      const targetStatus = (target?.data?.status as string) || "research";
      return { ...e, animated: false, data: { ...(e.data || {}), targetStatus } };
    });
  }, [layout.edges, computedNodes]);

  const [rfNodes, setRfNodes] = useState<BitcoinNode[]>(computedNodes);
  const [rfEdges, setRfEdges] = useState<BitcoinEdge[]>(computedEdges);

  useEffect(() => {
    setRfNodes(computedNodes);
  }, [computedNodes]);
  useEffect(() => {
    setRfEdges(computedEdges);
  }, [computedEdges]);

  const getDetailContent = useCallback(
    (nodeId: string): DetailContent | null => layout.detailContents[nodeId] || null,
    [layout.detailContents]
  );

  const addHistoryNode = useCallback((node: HistoryNode) => {
    setHistoryData((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
  }, []);

  const updateNodeData = useCallback((nodeId: string, data: Partial<BitcoinNodeData>) => {
    setHistoryData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id !== nodeId
          ? n
          : {
              ...n,
              label: (data.label as string) ?? n.label,
              shortInfo: (data.shortInfo as string) ?? n.shortInfo,
              year: (data.year as string) ?? n.year,
              status: (data.status as HistoryNode["status"]) ?? n.status,
              authors: (data.authors as string[]) ?? n.authors,
              bips: (data.bips as number[]) ?? n.bips,
            }
      ),
    }));
    if (data.color) setColorOverrides((prev) => ({ ...prev, [nodeId]: data.color as string }));
  }, []);

  const updateNodePosition = useCallback((nodeId: string, position: { x: number; y: number }) => {
    setPositionOverrides((prev) => ({ ...prev, [nodeId]: position }));
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    const conns = historyData.connections || [];
    setHistoryData((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nodeId),
      connections: conns.filter((c) => c.from !== nodeId && c.to !== nodeId),
    }));
    setPositionOverrides((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
    setColorOverrides((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      return next;
    });
  }, [historyData]);

  const setNodeParents = useCallback((nodeId: string, parentIds: string[]) => {
    setHistoryData((prev) => {
      const conns = prev.connections || [];
      const filtered = conns.filter((c) => c.to !== nodeId || c.relationship === "timeline");
      const added = parentIds.map((parentId) => ({ from: parentId, to: nodeId, relationship: "dependency" as const }));
      return { ...prev, connections: [...filtered, ...added] };
    });
  }, []);

  const addConnection = useCallback((from: string, to: string, relationship: string) => {
    setHistoryData((prev) => ({
      ...prev,
      connections: [...(prev.connections || []), { from, to, relationship: relationship as "timeline" | "dependency" | "proposed-dependency" }],
    }));
  }, []);

  const reconnectEdgeFn = useCallback(
    (oldSource: string, oldTarget: string, newSource: string, newTarget: string) => {
      setHistoryData((prev) => {
        const conns = prev.connections || [];
        const idx = conns.findIndex((c) => c.from === oldSource && c.to === oldTarget);
        if (idx === -1) return prev;
        const updated = [...conns];
        updated[idx] = { ...updated[idx], from: newSource, to: newTarget };
        return { ...prev, connections: updated };
      });
    },
    []
  );

  const setNodeColor = useCallback((nodeId: string, color: string) => {
    setColorOverrides((prev) => ({ ...prev, [nodeId]: color }));
  }, []);

  const loadHistoryJson = useCallback((data: BitcoinHistoryJson) => {
    const normalized = normalizeHistoryData(data);
    setHistoryData(normalized);
    setSourceData(normalized);
    setPositionOverrides({});
    setColorOverrides({});
  }, []);

  const loadSharePayload = useCallback((payload: SharePayload) => {
    const normalized = normalizeHistoryData(payload.data);
    setHistoryData(normalized);
    setSourceData(normalized);
    setPositionOverrides(payload.visual?.positions || {});
    setColorOverrides(payload.visual?.colors || {});
  }, []);

  const getVisualOverrides = useCallback(
    (): VisualOverrides => ({ positions: positionOverrides, colors: colorOverrides }),
    [positionOverrides, colorOverrides]
  );

  const resetToDefault = useCallback(() => {
    if (sourceData) {
      setHistoryData(sourceData);
      setPositionOverrides({});
      setColorOverrides({});
    }
    window.history.replaceState(null, "", window.location.pathname);
  }, [sourceData]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BitcoinNode>[]) => {
      setRfNodes((prev) => applyNodeChanges(changes, prev));
      for (const change of changes) {
        if (change.type === "position" && change.dragging === false && change.position) {
          updateNodePosition(change.id, change.position);
        }
      }
    },
    [updateNodePosition]
  );

  const onEdgesChange = useCallback((changes: EdgeChange<BitcoinEdge>[]) => {
    setRfEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  return {
    nodes: rfNodes,
    edges: rfEdges,
    isEditMode,
    setEditMode,
    getDetailContent,
    addHistoryNode,
    updateNodeData,
    updateNodePosition,
    deleteNode,
    setNodeParents,
    addConnection,
    reconnectEdge: reconnectEdgeFn,
    setNodeColor,
    historyData,
    positionOverrides,
    colorOverrides,
    loadHistoryJson,
    loadSharePayload,
    getVisualOverrides,
    resetToDefault,
    onNodesChange,
    onEdgesChange,
  };
}
