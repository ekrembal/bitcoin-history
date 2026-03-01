import { useCallback } from "react";
import { X, ExternalLink, ArrowLeft } from "lucide-react";
import type { DetailContent } from "@/data/bitcoinHistory";

interface DetailPanelProps {
  content: DetailContent | null;
  onClose: () => void;
}

export function DetailPanel({ content, onClose }: DetailPanelProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onKeyDown={handleKeyDown}>
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-white/95 dark:bg-[#0f0f23]/95 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#0f0f23]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to graph</span>
              <span className="sm:hidden">Back</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="px-4 sm:px-6 pb-3 sm:pb-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
              {content.title}
            </h1>
            {content.subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-mono">{content.subtitle}</p>
            )}
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-sm font-semibold text-orange-500 dark:text-orange-400/90 uppercase tracking-wider mb-2">
                {section.heading}
              </h2>
              {section.type === "list" && section.items ? (
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-500/60 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{section.content}</p>
              )}
            </div>
          ))}
          {content.links && content.links.length > 0 && (
            <div className="pt-4 border-t border-gray-200 dark:border-white/5">
              <h2 className="text-sm font-semibold text-orange-500 dark:text-orange-400/90 uppercase tracking-wider mb-3">
                Primary Sources
              </h2>
              <div className="space-y-2">
                {content.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                    <span className="underline underline-offset-2 decoration-blue-400/30 group-hover:decoration-blue-300/60">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
