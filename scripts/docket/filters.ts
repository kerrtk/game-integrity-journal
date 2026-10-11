// The editorial gate. Everything Grok finds passes through here before a human sees it.
// Rules enforced in code (not just asked for in the prompt):
//   1. Officials are never named. Role + name becomes just the role.
//   2. Viral-only claims are dropped. Every kept item needs a real source link.
//   3. Duplicates collapse, and the docket stays short enough to review in ten minutes.

import type {
  DocketItem,
  DocketSource,
  DocketStats,
  IssueType,
  LeagueResponse,
  RawCandidate,
  SourceStrength,
} from "./types.ts"

const ISSUE_TYPES: IssueType[] = ["officiating", "coaching", "league-ops", "replay-tech"]
const STRENGTHS: SourceStrength[] = ["official", "multiple-reporters", "viral-only"]
const RESPONSES: LeagueResponse[] = ["statement", "fine-or-discipline", "review-report", "none-yet", "unknown"]

// Role words that, when followed by a capitalized name, signal an official being named.
const ROLE_WORDS = [
  "crew chief",
  "replay official",
  "line judge",
  "back judge",
  "field judge",
  "side judge",
  "down judge",
  "head linesman",
  "linesperson",
  "linesman",
  "referees",
  "referee",
  "umpires",
  "umpire",
  "refs",
  "ref",
  "umps",
  "ump",
]

// Capitalized words that follow a role word but are not names ("the refs Saturday night").
const NOT_NAMES = new Set([
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
  "January", "February", "March", "April", "May", "June", "July", "August",
  "September", "October", "November", "December", "Tonight", "Today", "Yesterday",
  "Last", "In", "On", "At", "During", "After", "Before", "And", "But", "Then", "Was", "Who",
])

const NAME_WORD = "[A-Z][a-z'’.\\-]+"
// Case-insensitive on the role word only ("Referee" or "referee"); names must stay capitalized,
// so the pattern is case-sensitive overall.
const roleAlt = (r: string) =>
  r
    .split(" ")
    .map((w) => `[${w[0].toUpperCase()}${w[0]}]${w.slice(1)}`)
    .join("\\s+")
const ROLE_PATTERN = new RegExp(
  `\\b(the\\s+|The\\s+)?(${ROLE_WORDS.map(roleAlt).join("|")})\\s+(${NAME_WORD}(?:\\s+${NAME_WORD}){0,2})(['’]s)?`,
  "g",
)
const CREW_PATTERN = new RegExp(`\\b(${NAME_WORD}(?:\\s+${NAME_WORD}){0,2})['’]s\\s+(officiating\\s+)?crew\\b`, "g")

export interface RedactResult {
  text: string
  count: number
}

/** Remove officials' names. `blocklist` is a list of names TK never wants printed. */
export function redactOfficials(input: string, blocklist: string[] = []): RedactResult {
  let count = 0
  let text = input

  text = text.replace(ROLE_PATTERN, (match, the: string | undefined, role: string, name: string, poss: string | undefined) => {
    const firstWord = name.split(/\s+/)[0]
    if (NOT_NAMES.has(firstWord)) return match
    // The role word itself is matched case-insensitively, but a name must start with a capital.
    if (!/^[A-Z]/.test(name)) return match
    count++
    // Names may contain apostrophes (O'Brien), so a trailing possessive can land inside the name.
    const trailing = name.match(/['’]s$/)
    if (trailing && !poss) poss = trailing[0]
    const lead = the ? (the.startsWith("T") ? "The " : "the ") : "the "
    // Keep sentence-initial capitalization when the match opened a sentence.
    const startsUpper = !the && /^[A-Z]/.test(role)
    const out = `${startsUpper ? "The " : lead}${role.toLowerCase().replace(/\s+/g, " ")}${poss ?? ""}`
    return out
  })

  text = text.replace(CREW_PATTERN, (match, name: string) => {
    if (NOT_NAMES.has(name.split(/\s+/)[0])) return match
    count++
    return "the officiating crew"
  })

  for (const raw of blocklist) {
    const name = raw.trim()
    if (!name) continue
    const re = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
    text = text.replace(re, () => {
      count++
      return "the official"
    })
  }

  // Tidy doubled articles produced by a replacement ("the the referee").
  text = text.replace(/\b(the)\s+the\b/gi, "$1")
  return { text, count }
}

export function normalizeUrl(u: string): string {
  try {
    const url = new URL(u.trim())
    let host = url.hostname.replace(/^www\./, "").replace(/^mobile\./, "")
    if (host === "twitter.com") host = "x.com"
    return `${host}${url.pathname.replace(/\/+$/, "")}`.toLowerCase()
  } catch {
    return u.trim().toLowerCase()
  }
}

function cleanSources(raw: RawCandidate["sources"]): DocketSource[] {
  const seen = new Set<string>()
  const out: DocketSource[] = []
  for (const s of raw ?? []) {
    const url = (s?.url ?? "").trim()
    if (!/^https?:\/\//i.test(url)) continue
    const key = normalizeUrl(url)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ url, label: (s?.label ?? "").trim() || new URL(url).hostname.replace(/^www\./, "") })
  }
  return out.slice(0, 4)
}

function words(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3),
  )
}

