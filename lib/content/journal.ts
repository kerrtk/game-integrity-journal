import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { journalEntryFrontmatterSchema, type JournalEntry } from "./schema"

const JOURNAL_DIR = path.join(process.cwd(), "content", "journal")

let cache: JournalEntry[] | null = null

function loadAll(): JournalEntry[] {
  if (cache) return cache

  const files = fs.readdirSync(JOURNAL_DIR).filter((f) => f.endsWith(".mdx"))
  const entries = files.map((filename) => {
    const raw = fs.readFileSync(path.join(JOURNAL_DIR, filename), "utf8")
    const { data, content } = matter(raw)
    const parsed = journalEntryFrontmatterSchema.safeParse(data)
    if (!parsed.success) {
      throw new Error(`Invalid frontmatter in content/journal/${filename}: ${parsed.error.message}`)
    }
    return { ...parsed.data, content }
  })

  cache = entries.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
  return cache
}

export function getAllJournalEntries(): JournalEntry[] {
  return loadAll()
}

export function getAllJournalSlugs(): string[] {
  return loadAll().map((e) => e.slug)
}

export function getJournalEntryBySlug(slug: string): JournalEntry | undefined {
  return loadAll().find((e) => e.slug === slug)
}

export function getLatestJournalEntries(limit = 3): JournalEntry[] {
  return loadAll().slice(0, limit)
}
