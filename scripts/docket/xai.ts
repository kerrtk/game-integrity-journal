// Thin client for the xAI Responses API with server-side X search and web search.
// Docs: https://docs.x.ai/developers/tools/x-search

import type { RawCandidate } from "./types.ts"

export interface SearchResult {
  candidates: RawCandidate[]
  citations: string[]
  searchCalls: number
}

const ENDPOINT = "https://api.x.ai/v1/responses"

/** Walk the response and collect every cited URL, whatever shape the annotations take. */
export function collectCitations(node: unknown, out: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) {
    for (const v of node) collectCitations(v, out)
  } else if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>
    if (Array.isArray(obj.citations)) {
      for (const c of obj.citations) {
        if (typeof c === "string") out.add(c)
        else if (c && typeof c === "object" && typeof (c as { url?: unknown }).url === "string") out.add((c as { url: string }).url)
      }
    }
    if (Array.isArray(obj.annotations)) {
      for (const a of obj.annotations) {
        const url = (a as { url?: unknown })?.url
        if (typeof url === "string") out.add(url)
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k !== "citations" && k !== "annotations") collectCitations(v, out)
    }
  }
  return out
}

export function outputText(resp: Record<string, unknown>): string {
  if (typeof resp.output_text === "string") return resp.output_text
  const parts: string[] = []
  for (const item of (resp.output as unknown[]) ?? []) {
    const content = (item as { content?: unknown[] })?.content
    for (const c of content ?? []) {
      const t = (c as { type?: string; text?: string })
      if ((t.type === "output_text" || t.type === "text") && typeof t.text === "string") parts.push(t.text)
    }
  }
  return parts.join("\n")
}

/** Pull the first JSON object out of the model's text, tolerating code fences. */
export function parseItems(text: string): RawCandidate[] {
  const cleaned = text.replace(/```(?:json)?/gi, "")
  const start = cleaned.indexOf("{")
  const end = cleaned.lastIndexOf("}")
  if (start < 0 || end <= start) return []
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as { items?: RawCandidate[] }
    return Array.isArray(parsed.items) ? parsed.items : []
  } catch {
    return []
  }
}

export async function searchLeague(opts: {
  apiKey: string
  model: string
  system: string
  prompt: string
  fromDate: string
  toDate: string
  leagueName: string
}): Promise<SearchResult> {
  const body = {
    model: opts.model,
    input: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.prompt },
    ],
    tools: [
      { type: "x_search", from_date: opts.fromDate, to_date: opts.toDate },
      { type: "web_search" },
    ],
  }

  let lastError = ""
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${opts.apiKey}` },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const json = (await res.json()) as Record<string, unknown>
      const text = outputText(json)
      const candidates = parseItems(text).map((c) => ({ ...c, league: c.league || opts.leagueName }))
      const usage = json.usage as { server_side_tool_usage_details?: Record<string, number> } | undefined
      const searchCalls = Object.values(usage?.server_side_tool_usage_details ?? {}).reduce(
        (n, v) => n + (typeof v === "number" ? v : 0),
        0,
      )
      return { candidates, citations: [...collectCitations(json)], searchCalls }
    }
    lastError = `${res.status} ${await res.text().catch(() => "")}`.slice(0, 500)
    // Only retry server-side hiccups, never auth or bad-request errors.
    if (res.status < 500) break
    await new Promise((r) => setTimeout(r, 3000))
  }
  throw new Error(`xAI request failed for ${opts.leagueName}: ${lastError}`)
}
