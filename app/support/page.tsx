import type { Metadata } from "next"
import Link from "next/link"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Magnetic } from "@/components/fx/magnetic"
import { CountUp } from "@/components/fx/count-up"
import { Button } from "@/components/ui/button"
import { FundingProgress } from "@/components/donate/progress"

export const metadata: Metadata = {
  title: "Support the Investigation",
  description:
    "Independent sports-integrity journalism runs on readers, not leagues. Support Game Integrity Journal and keep the record honest.",
  alternates: { canonical: "/support" },
}

// Placeholder impact figures — replace with verified numbers.
const impact = [
  { value: 4, label: "Investigations filed", sub: "Fully sourced" },
  { value: 0, label: "Dollars from any league", sub: "Independence is the point" },
  { value: 100, suffix: "%", label: "Reader-funded", sub: "Accountable to you" },
]

// Placeholder one-time amounts — Stripe checkout wires in later.
const amounts = [10, 25, 50, 100]

export default function SupportPage() {
  return (
    <div>
      {/* Emotional hero */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24">
        <Aurora />
        <div className="mx-auto max-w-3xl">
          <Reveal variant="blur">
            <p className="mono mb-5 flex items-center gap-3 text-[11px] text-crimson-soft">
              <span className="inline-block h-px w-8 bg-crimson/70" />
              Support the investigation
            </p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5.2rem)] font-extrabold uppercase leading-[0.9] text-bone">
              When no one keeps the record,{" "}
              <span className="text-gradient-gold">the record disappears.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ash">
              Leagues have PR departments. Broadcasters have rights deals. The pattern of missed calls,
              buried stories, and quiet corrections has almost no one keeping score — on purpose. Your
              support is what lets us do it anyway, beholden to nobody.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Progress + give */}
      <section className="relative px-6 pb-24">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <FundingProgress />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl font-extrabold uppercase text-bone">Give once</h2>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-steel">
              Every dollar funds sourcing, footage review, and the time it takes to get a story right.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {amounts.map((a) => (
                <Button key={a} asChild variant="ghost">
                  <Link href="/membership">${a}</Link>
                </Button>
              ))}
              <Magnetic>
                <Button asChild variant="gold">
                  <Link href="/membership">Give monthly →</Link>
                </Button>
              </Magnetic>
            </div>
            <p className="mono mt-4 text-[10px] text-steel">
              Secure checkout opens soon · prefer ongoing support? See membership.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Impact */}
      <section className="relative border-y border-line/60 px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-12 sm:grid-cols-3">
          {impact.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08} className="text-center">
              <div className="font-display text-[clamp(2.6rem,6vw,4rem)] font-extrabold leading-none text-gradient-gold">
                <CountUp value={s.value} suffix={s.suffix} />
              </div>
              <p className="mt-3 text-sm font-semibold text-bone">{s.label}</p>
              <p className="mono mt-1 text-[10px] text-steel">{s.sub}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="relative px-6 py-24 text-center">
        <Reveal variant="blur" className="mx-auto max-w-2xl">
          <p className="cinema text-[clamp(1.6rem,4vw,2.6rem)] font-medium italic leading-snug text-bone">
            &ldquo;Question the call. Protect the game.&rdquo;
          </p>
          <div className="mt-8">
            <Magnetic>
              <Button asChild variant="gold" size="lg">
                <Link href="/membership">Support the work</Link>
              </Button>
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
