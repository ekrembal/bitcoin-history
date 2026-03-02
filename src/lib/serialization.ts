import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { BitcoinHistoryJson, VisualOverrides, SharePayload } from "@/types/historySchema";

const URL_HASH_PREFIX = "graph=";
const MAX_URL_LENGTH = 2000;

function quickHash(data: BitcoinHistoryJson): string {
  const json = JSON.stringify(data);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function serialize(data: BitcoinHistoryJson, visual: VisualOverrides): string {
  const payload: SharePayload = {
    v: 2,
    hash: quickHash(data),
    data,
    visual,
  };
  return JSON.stringify(payload);
}

function deserialize(json: string): SharePayload {
  const payload = JSON.parse(json);
  if (payload.v === 2) return payload as SharePayload;
  throw new Error(`Unsupported share format version: ${payload.v}`);
}

export function getShareUrl(
  data: BitcoinHistoryJson,
  visual: VisualOverrides
): { type: "url"; url: string } | { type: "too-large" } {
  const json = serialize(data, visual);
  const compressed = compressToEncodedURIComponent(json);
  const hash = `#${URL_HASH_PREFIX}${compressed}`;
  const fullUrl = window.location.origin + window.location.pathname + hash;
  if (fullUrl.length <= MAX_URL_LENGTH) return { type: "url", url: fullUrl };
  return { type: "too-large" };
}

export function loadFromUrlHash(): SharePayload | null {
  const hash = window.location.hash;
  if (!hash.startsWith(`#${URL_HASH_PREFIX}`)) return null;
  try {
    const compressed = hash.slice(1 + URL_HASH_PREFIX.length);
    const json = decompressFromEncodedURIComponent(compressed);
    if (!json) return null;
    return deserialize(json);
  } catch {
    return null;
  }
}

export async function exportToFile(
  data: BitcoinHistoryJson,
  visual: VisualOverrides
): Promise<void> {
  const hash = quickHash(data);
  const payload: SharePayload = { v: 2, hash, data, visual };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bitcoin-history-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromFile(file: File): Promise<SharePayload> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(deserialize(reader.result as string));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export function importRawHistoryJson(file: File): Promise<BitcoinHistoryJson> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parsePastedJson(reader.result as string));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** Parse pasted/string JSON into BitcoinHistoryJson. Supports raw history or SharePayload format. */
export function parsePastedJson(json: string): BitcoinHistoryJson {
  const parsed = JSON.parse(json) as unknown;
  if (typeof parsed !== "object" || parsed === null) throw new Error("Invalid JSON");
  if ("v" in parsed && parsed.v === 2 && "data" in parsed)
    return parsed.data as BitcoinHistoryJson;
  if ("version" in parsed && parsed.version === 1 && "nodes" in parsed)
    return parsed as BitcoinHistoryJson;
  throw new Error("Unrecognized JSON format. Need version:1 with nodes, or SharePayload format.");
}
