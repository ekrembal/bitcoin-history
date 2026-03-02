import { useCallback, useState, useMemo } from "react";
import {
  ReactFlow,
  Background,
  useReactFlow,
  type NodeMouseHandler,
  type NodeTypes,
  type EdgeTypes,
  type Edge,
  type Connection,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { BitcoinNode } from "@/data/bitcoinHistory";
import { TimelineDotNode } from "@/components/nodes/TimelineDotNode";
import { BranchNode } from "@/components/nodes/BranchNode";
import { ProposedDotNode } from "@/components/nodes/ProposedDotNode";
import { TimelineDottedEdge, BranchEdge, ProposedEdge } from "@/components/edges/TimelineEdge";
import { DetailPanel } from "@/components/DetailPanel";
import { NodeEditorPanel } from "@/components/NodeEditorPanel";
import { EditToolbar } from "@/components/EditToolbar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/lib/useTheme";
import { useGraphStore } from "@/lib/useGraphStore";
import { Link } from "react-router-dom";
import { Info, ZoomIn, ZoomOut, Maximize2, X, Pencil, PencilOff, FileEdit } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const nodeTypes: NodeTypes = {
  timelineDot: TimelineDotNode,
  branchNode: BranchNode,
  proposedDot: ProposedDotNode,
};

const edgeTypes: EdgeTypes = {
  timelineDotted: TimelineDottedEdge,
  branch: BranchEdge,
  proposedEdge: ProposedEdge,
};

interface BitcoinHistoryFlowProps {
  sourceIndex: string[];
  selectedSource: string | null;
  onSourceChange: (file: string) => void;
}

function FlowContent({ sourceIndex, selectedSource, onSourceChange }: BitcoinHistoryFlowProps) {
  const store = useGraphStore();
  const { nodes, edges, onNodesChange, onEdgesChange, isEditMode, setEditMode, reconnectEdge } = store;

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { resolved } = useTheme();

  const detailContent = useMemo(
    () => (selectedNodeId ? store.getDetailContent(selectedNodeId) : null),
    [selectedNodeId, store]
  );

  const onNodeClick: NodeMouseHandler<BitcoinNode> = useCallback(
    (_event, node) => {
      if (isEditMode) {
        setEditingNodeId(node.id);
        setSelectedNodeId(null);
      } else if (store.getDetailContent(node.id)) {
        setSelectedNodeId(node.id);
        setEditingNodeId(null);
      }
    },
    [isEditMode, store]
  );

  const onCloseDetail = useCallback(() => setSelectedNodeId(null), []);
  const onCloseEditor = useCallback(() => setEditingNodeId(null), []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      if (newConnection.source && newConnection.target) {
        reconnectEdge(oldEdge.source, oldEdge.target, newConnection.source, newConnection.target);
      }
    },
    [reconnectEdge]
  );

  const toggleEditMode = useCallback(() => {
    const next = !isEditMode;
    setEditMode(next);
    if (!next) setEditingNodeId(null);
  }, [isEditMode, setEditMode]);

  return (
    <div className="w-screen h-screen bg-gray-50 dark:bg-[#0a0a1a] relative transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-500/20">
              ₿
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                Bitcoin History
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 hidden sm:block">
                Softforks · Research · L2 Solutions
              </p>
            </div>
            {sourceIndex.length > 1 && (
              <Select value={selectedSource ?? ""} onValueChange={onSourceChange}>
                <SelectTrigger className="w-[140px] h-7 text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {sourceIndex.map((file) => (
                    <SelectItem key={file} value={file}>
                      {file.replace(".json", "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-1 pointer-events-auto">
            <Link
              to="/edit"
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400"
              title="AI prompt & paste JSON"
            >
              <FileEdit className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={toggleEditMode}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                isEditMode ? "bg-orange-500/20 text-orange-500 ring-1 ring-orange-500/30" : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400"
              }`}
              title={isEditMode ? "Exit edit mode" : "Enter edit mode"}
            >
              {isEditMode ? <PencilOff className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Info & Legend"
            >
              <Info className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1" />
            <button
              onClick={() => zoomIn({ duration: 200 })}
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => zoomOut({ duration: 200 })}
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => fitView({ padding: 0.15, duration: 300 })}
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Fit View"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {showInfo && (
        <div className="absolute top-14 right-3 sm:right-4 z-20 w-60 sm:w-64 bg-white/95 dark:bg-[#0f0f23]/95 backdrop-blur-xl rounded-xl border border-gray-200 dark:border-white/10 p-4 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-900 dark:text-white">Legend</span>
            <button onClick={() => setShowInfo(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Softfork (circle dot)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Research / L2 (square dot)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gray-500" />
              <span className="text-[11px] text-gray-500 dark:text-gray-400">Proposed (square dot)</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-white/5">
            <p className="text-[10px] text-gray-400 dark:text-gray-600 leading-relaxed">
              Click any node to see details. Scroll to pan, pinch/ctrl+scroll to zoom.
            </p>
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="absolute top-[52px] left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium">
            Edit Mode — Click nodes to edit, drag to reposition
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onReconnect={isEditMode ? onReconnect : undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={{ x: 80, y: 250, zoom: 0.55 }}
        minZoom={0.15}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={isEditMode}
        nodesConnectable={false}
        edgesReconnectable={isEditMode}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        panOnScroll={true}
        zoomOnScroll={true}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={0.8}
          color={resolved === "dark" ? "#ffffff06" : "#00000008"}
        />
      </ReactFlow>

      {isEditMode && <EditToolbar />}
      {!isEditMode && <DetailPanel content={detailContent} onClose={onCloseDetail} />}
      {isEditMode && editingNodeId && (
        <NodeEditorPanel nodeId={editingNodeId} onClose={onCloseEditor} />
      )}
    </div>
  );
}

export function BitcoinHistoryFlow({
  sourceIndex,
  selectedSource,
  onSourceChange,
}: BitcoinHistoryFlowProps) {
  return (
    <FlowContent
      sourceIndex={sourceIndex}
      selectedSource={selectedSource}
      onSourceChange={onSourceChange}
    />
  );
}
