import Link from "next/link"

import type { JournalEntry } from "@/lib/content/schema"

export function JournalCard({ entry }: { entry: JournalEntry }) {
  return (
    <div className="bg-panel p-[26px]">
      <span className="mono mb-3 block text-[11px] text-crimson">File No. {entry.fileNo}</span>
      <h3 className="mb-2.5 text-[22px] leading-[1.15] text-bone">{entry.title}</h3>
      <p className="mb-3.5 text-[15px] leading-relaxed text-steel">{entry.dek}</p>
      <Link href={`/journal/${entry.slug}`} className="mono text-xs text-crimson hover:underline">
        Read report &rarr;
      </Link>
    </div>
  )
}
