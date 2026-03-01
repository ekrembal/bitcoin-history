import { useEffect, useState } from "react";
import type { HistoryData, HistoryNode } from "@/types/history";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL || "/";

function parseLinkUrl(url: string): string {
  const m = url.match(/\[([^\]]*)\]\((https?:\/\/[^)]+)\)$/);
  return m ? m[2] : url;
}

function NodeCard({ node, defaultExpanded = false }: { node: HistoryNode; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <Card
      data-slot="card"
      className={cn(
        "transition-colors hover:ring-foreground/15",
        expanded && "ring-foreground/15 ring-2"
      )}
    >
      <CardHeader className="cursor-pointer py-3" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {node.year}
              </span>
              <CardTitle className="text-base">{node.label}</CardTitle>
              <Badge variant="outline" className="text-xs capitalize">
                {node.category}
              </Badge>
              {node.status !== "deployed" && (
                <Badge variant="secondary" className="text-xs">
                  {node.status}
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{node.shortInfo}</CardDescription>
          </div>
          {expanded ? (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="border-t pt-3">
          <p className="text-muted-foreground text-sm">{node.description}</p>
          {node.authors && node.authors.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {node.authors.join(", ")}
              {node.bips && node.bips.length > 0 && ` · BIP ${node.bips.join(", ")}`}
            </p>
          )}
          {node.sections && node.sections.length > 0 && (
            <div className="mt-3 space-y-2">
              {node.sections.map((s, i) => (
                <div key={i}>
                  <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {s.heading}
                  </h4>
                  {s.type === "text" && s.content && (
                    <p className="mt-0.5 text-sm">{s.content}</p>
                  )}
                  {s.type === "list" && s.items && (
                    <ul className="mt-0.5 list-inside list-disc text-sm">
                      {s.items.map((item, j) => (
                        <li key={j}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          {node.links && node.links.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {node.links.map((link) => {
                const href = parseLinkUrl(link.url);
                return (
                  <a
                    key={link.label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs underline underline-offset-2 hover:no-underline"
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function HistoryBrowser() {
  const [index, setIndex] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE}history-index.json`)
      .then((r) => r.json())
      .then(setIndex)
      .catch(() => setIndex(["gemini-pro.json"]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selected) {
      setData(null);
      return;
    }
    setError(null);
    fetch(`${BASE}${selected}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${selected}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [selected]);

  useEffect(() => {
    if (index.length > 0 && !selected) setSelected(index[0]);
  }, [index, selected]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Bitcoin History</h1>
        <p className="text-muted-foreground text-sm">
          Browse AI-generated Bitcoin technical history timelines
        </p>
        <div className="mt-3">
          <Select value={selected ?? ""} onValueChange={setSelected}>
            <SelectTrigger className="w-full max-w-[280px]">
              <SelectValue placeholder="Select timeline" />
            </SelectTrigger>
            <SelectContent>
              {index.map((file) => (
                <SelectItem key={file} value={file}>
                  {file.replace(".json", "")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {error && (
        <p className="text-destructive text-sm">{error}</p>
      )}

      {data && (
        <>
          <div className="mb-6 rounded-lg border bg-muted/30 px-4 py-3">
            <h2 className="font-medium">{data.title}</h2>
            <p className="text-muted-foreground text-sm">{data.description}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data.author} · {data.generatedAt}
            </p>
          </div>

          <div className="space-y-3">
            {data.nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        </>
      )}

      {!data && !error && selected && (
        <div className="flex min-h-[20vh] items-center justify-center text-muted-foreground">
          Loading timeline…
        </div>
      )}
    </div>
  );
}
