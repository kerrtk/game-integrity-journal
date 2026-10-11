// The Daily Docket: overnight run.
//
//   node --experimental-strip-types scripts/docket/run.ts            # live, needs XAI_API_KEY
//   node --experimental-strip-types scripts/docket/run.ts --mock     # made-up sample data, no API calls
//
// Options: --date YYYY-MM-DD   --leagues NFL,NBA   --out <dir for the docket JSON>
//
// Writes:
//   <out>/<date>.json             the docket (content/docket/ by default; .docket-out/ for --mock)
//   .docket-out/pr-body.md        the review checklist + X thread for the pull request
//   .docket-out/x-thread.txt      the thread, one post per block
//   .docket-out/email.html        the newsletter body

import fs from "node:fs"
import path from "node:path"

import { enabledLeagues } from "./leagues.ts"
import { gateCandidates } from "./filters.ts"
import { SYSTEM_PROMPT, leaguePrompt } from "./prompt.ts"
import { emailHtml, prBody, xThread } from "./render.ts"
import type { Docket, RawCandidate } from "./types.ts"
import { searchLeague } from "./xai.ts"

const ROOT = process.cwd()
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://gameintegrityjournal.com").replace(/\/$/, "")

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const MOCK = process.argv.includes("--mock")

function todayInChicago(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date())
}
function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function readBlocklist(): string[] {
  const file = path.join(ROOT, "scripts/docket/officials-blocklist.txt")
  if (!fs.existsSync(file)) return []
  return fs
    .readFileSync(file, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
}

async function main() {
  const date = arg("date") || todayInChicago()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`--date must be YYYY-MM-DD, got ${date}`)
  const coverageFrom = shiftDay(date, -1)
  const coverageTo = date
  const leagues = enabledLeagues(arg("leagues")?.split(","))
  const model = process.env.XAI_MODEL || "grok-4.7"

  let candidates: RawCandidate[] = []
  let citations: string[] = []
  let searchCalls = 0

  if (MOCK) {
    const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts/docket/fixtures/sample.json"), "utf8"))
    const keys = new Set(leagues.map((l) => l.key))
    candidates = (fixture.items as RawCandidate[]).filter((c) => keys.has(c.league ?? ""))
    citations = fixture.citations
    console.log(`[docket] MOCK run: ${candidates.length} sample candidates (made-up data)`)
  } else {
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) throw new Error("XAI_API_KEY is not set. Add it as a GitHub Actions secret, or use --mock.")
    for (const league of leagues) {
      console.log(`[docket] searching ${league.name} ${coverageFrom} → ${coverageTo}`)
      try {
        const r = await searchLeague({
          apiKey,
          model,
          system: SYSTEM_PROMPT,
          prompt: leaguePrompt(league, coverageFrom, coverageTo),
          fromDate: coverageFrom,
          toDate: coverageTo,
          leagueName: league.key,
        })
        candidates.push(...r.candidates)
        citations.push(...r.citations)
        searchCalls += r.searchCalls
        console.log(`[docket]   ${r.candidates.length} candidates, ${r.citations.length} citations`)
      } catch (err) {
        // One league failing should not sink the whole docket.
        console.error(`[docket]   ${league.name} failed: ${(err as Error).message}`)
      }
    }
  }

  const { items, stats } = gateCandidates(candidates, { date, blocklist: readBlocklist(), citations })

  const docket: Docket = {
    date,
    coverageFrom,
    coverageTo,
    generatedAt: new Date().toISOString(),
    model: MOCK ? "sample-fixture" : model,
    leagues: leagues.map((l) => l.key),
    sample: MOCK,
    items,
    stats,
  }

  const scratch = path.join(ROOT, ".docket-out")
  fs.mkdirSync(scratch, { recursive: true })
  const outDir = path.resolve(ROOT, arg("out") || (MOCK ? ".docket-out" : "content/docket"))
  fs.mkdirSync(outDir, { recursive: true })

  fs.writeFileSync(path.join(outDir, `${date}.json`), `${JSON.stringify(docket, null, 2)}\n`)
  fs.writeFileSync(path.join(scratch, "pr-body.md"), prBody(docket, SITE_URL, searchCalls))
  fs.writeFileSync(path.join(scratch, "x-thread.txt"), xThread(docket, SITE_URL).join("\n\n---\n\n"))
  fs.writeFileSync(path.join(scratch, "email.html"), emailHtml(docket, SITE_URL))
  fs.writeFileSync(path.join(scratch, "count.txt"), String(items.length))
  fs.writeFileSync(path.join(scratch, "date.txt"), date)

  console.log(`[docket] kept ${stats.kept} of ${stats.candidates}; wrote ${path.relative(ROOT, path.join(outDir, `${date}.json`))}`)
  console.log(`[docket] dropped: ${JSON.stringify(stats)}`)
}

main().catch((err) => {
  console.error(`[docket] ${(err as Error).message}`)
  process.exit(1)
})
