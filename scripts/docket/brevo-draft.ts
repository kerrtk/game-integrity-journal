// Creates a Brevo email campaign DRAFT for a merged docket. It never sends:
// TK opens Brevo, looks it over, and clicks send himself.
//
//   node --experimental-strip-types scripts/docket/brevo-draft.ts --file content/docket/2026-10-12.json

import fs from "node:fs"

import { emailHtml, prettyDate } from "./render.ts"
import type { Docket } from "./types.ts"

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main() {
  const file = arg("file")
  if (!file) throw new Error("--file is required")
  const docket = JSON.parse(fs.readFileSync(file, "utf8")) as Docket

  if (docket.sample) {
    console.log(`[brevo] ${file} is sample data. No draft created.`)
    return
  }
  if (!docket.items.length) {
    console.log(`[brevo] ${file} has no items. No draft created.`)
    return
  }

  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  if (!apiKey || !senderEmail) {
    console.log("[brevo] BREVO_API_KEY or BREVO_SENDER_EMAIL not set. Skipping the email draft.")
    return
  }
  const listId = Number(process.env.BREVO_DOCKET_LIST_ID || "12")
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://gameintegrityjournal.com").replace(/\/$/, "")

  const lead = docket.items[0].headline
  const res = await fetch("https://api.brevo.com/v3/emailCampaigns", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      name: `Daily Docket ${docket.date}`,
      subject: `The Daily Docket: ${lead}`.slice(0, 150),
      previewText: `${docket.items.length} integrity stories for ${prettyDate(docket.date)}, sourced and reviewed.`,
      sender: { name: process.env.BREVO_SENDER_NAME || "Game Integrity Journal", email: senderEmail },
      htmlContent: emailHtml(docket, siteUrl),
      recipients: { listIds: [listId] },
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`Brevo returned ${res.status}: ${text.slice(0, 400)}`)
  console.log(`[brevo] Draft campaign created for ${docket.date}: ${text}`)
}

main().catch((err) => {
  console.error(`[brevo] ${(err as Error).message}`)
  process.exit(1)
})
