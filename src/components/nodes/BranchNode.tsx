import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { BitcoinNodeData } from "@/data/bitcoinHistory";

export type BranchNodeType = Node<BitcoinNodeData, "branchNode">;

const statusStyles: Record<string, { dot: string; text: string }> = {
  deployed: { dot: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400/70" },
  experimental: { dot: "bg-red-400", text: "text-red-500 dark:text-red-400/70" },
  research: { dot: "bg-blue-400", text: "text-blue-500 dark:text-blue-400/70" },
  proposed: { dot: "bg-yellow-500", text: "text-yellow-600 dark:text-yellow-500/70" },
};

export function BranchNode({ data, selected }: NodeProps<BranchNodeType>) {
  const dotColor = (data.color as string) || "#3B82F6";
  const status = statusStyles[(data.status as string) || "research"] || statusStyles.research;

  return (
    <div className="flex flex-col items-center cursor-pointer group">
      <div className="flex items-center gap-1 mb-1">
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
        <span className={`text-[9px] font-medium ${status.text}`}>{data.status}</span>
        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 ml-0.5">{data.year}</span>
      </div>
      <div
        className={`
          relative rounded-sm transition-all duration-200
          group-hover:scale-125 group-hover:shadow-lg w-3.5 h-3.5
          ${selected ? "ring-2 ring-gray-400/40 dark:ring-white/40 scale-125" : ""}
        `}
        style={{
          backgroundColor: dotColor,
          boxShadow: selected ? `0 0 16px ${dotColor}60` : `0 0 8px ${dotColor}30`,
        }}
      />
      <div className="mt-2 flex flex-col items-center max-w-[120px]">
        <div className="text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight whitespace-nowrap">
          {data.label}
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-snug mt-0.5 whitespace-nowrap">
          {data.shortInfo}
        </div>
        {data.authors && (data.authors as string[]).length > 0 && (
          <div className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 truncate max-w-[120px]">
            {(data.authors as string[]).slice(0, 2).join(", ")}
          </div>
        )}
        {data.bips && (data.bips as number[]).length > 0 && (
          <div className="flex gap-0.5 mt-1">
            {(data.bips as number[]).map((bip) => (
              <span key={bip} className="text-[8px] font-mono px-1 py-px rounded bg-blue-500/10 text-blue-500/70 dark:text-blue-400/70">
                {bip}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-0 !h-0 !bg-transparent !border-0 !-left-1" />
      <Handle type="source" position={Position.Right} id="right" className="!w-0 !h-0 !bg-transparent !border-0 !-right-1" />
      <Handle type="target" position={Position.Top} id="top" className="!w-0 !h-0 !bg-transparent !border-0 !top-[10px]" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !bg-transparent !border-0 !top-[18px]" />
    </div>
  );
}
