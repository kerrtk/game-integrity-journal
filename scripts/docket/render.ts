// Turns a docket into the three things TK publishes: an X thread, an email, and the review PR body.

import type { Docket, DocketItem, IssueType } from "./types.ts"

export const TYPE_LABEL: Record<IssueType, string> = {
  officiating: "Officiating",
  coaching: "Coaching",
  "league-ops": "League ops",
  "replay-tech": "Replay & tech",
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`
}

// X counts every link as 23 characters.
const LINK_LEN = 23

export function xThread(docket: Docket, siteUrl: string): string[] {
  const leagues = [...new Set(docket.items.map((i) => i.league))].join(", ")
  const posts: string[] = []
  posts.push(
    clip(
      `THE DAILY DOCKET · ${prettyDate(docket.date)}\n\n${docket.items.length} integrity stories from ${leagues}. Calls, reviews, coaching decisions, and what the leagues said about them.\n\nThread ↓`,
      280,
    ),
  )
  docket.items.forEach((item, i) => {
    const tag = `${i + 1}/ ${item.league} · ${TYPE_LABEL[item.type]} · ${item.status === "verified" ? "Verified" : "Developing"}`
    const link = item.sources[0]?.url ?? ""
    const response = item.leagueResponseNote ? `\n\nLeague: ${item.leagueResponseNote}` : ""
    const fixed = tag.length + 2 + (link ? LINK_LEN + 2 : 0)
    const room = 280 - fixed
    let body = `${item.headline}${response}`
    if (body.length > room) body = clip(item.headline, room)
    posts.push(`${tag}\n\n${body}${link ? `\n\n${link}` : ""}`)
  })
  posts.push(`Every item is sourced and reviewed by a person before it posts. Officials are never named.\n\nFull docket with rules and sources: ${siteUrl}/docket/${docket.date}`)
  return posts
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function emailHtml(docket: Docket, siteUrl: string): string {
  const rows = docket.items
    .map(
      (item: DocketItem) => `
      <tr><td style="padding:20px 0;border-top:1px solid #d9d4c7;">
        <div style="font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#a3162e;">${esc(item.league)} · ${esc(TYPE_LABEL[item.type])} · ${item.status === "verified" ? "Verified" : "Developing"}</div>
        <div style="font:700 19px/1.3 Georgia,serif;color:#0b1426;margin:6px 0 8px;">${esc(item.headline)}</div>
        <div style="font:16px/1.55 Georgia,serif;color:#1d2433;">${esc(item.whatHappened)}</div>
        ${item.ruleAtIssue ? `<div style="font:14px/1.5 Georgia,serif;color:#4a5263;margin-top:8px;"><b>The rule:</b> ${esc(item.ruleAtIssue)}</div>` : ""}
        ${item.leagueResponseNote ? `<div style="font:14px/1.5 Georgia,serif;color:#4a5263;margin-top:4px;"><b>The league:</b> ${esc(item.leagueResponseNote)}</div>` : ""}
        <div style="font:13px/1.5 Georgia,serif;margin-top:8px;">${item.sources
          .map((s) => `<a href="${esc(s.url)}" style="color:#a3162e;">${esc(s.label)}</a>`)
          .join(" · ")}</div>
      </td></tr>`,
    )
    .join("")

  return `<!doctype html><html><body style="margin:0;background:#f3f0ea;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f0ea;"><tr><td align="center" style="padding:28px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
  <tr><td style="background:#0b1426;padding:22px 24px;">
    <div style="font:600 11px/1.4 Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase;color:#d31f3c;">Game Integrity Journal</div>
    <div style="font:800 26px/1.15 Georgia,serif;color:#f3f0ea;margin-top:6px;">The Daily Docket</div>
    <div style="font:14px/1.4 Georgia,serif;color:#cfd3dc;margin-top:4px;">${prettyDate(docket.date)} · ${docket.items.length} stories</div>
  </td></tr>
  <tr><td style="padding:4px 24px 8px;background:#fbfaf6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
  </td></tr>
  <tr><td style="padding:18px 24px;background:#fbfaf6;border-top:1px solid #d9d4c7;font:13px/1.5 Georgia,serif;color:#4a5263;">
    Read it on the site with every source: <a href="${siteUrl}/docket/${docket.date}" style="color:#a3162e;">${siteUrl.replace(/^https?:\/\//, "")}/docket/${docket.date}</a><br>
    Each item is sourced and reviewed by a person. We never name individual officials; the problem is the system.
  </td></tr>
</table></td></tr></table></body></html>`
}

export function prBody(docket: Docket, siteUrl: string, searchCalls: number): string {
  const s = docket.stats
  const lines: string[] = []
  lines.push(`## The Daily Docket · ${prettyDate(docket.date)}`)
  lines.push("")
  if (docket.sample) lines.push("> **SAMPLE RUN.** This was generated from made-up test data, not real events. Do not merge.\n")
  lines.push(`**${docket.items.length} items** from ${docket.leagues.join(", ")} · coverage ${docket.coverageFrom} to ${docket.coverageTo}`)
  lines.push("")
  lines.push(
    `Filtered out: ${s.droppedViralOnly} viral-only, ${s.droppedNoSource} with no source, ${s.droppedDuplicate} duplicate(s), ${s.droppedOverCap} over the cap, ${s.droppedInvalid} incomplete. Official names removed: ${s.redactions}. Search calls billed: ${searchCalls}.`,
  )
  lines.push("")
  lines.push("### How to review (about 10 minutes)")
  lines.push("1. Open the Vercel preview link on this PR and go to `/docket`.")
  lines.push(`2. **Kill an item:** delete it from \`content/docket/${docket.date}.json\` in this PR.`)
  lines.push("3. **Fix wording:** edit the JSON directly (Files changed → ⋯ → Edit file).")
  lines.push("4. **Approve:** merge. The site updates and a Brevo email draft is created for you to send.")
  lines.push("5. **Post the thread** below to X by hand or through your scheduler.")
  lines.push("")
  lines.push("### Items")
  docket.items.forEach((item, i) => {
    lines.push(`- [ ] **${i + 1}. ${item.league} · ${TYPE_LABEL[item.type]} · ${item.status}** · heat ${item.heat}: ${item.headline}`)
    for (const f of item.reviewFlags) lines.push(`  - ⚠️ ${f}`)
    for (const src of item.sources) lines.push(`  - ${src.label}: ${src.url}`)
  })
  lines.push("")
  lines.push("### X thread (copy after merge)")
  xThread(docket, siteUrl).forEach((post, i) => {
    lines.push("")
    lines.push(`**Post ${i + 1}**`)
    lines.push("```")
    lines.push(post)
    lines.push("```")
  })
  return lines.join("\n")
}
