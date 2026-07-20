"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type JournalSummary = {
  title: string
  dek: string
  slug: string
  fileNo: string
  category: string
  publishedAt: string // ISO
}

const BATCH = 6

/**
 * Client-side browser for the Journal: category filter + text search +
 * load-more (the "News" filtering/search/infinite-load feature, applied
 * to the real MDX posts). Scales cleanly as more reports are published.
 */
export function JournalBrowser({ entries }: { entries: JournalSummary[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [visible, setVisible] = useState(BATCH)

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(entries.map((e) => e.category)))],
    [entries]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      const inCat = category === "All" || e.category === category
      const inQuery = !q || e.title.toLowerCase().includes(q) || e.dek.toLowerCase().includes(q)
      return inCat && inQuery
    })
  }, [entries, query, category])

  const shown = filtered.slice(0, visible)

  return (
    <div>
      {/* controls */}
      <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setCategory(c)
                setVisible(BATCH)
              }}
              className={cn(
                "rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                category === c ? "border-gold bg-gold/10 text-gold-soft" : "border-line text-steel hover:text-bone"
              )}
              data-cursor
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setVisible(BATCH)
            }}
            placeholder="Search reports…"
            aria-label="Search reports"
            className="w-full rounded-full border border-line bg-graphite px-4 py-2.5 font-mono text-[12px] text-bone placeholder:text-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          />
        </div>
      </div>

      {/* results */}
      {shown.length === 0 ? (
        <p className="mono py-16 text-center text-[12px] text-steel">No reports match that filter.</p>
      ) : (
        <motion.div layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {shown.map((e) => (
              <motion.div
                key={e.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/journal/${e.slug}`}
                  className="group flex h-full flex-col rounded-lg border border-line bg-graphite p-6 transition-colors duration-500 hover:border-gold/40"
                  data-cursor
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="mono text-[11px] text-crimson-soft">File No. {e.fileNo}</span>
                    <span className="mono text-[10px] text-steel">{e.category}</span>
                  </div>
                  <h3 className="text-xl leading-tight text-bone transition-colors group-hover:text-gold-soft">
                    {e.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 flex-1 text-[14px] leading-relaxed text-steel">{e.dek}</p>
                  <span className="mono mt-5 inline-flex items-center gap-2 text-[11px] text-gold-soft">
                    Read report
                    <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {visible < filtered.length && (
        <div className="mt-12 text-center">
          <Button variant="ghost" onClick={() => setVisible((v) => v + BATCH)}>
            Load more reports
          </Button>
        </div>
      )}
    </div>
  )
}
