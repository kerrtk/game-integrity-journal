import type { Metadata } from "next"
import Link from "next/link"

import { Capture } from "@/components/capture"
import { JournalCard } from "@/components/journal-card"
import { Button } from "@/components/ui/button"
import { getLatestJournalEntries } from "@/lib/content/journal"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

export default function HomePage() {
  const entries = getLatestJournalEntries(3)

  return (
    <div>
      <section className="border-b border-hair px-6 pb-12 pt-16">
        <div className="mx-auto max-w-5xl">
          <span className="mono mb-3.5 block text-xs text-crimson">
            Investigations &middot; Sports Officiating
          </span>
          <h1 className="max-w-[14ch] text-[clamp(40px,7vw,76px)] text-bone">
            Somebody has to call the calls.
          </h1>
          <p className="mt-[18px] max-w-[60ch] text-lg text-steel">
            Game Integrity Journal tracks the officiating failures, retroactive corrections, and
            institutional silence that leagues would rather you not add up. No referee names. No
            conspiracy theories. Just the pattern, documented.
          </p>

          <div className="mt-10 grid grid-cols-1 border border-hair bg-panel sm:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center justify-center gap-2.5 border-b border-hair bg-panel-2 p-6 text-center sm:border-b-0 sm:border-r">
              <div className="flex h-[88px] w-[88px] -rotate-[8deg] items-center justify-center rounded-full border-[3px] border-crimson">
                <span className="font-display text-[13px] font-extrabold uppercase tracking-wide text-crimson">
                  Flagship
                </span>
              </div>
              <small className="mono text-[10.5px] text-steel">File No. 0001</small>
            </div>
            <div className="p-7">
              <h2 className="text-[clamp(22px,3vw,30px)] text-bone">
                Unwhistled: How the WNBA Failed Caitlin Clark
              </h2>
              <p className="mb-4 mt-2.5 text-[15.5px] text-steel">
                The full indictment &mdash; every missed call, every retroactive fix, every pattern
                the league hoped would stay buried. Out August 1st.
              </p>
              <Button asChild>
                <Link href="/unwhistled">Read the case</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-baseline justify-between border-b border-hair pb-3.5">
            <h2 className="text-[clamp(24px,3vw,32px)] text-bone">Latest from the Journal</h2>
            <Link href="/journal" className="mono text-xs text-crimson hover:underline">
              All reports &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-px border border-hair bg-hair md:grid-cols-3">
            {entries.map((entry) => (
              <JournalCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Get the next report before anyone else does."
            body="New investigations land in your inbox the day they publish. No spam, no noise — just the pattern, tracked."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
