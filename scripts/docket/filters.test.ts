// node --experimental-strip-types --test scripts/docket/filters.test.ts
import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"

import { gateCandidates, redactOfficials } from "./filters.ts"
import { collectCitations, parseItems } from "./xai.ts"
import { xThread } from "./render.ts"
import type { Docket } from "./types.ts"

test("redacts role + name, keeps the role", () => {
  assert.equal(redactOfficials("Referee Dale Hemming announced the ruling.").text, "The referee announced the ruling.")
  assert.equal(redactOfficials("Fans blamed umpire Sam Ortiz for the zone.").text, "Fans blamed the umpire for the zone.")
  assert.equal(redactOfficials("The ump Tara Voss crew called it.").text, "The ump crew called it.")
  assert.equal(redactOfficials("the crew chief Lee Park's explanation").text, "the crew chief's explanation")
  assert.equal(redactOfficials("Mark Delano's officiating crew missed it").text, "the officiating crew missed it")
})

test("leaves ordinary sentences alone", () => {
  for (const s of [
    "The referee made a call nobody understood.",
    "The refs Saturday night let them play.",
    "Coach Rivera burned a timeout.",
    "The league issued an official statement.",
  ]) {
    const r = redactOfficials(s)
    assert.equal(r.text, s)
    assert.equal(r.count, 0)
  }
})

test("blocklist catches bare names", () => {
  const r = redactOfficials("Everyone saw Dana Whitlock signal the catch.", ["Dana Whitlock"])
  assert.equal(r.text, "Everyone saw the official signal the catch.")
})

test("sample fixture: drops viral-only, no-source and duplicates; redacts names", () => {
  const fx = JSON.parse(fs.readFileSync("scripts/docket/fixtures/sample.json", "utf8"))
  const { items, stats } = gateCandidates(fx.items, { date: "2026-10-12", citations: fx.citations })
  assert.equal(stats.candidates, 7)
  assert.equal(stats.droppedViralOnly, 1)
  assert.equal(stats.droppedNoSource, 1)
  assert.equal(stats.droppedDuplicate, 1)
  assert.equal(items.length, 4)
  const all = JSON.stringify(items)
  assert.ok(!all.includes("Hemming"), "official name leaked")
  assert.ok(!all.includes("Voss"), "official name leaked")
  assert.ok(stats.redactions >= 2)
  // Hottest first, verified before developing on ties.
  assert.equal(items[0].heat, 3)
  assert.equal(items[0].status, "verified")
  // Source not in Grok's citations gets flagged for a human look.
  const coaching = items.find((i) => i.type === "coaching")!
  assert.ok(coaching.reviewFlags.some((f) => f.includes("Grok's search results")))
})

test("parses JSON wrapped in code fences and collects citations", () => {
  const items = parseItems('```json\n{"items":[{"headline":"x"}]}\n```')
  assert.equal(items.length, 1)
  const cites = collectCitations({
    output: [{ content: [{ type: "output_text", text: "", annotations: [{ type: "url_citation", url: "https://a.com/1" }] }] }],
    citations: ["https://b.com/2"],
  })
  assert.deepEqual([...cites].sort(), ["https://a.com/1", "https://b.com/2"])
})

test("every X post fits in 280 characters", () => {
  const fx = JSON.parse(fs.readFileSync("scripts/docket/fixtures/sample.json", "utf8"))
  const { items, stats } = gateCandidates(fx.items, { date: "2026-10-12", citations: fx.citations })
  const docket: Docket = {
    date: "2026-10-12", coverageFrom: "2026-10-11", coverageTo: "2026-10-12", generatedAt: "", model: "t",
    leagues: ["NFL", "NBA", "NCAAF", "MLB"], sample: true, items, stats,
  }
  for (const post of xThread(docket, "https://gameintegrityjournal.com")) {
    const len = post.replace(/https?:\/\/\S+/g, "x".repeat(23)).length
    assert.ok(len <= 280, `post too long (${len}): ${post}`)
  }
})
