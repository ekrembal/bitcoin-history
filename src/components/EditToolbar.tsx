import { useCallback, useRef } from "react";
import { Plus, GitBranch, Upload, Share2, RotateCcw, Download } from "lucide-react";
import { useGraphStore, nextUserNodeId } from "@/lib/useGraphStore";
import {
  getShareUrl,
  exportToFile,
  importFromFile,
  importRawHistoryJson,
} from "@/lib/serialization";
import type { HistoryNode } from "@/types/historySchema";

export function EditToolbar() {
  const store = useGraphStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addSoftfork = useCallback(() => {
    const newId = nextUserNodeId();
    const node: HistoryNode = {
      id: newId,
      category: "softfork",
      label: "New Softfork",
      year: "Future",
      status: "proposed",
      shortInfo: "Click to edit",
    };
    store.addHistoryNode(node);
    const timelineNodes = store.nodes.filter(
      (n) => n.data.category === "softfork" || n.data.category === "genesis"
    );
    const sorted = [...timelineNodes].sort((a, b) => a.position.x - b.position.x);
    const lastNode = sorted[sorted.length - 1];
    if (lastNode && lastNode.id !== newId) {
      store.addConnection(lastNode.id, newId, "timeline");
    }
  }, [store]);

  const addPrimitive = useCallback(() => {
    const newId = nextUserNodeId();
    const node: HistoryNode = {
      id: newId,
      category: "breakthrough",
      label: "New Primitive",
      year: "Future",
      status: "research",
      shortInfo: "Click to edit",
    };
    store.addHistoryNode(node);
  }, [store]);

  const handleShare = useCallback(async () => {
    const result = getShareUrl(store.historyData, store.getVisualOverrides());
    if (result.type === "url") {
      try {
        await navigator.clipboard.writeText(result.url);
        window.history.replaceState(null, "", result.url);
        alert("Link copied to clipboard!");
      } catch {
        prompt("Copy this URL:", result.url);
      }
    } else {
      if (confirm("Graph is too large for a URL. Download as a file instead?")) {
        await exportToFile(store.historyData, store.getVisualOverrides());
      }
    }
  }, [store]);

  const handleExport = useCallback(async () => {
    await exportToFile(store.historyData, store.getVisualOverrides());
  }, [store]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        try {
          const payload = await importFromFile(file);
          store.loadSharePayload(payload);
        } catch {
          const data = await importRawHistoryJson(file);
          store.loadHistoryJson(data);
        }
      } catch {
        alert("Failed to import file. Make sure it's a valid Bitcoin History JSON.");
      }
      e.target.value = "";
    },
    [store]
  );

  const handleReset = useCallback(() => {
    if (confirm("Reset to current source? This cannot be undone.")) {
      store.resetToDefault();
    }
  }, [store]);

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="flex items-center gap-1 px-2 py-1.5 bg-white/90 dark:bg-[#0f0f23]/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl">
        <ToolbarBtn icon={<Plus className="w-3.5 h-3.5" />} label="Add Softfork" onClick={addSoftfork} />
        <ToolbarBtn icon={<GitBranch className="w-3.5 h-3.5" />} label="Add Primitive" onClick={addPrimitive} />
        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5" />
        <ToolbarBtn icon={<Share2 className="w-3.5 h-3.5" />} label="Share" onClick={handleShare} />
        <ToolbarBtn icon={<Download className="w-3.5 h-3.5" />} label="Export" onClick={handleExport} />
        <ToolbarBtn icon={<Upload className="w-3.5 h-3.5" />} label="Import" onClick={handleImport} />
        <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5" />
        <ToolbarBtn icon={<RotateCcw className="w-3.5 h-3.5" />} label="Reset" onClick={handleReset} variant="danger" />
      </div>
      <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={onFileSelected} />
    </div>
  );
}

function ToolbarBtn({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        variant === "danger" ? "text-red-500 hover:bg-red-500/10" : "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
