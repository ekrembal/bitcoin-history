# Bitcoin History Graph — AI Prompt

Use this prompt to ask any AI to generate a Bitcoin history JSON for the graph tool.

---

## Copy this prompt:

```
Generate a JSON file describing Bitcoin's technical history for visualization in an interactive graph tool.

The JSON must follow this exact structure:

```json
{
  "version": 1,
  "title": "Bitcoin Technical History",
  "description": "Your description here",
  "author": "model-name",
  "generatedAt": "YYYY-MM-DD",
  "nodes": [...],
  "connections": [...]
}
```

**Node categories:**
- `"genesis"` — exactly one node for the Bitcoin whitepaper (2008)
- `"softfork"` — consensus changes activated on Bitcoin
- `"breakthrough"` — research innovations and protocols
- `"proposed"` — active proposals not yet activated

**Each node must have:**
- `id`: unique kebab-case string (prefix with `sf-` for softforks, `bt-` for breakthroughs, `pr-` for proposed)
- `category`: one of the four categories above
- `label`: display name
- `year`: year as string
- `status`: `"deployed"`, `"experimental"`, `"research"`, or `"proposed"`
- `shortInfo`: one-line summary

**Optional but encouraged:**
- `date`: specific date string for accurate timeline ordering
- `authors`: array of key contributors
- `bips`: array of related BIP numbers
- `sections`: array of `{ heading, content, type?, items? }` for detailed explanations
- `links`: array of `{ label, url }` for references

**Connections array** — each entry: `{ "from": "id", "to": "id", "relationship": "type" }`
- `"timeline"`: chain softforks chronologically (genesis → first-sf → second-sf → ...)
- `"dependency"`: a node technically depends on or was enabled by another
- `"proposed-dependency"`: a proposed feature would enable something

**Important rules:**
1. Do NOT include any position, color, x, y, or layout information — the tool auto-layouts everything
2. Be thorough — include all major softforks, significant research breakthroughs, and notable proposals
3. Use accurate dates and BIP numbers
4. Make the `sections` content informative — this is what users read when they click a node
5. Timeline connections must chain ALL softforks in chronological order
6. Show dependency relationships
7. Output ONLY the raw JSON, no markdown code fences, no explanation
```
