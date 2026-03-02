import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { BitcoinHistoryFlow } from "@/components/BitcoinHistoryFlow";
import { ThemeCtx, useThemeProvider } from "@/lib/useTheme";
import { GraphStoreCtx, useGraphStoreProvider } from "@/lib/useGraphStore";
import { parsePastedJson } from "@/lib/serialization";
import { normalizeHistoryData } from "@/types/historySchema";
import type { BitcoinHistoryJson } from "@/types/historySchema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, ArrowRight, AlertCircle } from "lucide-react";

const BASE = import.meta.env.BASE_URL || "/";
const PROMPT_URL = `${BASE}bitcoin-history-prompt.md`;

export function EditPage() {
  const themeCtx = useThemeProvider();
  const [promptMarkdown, setPromptMarkdown] = useState<string>("");
  const [pastedJson, setPastedJson] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadedData, setLoadedData] = useState<BitcoinHistoryJson | null>(null);

  useEffect(() => {
    fetch(PROMPT_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("Failed to load prompt"))))
      .then(setPromptMarkdown)
      .catch(() => setPromptMarkdown("# Could not load prompt.\n\nCheck that `public/bitcoin-history-prompt.md` exists."));
  }, []);

  const handleLoad = useCallback(() => {
    setLoadError(null);
    if (!pastedJson.trim()) return;
    try {
      const data = parsePastedJson(pastedJson.trim());
      setLoadedData(normalizeHistoryData(data));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Invalid JSON");
    }
  }, [pastedJson]);

  const handleCopyPrompt = useCallback(async () => {
    if (!promptMarkdown) return;
    // Extract content of the main prompt block (between first ``` and last ```)
    const first = promptMarkdown.indexOf("```");
    const last = promptMarkdown.lastIndexOf("```");
    const toCopy =
      first >= 0 && last > first
        ? promptMarkdown
            .slice(first + 3, last)
            .replace(/^[a-zA-Z]+\n?/, "")
            .trim()
        : promptMarkdown;
    await navigator.clipboard.writeText(toCopy);
  }, [promptMarkdown]);

  return (
    <ThemeCtx.Provider value={themeCtx}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#0a0a1a]">
        <aside className="w-[380px] shrink-0 flex flex-col border-r border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
            <Link to="/" className="text-sm font-medium text-orange-500 hover:text-orange-600">
              ← Back to graph
            </Link>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">AI Prompt</h2>
                <Button size="xs" variant="outline" onClick={handleCopyPrompt}>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-[#0f0f23] rounded-lg p-3 max-h-48 overflow-y-auto font-mono whitespace-pre-wrap">
                {promptMarkdown || "Loading…"}
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Paste AI output
              </h2>
              <Textarea
                placeholder='Paste the JSON from your AI here (e.g. {"version":1,"nodes":[...], ...})'
                value={pastedJson}
                onChange={(e) => setPastedJson(e.target.value)}
                className="min-h-32 font-mono text-xs"
              />
              {loadError && (
                <div className="mt-2 flex items-start gap-2 text-red-500 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{loadError}</span>
                </div>
              )}
              <Button className="mt-2 w-full" onClick={handleLoad}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Load & View
              </Button>
            </div>
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          {loadedData ? (
            <EditPageGraphProvider initialData={loadedData} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center max-w-sm">
                <p className="text-sm">Copy the prompt above, send it to any AI, then paste the JSON here.</p>
                <p className="text-xs mt-2 text-gray-400">Compare different models’ Bitcoin history compilations.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </ThemeCtx.Provider>
  );
}

function EditPageGraphProvider({ initialData }: { initialData: BitcoinHistoryJson }) {
  const store = useGraphStoreProvider(initialData);
  return (
    <GraphStoreCtx.Provider value={store}>
      <ReactFlowProvider>
        <BitcoinHistoryFlow
          sourceIndex={[]}
          selectedSource={null}
          onSourceChange={() => {}}
        />
      </ReactFlowProvider>
    </GraphStoreCtx.Provider>
  );
}
