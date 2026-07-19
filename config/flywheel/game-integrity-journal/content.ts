import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import type { Content } from "@/lib/flywheel/content/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * Content ingestion — the ATTRACT stage reads the *same* MDX the public
 * site renders, so editorial and the flywheel never drift. Every journal
 * entry is mapped to the newsroom capture form and the book offer, so no
 * article is a dead end.
 *
 * Non-journal traffic assets (landing pages, the book page) are declared
 * inline below. Adding a channel is appending to this array.
 */
const JOURNAL_DIR = path.join(process.cwd(), "content", "journal")

function ingestJournal(): Content[] {
  let files: string[] = []
  try {
    files = fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith(".mdx"))
  } catch {
    return []
  }
  return files.map((filename) => {
    const raw = fs.readFileSync(path.join(JOURNAL_DIR, filename), "utf8")
    const { data } = matter(raw)
    const slug = String(data.slug ?? filename.replace(/\.mdx$/, ""))
    return {
      slug: `journal-${slug}`,
      brandId: GIJ_BRAND_ID,
      name: String(data.title ?? slug),
      kind: "article" as const,
      path: `/journal/${slug}`,
      topics: [String(data.category ?? "officiating")],
      captureSlug: "newsroom-signup",
      offerSlug: "unwhistled-book",
      publishedAt: data.publishedAt ? new Date(String(data.publishedAt)) : undefined,
    }
  })
}

const staticContent: Content[] = [
  {
    slug: "home",
    brandId: GIJ_BRAND_ID,
    name: "Home",
    kind: "landing",
    path: "/",
    topics: ["sports officiating", "integrity", "caitlin clark"],
    captureSlug: "newsroom-signup",
    offerSlug: "unwhistled-book",
  },
  {
    slug: "unwhistled-landing",
    brandId: GIJ_BRAND_ID,
    name: "Unwhistled Book Page",
    kind: "landing",
    path: "/unwhistled",
    topics: ["unwhistled", "wnba", "caitlin clark"],
    captureSlug: "book-waitlist",
    offerSlug: "unwhistled-book",
  },
]

export const content: Content[] = [...ingestJournal(), ...staticContent]