function similar(a: string, b: string): boolean {
  const A = words(a)
  const B = words(b)
  if (!A.size || !B.size) return false
  let shared = 0
  for (const w of A) if (B.has(w)) shared++
  return shared / Math.min(A.size, B.size) >= 0.6
}

export interface GateOptions {
  date: string
  blocklist?: string[]
  // URLs Grok actually cited during its searches. Empty = unknown (no check possible).
  citations?: string[]
  maxItems?: number
  maxPerLeague?: number
}

export function gateCandidates(candidates: RawCandidate[], opts: GateOptions): { items: DocketItem[]; stats: DocketStats } {
  const stats: DocketStats = {
    candidates: candidates.length,
    kept: 0,
    droppedInvalid: 0,
    droppedViralOnly: 0,
    droppedNoSource: 0,
    droppedDuplicate: 0,
    droppedOverCap: 0,
    redactions: 0,
  }
  const blocklist = opts.blocklist ?? []
  const cited = new Set((opts.citations ?? []).map(normalizeUrl))
  const maxItems = opts.maxItems ?? 12
  const maxPerLeague = opts.maxPerLeague ?? 4

  const accepted: DocketItem[] = []

  for (const c of candidates) {
    const headline = (c.headline ?? "").trim()
    const whatHappened = (c.whatHappened ?? "").trim()
    const league = (c.league ?? "").trim()
    if (!headline || !whatHappened || !league) {
      stats.droppedInvalid++
      continue
    }

    const strength = (STRENGTHS as string[]).includes(c.sourceStrength ?? "")
      ? (c.sourceStrength as SourceStrength)
      : "viral-only"
    if (strength === "viral-only") {
      stats.droppedViralOnly++
      continue
    }

    const sources = cleanSources(c.sources)
    if (!sources.length) {
      stats.droppedNoSource++
      continue
    }

    const flags: string[] = []
    const fields = {
      headline: redactOfficials(headline, blocklist),
      whatHappened: redactOfficials(whatHappened, blocklist),
      ruleAtIssue: redactOfficials((c.ruleAtIssue ?? "").trim(), blocklist),
      leagueResponseNote: redactOfficials((c.leagueResponseNote ?? "").trim(), blocklist),
    }
    const redacted = Object.values(fields).reduce((n, r) => n + r.count, 0)
    for (const s of sources) {
      const r = redactOfficials(s.label, blocklist)
      s.label = r.text
      stats.redactions += r.count
    }
    if (redacted) {
      stats.redactions += redacted
      flags.push("An official's name was removed. Reread the wording.")
    }

    const lowerUrls = sources.map((s) => s.url.toLowerCase())
    for (const name of blocklist) {
      const slug = name.trim().toLowerCase().replace(/\s+/g, "")
      if (slug && lowerUrls.some((u) => u.replace(/[-_]/g, "").includes(slug))) {
        flags.push("A source link may name an official. Check it or swap the link.")
        break
      }
    }

    if (cited.size && !sources.some((s) => cited.has(normalizeUrl(s.url)))) {
      flags.push("None of these links appeared in Grok's search results. Open each one before approving.")
    }

    let type = (c.type ?? "") as IssueType
    if (!ISSUE_TYPES.includes(type)) {
      type = "league-ops"
      flags.push("Category was unclear and defaulted to league operations.")
    }
    const leagueResponse = (RESPONSES as string[]).includes(c.leagueResponse ?? "")
      ? (c.leagueResponse as LeagueResponse)
      : "unknown"
    const heatNum = Math.round(Number(c.heat))
    const heat = (heatNum >= 3 ? 3 : heatNum <= 1 ? 1 : 2) as 1 | 2 | 3

    const item: DocketItem = {
      id: "",
      league,
      type,
      headline: fields.headline.text,
      whatHappened: fields.whatHappened.text,
      ruleAtIssue: fields.ruleAtIssue.text,
      leagueResponse,
      leagueResponseNote: fields.leagueResponseNote.text,
      sourceStrength: strength,
      heat,
      sources,
      status: strength === "official" ? "verified" : "developing",
      reviewFlags: flags,
    }

    if (accepted.some((a) => a.league === item.league && similar(a.headline, item.headline))) {
      stats.droppedDuplicate++
      continue
    }
    accepted.push(item)
  }

  // Hottest and best-sourced first.
  accepted.sort((a, b) => b.heat - a.heat || (a.status === "verified" ? -1 : 1) - (b.status === "verified" ? -1 : 1))

  const perLeague = new Map<string, number>()
  const items: DocketItem[] = []
  for (const item of accepted) {
    const n = perLeague.get(item.league) ?? 0
    if (n >= maxPerLeague || items.length >= maxItems) {
      stats.droppedOverCap++
      continue
    }
    perLeague.set(item.league, n + 1)
    items.push(item)
  }

  items.forEach((item, i) => {
    item.id = `${opts.date}-${String(i + 1).padStart(2, "0")}`
  })
  stats.kept = items.length
  return { items, stats }
}
