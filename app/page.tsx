import type { Metadata } from "next"

import { Hero } from "@/components/home/hero"
import { Stats } from "@/components/home/stats"
import { Pillars } from "@/components/home/pillars"
import { Coverage } from "@/components/home/coverage"
import { Timeline } from "@/components/home/timeline"
import { BookTeaser } from "@/components/home/book-teaser"
import { JournalRail } from "@/components/home/journal-rail"
import { Capture } from "@/components/capture"
import { getLatestJournalEntries } from "@/lib/content/journal"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

/**
 * Cinematic home. Server component: pulls journal data, then hands it to
 * client "chapter" sections that own their own scroll-driven motion.
 */
export default function HomePage() {
  const entries = getLatestJournalEntries(3)

  return (
    <>
      <Hero />
      <Stats />
      <Pillars />
      <Coverage />
      <Timeline />
      <BookTeaser />
      <JournalRail entries={entries} />

      <section className="relative px-6 pb-28 pt-4">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Get the next report before anyone else does."
            body="New investigations land in your inbox the day they publish. No spam, no noise — just the pattern, tracked."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </>
  )
}
