import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { BitcoinNodeData } from "@/data/bitcoinHistory";

export type TimelineDotType = Node<BitcoinNodeData, "timelineDot">;

export function TimelineDotNode({ data, selected }: NodeProps<TimelineDotType>) {
  const dotColor = (data.color as string) || "#F7931A";
  const isGenesis = data.category === "genesis";

  return (
    <div className="flex flex-col items-center cursor-pointer group">
      <div className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-1 whitespace-nowrap">
        {data.year}
      </div>
      {data.elapsedFromPrev && (
        <div className="absolute -top-5 left-1/2 translate-x-2 text-[9px] font-mono text-orange-500/60 dark:text-orange-400/60 whitespace-nowrap">
          +{data.elapsedFromPrev as string}
        </div>
      )}
      <div
        className={`
          relative rounded-full transition-all duration-200
          group-hover:scale-125 group-hover:shadow-lg
          ${isGenesis ? "w-5 h-5" : "w-3.5 h-3.5"}
          ${selected ? "ring-2 ring-gray-400/40 dark:ring-white/40 scale-125" : ""}
        `}
        style={{
          backgroundColor: dotColor,
          boxShadow: selected ? `0 0 16px ${dotColor}60` : `0 0 8px ${dotColor}30`,
        }}
      />
      <div className="mt-2 flex flex-col items-center max-w-[120px]">
        <div className={`text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight whitespace-nowrap ${isGenesis ? "text-sm" : ""}`}>
          {data.label}
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center leading-snug mt-0.5 whitespace-nowrap">
          {data.shortInfo}
        </div>
        {data.bips && (data.bips as number[]).length > 0 && (
          <div className="flex gap-0.5 mt-1">
            {(data.bips as number[]).map((bip) => (
              <span key={bip} className="text-[8px] font-mono px-1 py-px rounded bg-orange-500/10 text-orange-500/70 dark:text-orange-400/70">
                {bip}
              </span>
            ))}
          </div>
        )}
      </div>
      <Handle type="target" position={Position.Left} className="!w-0 !h-0 !bg-transparent !border-0 !-left-1" />
      <Handle type="source" position={Position.Right} className="!w-0 !h-0 !bg-transparent !border-0 !-right-1" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !bg-transparent !border-0 !top-[18px]" />
      <Handle type="target" position={Position.Top} id="top" className="!w-0 !h-0 !bg-transparent !border-0 !top-[10px]" />
    </div>
  );
}
