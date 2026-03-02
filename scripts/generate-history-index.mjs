#!/usr/bin/env node
/**
 * Generates public/history-index.json from all *.json files in public/
 * (excluding history-index.json itself).
 * Run before build so PRs only need to add a JSON file.
 */
import { readdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const files = readdirSync(publicDir)
  .filter((f) => f.endsWith(".json") && f !== "history-index.json")
  .sort();

writeFileSync(join(publicDir, "history-index.json"), JSON.stringify(files, null, 2));
console.log("Generated history-index.json:", files);
