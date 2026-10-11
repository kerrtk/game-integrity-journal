import fs from "node:fs"
import path from "node:path"
import { z } from "zod"

// Site-side reader for The Daily Docket. The overnight script (scripts/docket/run.ts)
// writes one JSON file per day into content/docket/; merging the review PR publishes it.

const itemSchema = z.object({
  id: z.string(),
  league: z.string(),
  type: z.enum(["officiating", "coaching", "league-ops", "replay-tech"]),
  headline: z.string().min(1),
  whatHappened: z.string().min(1),
  ruleAtIssue: z.string().default(""),
  leagueResponse: z.enum(["statement", "fine-or-discipline", "review-report", "none-yet", "unknown"]),
  leagueResponseNote: z.string().default(""),
  sourceStrength: z.enum(["official", "multiple-reporters", "viral-only"]),
  heat: z.number().int().min(1).max(3),
  sources: z.array(z.object({ url: z.string().url(), label: z.string() })).min(1),
  status: z.enum(["verified", "developing"]),
  reviewFlags: z.array(z.string()).default([]),
})

const docketSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coverageFrom: z.string(),
  coverageTo: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  leagues: z.array(z.string()),
  sample: z.boolean().default(false),
  items: z.array(itemSchema),
  stats: z.object({
    candidates: z.number(),
    kept: z.number(),
    droppedViralOnly: z.number(),
    droppedNoSource: z.number(),
    droppedDuplicate: z.number(),
  }).passthrough(),
})

export type Docket = z.infer<typeof docketSchema>
export type DocketItem = z.infer<typeof itemSchema>

const DOCKET_DIR = path.join(process.cwd(), "content", "docket")
const SAMPLE_FILE = path.join(process.cwd(), "scripts", "docket", "fixtures", "sample-docket.json")

const isProduction = process.env.VERCEL_ENV === "production"

function readDocket(file: string): Docket {
  const parsed = docketSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")))
  if (!parsed.success) {
    throw new Error(`Invalid docket ${path.basename(file)}: ${parsed.error.message}`)
  }
  return parsed.data
}

let cache: Docket[] | null = null

export function getAllDockets(): Docket[] {
  if (cache) return cache
  const files = fs.existsSync(DOCKET_DIR)
    ? fs.readdirSync(DOCKET_DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    : []
  // Sample data can never reach the production site, even if a sample file is merged by mistake.
  let dockets = files.map((f) => readDocket(path.join(DOCKET_DIR, f))).filter((d) => !d.sample || !isProduction)

  // Previews with no real dockets yet show the clearly labeled sample so the design can be reviewed.
  if (!dockets.length && !isProduction && fs.existsSync(SAMPLE_FILE)) {
    dockets = [readDocket(SAMPLE_FILE)]
  }

  cache = dockets.sort((a, b) => b.date.localeCompare(a.date))
  return cache
}

export function getDocket(date: string): Docket | undefined {
  return getAllDockets().find((d) => d.date === date)
}

export const TYPE_LABEL: Record<DocketItem["type"], string> = {
  officiating: "Officiating",
  coaching: "Coaching",
  "league-ops": "League ops",
  "replay-tech": "Replay & tech",
}

export const RESPONSE_LABEL: Record<DocketItem["leagueResponse"], string> = {
  statement: "Statement issued",
  "fine-or-discipline": "Fine or discipline",
  "review-report": "Review report",
  "none-yet": "No response yet",
  unknown: "Response unclear",
}

export function prettyDocketDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}
