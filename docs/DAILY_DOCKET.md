# The Daily Docket

A morning roundup of the night's integrity stories across the major leagues: disputed calls, replay failures, coaching decisions, and what the leagues said or did about them.

## How it runs

1. **4:30 AM Central** — `.github/workflows/daily-docket.yml` runs `scripts/docket/run.ts`. For each enabled league it asks Grok (xAI Responses API with `x_search` + `web_search`) for yesterday-through-today's integrity stories as JSON.
2. **Editorial gate** (`scripts/docket/filters.ts`, enforced in code, tested on every run):
   - officials are never named: "referee <Name>" becomes "the referee", plus a blocklist in `scripts/docket/officials-blocklist.txt`
   - viral-only claims are dropped; every item needs a real source link
   - links Grok never actually found in its search get flagged for a human check
   - duplicates collapse; max 12 items, 4 per league
3. **Review PR** — the docket is committed to `content/docket/<date>.json` on a `docket/<date>` branch and opened as a pull request. Vercel builds a preview. The PR body has the checklist, any warnings, and the ready X thread.
4. **Approve = merge.** The site publishes `/docket` and `/docket/<date>`, and `docket-email-draft.yml` creates a Brevo campaign **draft** (never sent automatically).
5. **Post the thread** from the PR body to X by hand or through a scheduler.

## One-time setup

| Where | What |
|---|---|
| GitHub → Settings → Secrets → Actions | `XAI_API_KEY` (console.x.ai) |
| same | `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` (same values as in Vercel) |
| GitHub → Settings → Variables → Actions (optional) | `XAI_MODEL` (default `grok-4.7`), `BREVO_DOCKET_LIST_ID` (default `12`) |
| GitHub → Settings → Actions → General | Allow GitHub Actions to create and approve pull requests |

## Try it without an API key

```bash
node --experimental-strip-types --test scripts/docket/filters.test.ts
node --experimental-strip-types scripts/docket/run.ts --mock      # writes to .docket-out/
```

Or in GitHub: Actions → Daily Docket → Run workflow → tick "Use made-up sample data". That opens a `SAMPLE (do not merge)` PR. Sample dockets can never render on production even if merged.

## Change what it watches

Edit `scripts/docket/leagues.ts` (`enabled: true/false`). The WNBA is off for the offseason; turn it on in spring.

## Cost

About $5 per 1,000 search calls on xAI plus model tokens. Each PR body reports the search calls billed for that run.
