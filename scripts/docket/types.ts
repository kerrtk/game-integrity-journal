// Shared shapes for The Daily Docket pipeline.
// Kept dependency-free so the script runs with plain `node --experimental-strip-types`.

export type IssueType = "officiating" | "coaching" | "league-ops" | "replay-tech"
export type SourceStrength = "official" | "multiple-reporters" | "viral-only"
export type LeagueResponse = "statement" | "fine-or-discipline" | "review-report" | "none-yet" | "unknown"

export interface DocketSource {
  url: string
  label: string
}

export interface DocketItem {
  id: string
  league: string
  type: IssueType
  headline: string
  whatHappened: string
  ruleAtIssue: string
  leagueResponse: LeagueResponse
  leagueResponseNote: string
  sourceStrength: SourceStrength
  heat: 1 | 2 | 3
  sources: DocketSource[]
  // "verified" = official source behind it, "developing" = multiple credible reporters.
  status: "verified" | "developing"
  // Set by the pipeline when something needs a closer human look before merge.
  reviewFlags: string[]
}

export interface DocketStats {
  candidates: number
  kept: number
  droppedInvalid: number
  droppedViralOnly: number
  droppedNoSource: number
  droppedDuplicate: number
  droppedOverCap: number
  redactions: number
}

export interface Docket {
  date: string // YYYY-MM-DD, the morning the docket is published
  coverageFrom: string
  coverageTo: string
  generatedAt: string
  model: string
  leagues: string[]
  sample: boolean
  items: DocketItem[]
  stats: DocketStats
}

// What we ask Grok to return for each league.
export interface RawCandidate {
  league?: string
  type?: string
  headline?: string
  whatHappened?: string
  ruleAtIssue?: string
  leagueResponse?: string
  leagueResponseNote?: string
  sourceStrength?: string
  heat?: number
  sources?: { url?: string; label?: string }[]
}
