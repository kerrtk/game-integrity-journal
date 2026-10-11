import type { Metadata } from "next"

import { DocketView } from "@/components/docket/docket-view"
import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Capture } from "@/components/capture"
import { getAllDockets } from "@/lib/docket"

export const metadata: Metadata = {
  title: "The Daily Docket",
  description:
    "Every morning: the night's officiating, replay, coaching and league-integrity stories across the major leagues. Sourced, reviewed, and on the record.",
  alternates: { canonical: "/docket" },
}

export default function DocketIndexPage() {
  const dockets = getAllDockets()
  const latest = dockets[0]

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/60 px-6 pb-12 pt-24">
        <Aurora />
        <div className="mx-auto max-w-4xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">The Daily Docket</p>
            <h1 className="font-display text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              Last night&rsquo;s calls, <span className="text-gradient-gold">on the record.</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ash">
              The disputed calls, replay failures, coaching decisions and league responses fans argued about overnight,
              across the major leagues. Sourced, reviewed by a person, and filed every morning.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 py-14">
        {latest ? (
          <DocketView docket={latest} archive={dockets} />
        ) : (
          <div className="mx-auto max-w-4xl">
            <p className="mb-10 border border-line bg-panel p-8 text-lg text-ash">
              The first Docket is on its way. Sign up and it lands in your inbox the morning it files.
            </p>
            <Capture
              heading="Get the Docket every morning."
              body="The night's integrity stories across the major leagues, sourced and in your inbox before work."
              buttonLabel="Send me the Docket"
            />
          </div>
        )}
      </section>
    </div>
  )
}
