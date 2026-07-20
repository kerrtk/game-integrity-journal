import type { Metadata } from "next"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Capture } from "@/components/capture"
import { Pricing } from "@/components/membership/pricing"

export const metadata: Metadata = {
  title: "Membership",
  description:
    "Back independent sports-integrity journalism. Member support keeps Game Integrity Journal free of league funding — documented, sourced, accountable to readers only.",
  alternates: { canonical: "/membership" },
}

export default function MembershipPage() {
  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <Aurora />
        <div className="mx-auto max-w-3xl text-center">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Membership</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              Reader-funded.<br />
              <span className="text-gradient-gold">Answerable to no one else.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ash">
              We take no money from leagues, teams, or betting operators — the entities most likely to
              show up in our reporting. Members are the reason we can keep it that way.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <Pricing />
        </div>
      </section>

      <section className="relative px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Not ready to join? Start with the newsletter."
            body="Every investigation, the day it publishes. Free — and a good look at what your membership would fund."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
