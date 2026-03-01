import { useState, useEffect, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { BitcoinHistoryFlow } from "@/components/BitcoinHistoryFlow";
import { ThemeCtx, useThemeProvider } from "@/lib/useTheme";
import { GraphStoreCtx, useGraphStoreProvider } from "@/lib/useGraphStore";
import { loadFromUrlHash } from "@/lib/serialization";
import { normalizeHistoryData } from "@/types/historySchema";
import type { BitcoinHistoryJson } from "@/types/historySchema";

const BASE = import.meta.env.BASE_URL || "/";

function GraphStoreInner({
  initialData,
  sourceIndex,
  selectedSource,
  onSourceChange,
}: {
  initialData: BitcoinHistoryJson | null;
  sourceIndex: string[];
  selectedSource: string | null;
  onSourceChange: (file: string) => void;
}) {
  const store = useGraphStoreProvider(initialData);

  const handleSourceChange = useCallback(
    async (file: string) => {
      onSourceChange(file);
      try {
        const res = await fetch(`${BASE}${file}`);
        if (!res.ok) return;
        const data = (await res.json()) as BitcoinHistoryJson;
        store.loadHistoryJson(data);
      } catch {
        console.warn("Failed to load", file);
      }
    },
    [store, onSourceChange]
  );

  return (
    <GraphStoreCtx.Provider value={store}>
      <BitcoinHistoryFlow
        sourceIndex={sourceIndex}
        selectedSource={selectedSource}
        onSourceChange={handleSourceChange}
      />
    </GraphStoreCtx.Provider>
  );
}

export default function App() {
  const themeCtx = useThemeProvider();
  const [sourceIndex, setSourceIndex] = useState<string[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<BitcoinHistoryJson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromUrl = loadFromUrlHash();
    if (fromUrl) {
      setInitialData(normalizeHistoryData(fromUrl.data));
      setSourceIndex(["gemini-pro.json"]);
      setSelectedSource("gemini-pro.json");
      setLoading(false);
      return;
    }
    fetch(`${BASE}history-index.json`)
      .then((r) => r.json())
      .then((index: string[]) => {
        setSourceIndex(index.length ? index : ["gemini-pro.json"]);
        const first = index.length ? index[0] : "gemini-pro.json";
        setSelectedSource(first);
        return fetch(`${BASE}${first}`).then((res) => res.json());
      })
      .then((data: BitcoinHistoryJson) => {
        setInitialData(normalizeHistoryData(data));
      })
      .catch(() => {
        setSourceIndex(["gemini-pro.json"]);
        setSelectedSource("gemini-pro.json");
        return fetch(`${BASE}gemini-pro.json`).then((r) => r.json());
      })
      .then((data?: BitcoinHistoryJson) => {
        if (data) setInitialData(normalizeHistoryData(data));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#0a0a1a]">
        <div className="text-gray-500 dark:text-gray-400">Loading Bitcoin History…</div>
      </div>
    );
  }

  return (
    <ThemeCtx.Provider value={themeCtx}>
      <ReactFlowProvider>
        <GraphStoreInner
          initialData={initialData}
          sourceIndex={sourceIndex}
          selectedSource={selectedSource}
          onSourceChange={setSelectedSource}
        />
      </ReactFlowProvider>
    </ThemeCtx.Provider>
  );
}
