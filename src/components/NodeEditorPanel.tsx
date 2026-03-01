import { useCallback, useState, useEffect, useMemo } from "react";
import { X, ArrowLeft, Trash2 } from "lucide-react";
import { useGraphStore } from "@/lib/useGraphStore";
import type { BitcoinNodeData } from "@/data/bitcoinHistory";

const PRESET_COLORS = [
  "#F7931A", "#F59E0B", "#EF4444", "#EC4899", "#8B5CF6",
  "#3B82F6", "#06B6D4", "#22C55E", "#84CC16", "#6B7280",
];

const STATUS_OPTIONS = ["deployed", "proposed", "experimental", "research"] as const;

interface NodeEditorPanelProps {
  nodeId: string;
  onClose: () => void;
}

export function NodeEditorPanel({ nodeId, onClose }: NodeEditorPanelProps) {
  const store = useGraphStore();
  const node = store.nodes.find((n) => n.id === nodeId);

  const [label, setLabel] = useState("");
  const [shortInfo, setShortInfo] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<string>("research");
  const [color, setColor] = useState("#3B82F6");
  const [authors, setAuthors] = useState("");
  const [bips, setBips] = useState("");

  const currentParentIds = useMemo(() => {
    return store.edges.filter((e) => e.target === nodeId).map((e) => e.source);
  }, [store.edges, nodeId]);

  const [selectedParents, setSelectedParents] = useState<string[]>([]);

  useEffect(() => {
    if (!node) return;
    const d = node.data;
    setLabel(d.label || "");
    setShortInfo(d.shortInfo || "");
    setYear(d.year || "");
    setStatus((d.status as string) || "research");
    setColor((d.color as string) || "#3B82F6");
    setAuthors((d.authors as string[])?.join(", ") || "");
    setBips((d.bips as number[])?.join(", ") || "");
  }, [node]);

  useEffect(() => {
    setSelectedParents(currentParentIds);
  }, [currentParentIds]);

  const saveChanges = useCallback(() => {
    const data: Partial<BitcoinNodeData> = {
      label,
      shortInfo,
      year,
      status: status as BitcoinNodeData["status"],
      color,
      authors: authors.split(",").map((s) => s.trim()).filter(Boolean),
      bips: bips.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n)),
    };
    store.updateNodeData(nodeId, data);
  }, [store, nodeId, label, shortInfo, year, status, color, authors, bips]);

  useEffect(() => {
    const timer = setTimeout(saveChanges, 300);
    return () => clearTimeout(timer);
  }, [saveChanges]);

  const handleParentToggle = useCallback(
    (parentId: string) => {
      setSelectedParents((prev) => {
        const next = prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId];
        store.setNodeParents(nodeId, next);
        return next;
      });
    },
    [store, nodeId]
  );

  const handleDelete = useCallback(() => {
    if (confirm(`Delete "${label}"? This cannot be undone.`)) {
      store.deleteNode(nodeId);
      onClose();
    }
  }, [store, nodeId, label, onClose]);

  if (!node) return null;

  const possibleParents = store.nodes.filter(
    (n) =>
      n.id !== nodeId &&
      (n.data.category === "softfork" ||
        n.data.category === "genesis" ||
        n.data.category === "breakthrough" ||
        n.data.category === "proposed")
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white/95 dark:bg-[#0f0f23]/95 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#0f0f23]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="px-4 pb-3">
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Edit Node</h1>
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="Node name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Short Info</label>
            <input
              type="text"
              value={shortInfo}
              onChange={(e) => setShortInfo(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="Brief description"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Year</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="2025"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#0f0f23] ring-gray-400 dark:ring-white/40 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Authors</label>
            <input
              type="text"
              value={authors}
              onChange={(e) => setAuthors(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="Name1, Name2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">BIPs</label>
            <input
              type="text"
              value={bips}
              onChange={(e) => setBips(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              placeholder="340, 341"
            />
          </div>
          {node.data.category !== "genesis" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Connect to ({selectedParents.length} selected)
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                {possibleParents.length === 0 && (
                  <div className="px-3 py-2 text-xs text-gray-400">No available nodes</div>
                )}
                {possibleParents.map((n) => {
                  const isChecked = selectedParents.includes(n.id);
                  return (
                    <label
                      key={n.id}
                      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${isChecked ? "bg-orange-500/5" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleParentToggle(n.id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500/30"
                      />
                      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{n.data.label}</span>
                      <span className="text-[9px] text-gray-400 dark:text-gray-600 font-mono ml-auto shrink-0">
                        {n.data.year}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="pt-3 border-t border-gray-200 dark:border-white/5">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors w-full"
            >
              <Trash2 className="w-4 h-4" />
              Delete Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
