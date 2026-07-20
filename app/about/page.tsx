import type { Metadata } from "next"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Capture } from "@/components/capture"

export const metadata: Metadata = {
  title: "About",
  description:
    "Game Integrity Journal is an independent platform investigating fairness, accountability, and transparency across sport — documented, sourced, and free of speculation.",
  alternates: { canonical: "/about" },
}

const values = [
  { title: "Independence", body: "No money from leagues, teams, or betting operators. Reader-funded, so the only people we answer to are the people we report for.", accent: "var(--electric)" },
  { title: "Evidence, not outrage", body: "Every claim is cross-checked against footage, records, and official statements. We report what happened and cite where it came from.", accent: "var(--gold)" },
  { title: "The pattern, not the person", body: "We don't name individual officials or speculate about motive. One call is an accident; a documented pattern is a story.", accent: "var(--crimson)" },
  { title: "On the record", body: "Nothing gets memory-holed. We keep the receipts leagues would rather you forget — dated, sourced, and public.", accent: "var(--gold)" },
]

const timeline = [
  { tag: "The spark", body: "A hard call goes uncalled, spreads online, and quietly gets revisited — with no one keeping the record." },
  { tag: "The Journal", body: "Case files begin: sourced, dated, cross-checked. Fairness, accountability, transparency across sport." },
  { tag: "Unwhistled", body: "The flagship investigation lands — a full record of one season's officiating failures." },
  { tag: "The platform", body: "Accountability as an institution: investigations, education, and a standing record of integrity in sport." },
]

export default function AboutPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-16 pt-24">
        <Aurora />
        <div className="mx-auto max-w-4xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">About Game Integrity Journal</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5.4rem)] font-extrabold uppercase leading-[0.9] text-gradient-bone">
              Somebody has to<br />
              <span className="text-gradient-gold">keep the record.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ash">
              Game Integrity Journal is an independent platform investigating fairness, accountability,
              and transparency across sport. We&apos;re not here to pick a side in a rivalry or pile on a
              bad night for the refs. We&apos;re here because the failures repeat, get memory-holed, and
              repeat again — and the only thing that changes that is a record someone actually keeps.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission statement */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal variant="blur">
            <p className="cinema text-[clamp(1.8rem,4.5vw,3rem)] font-medium leading-tight text-bone">
              Every great league is built on one principle: integrity. When that integrity is
              questioned, <span className="text-gradient-gold">silence becomes part of the story.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="relative border-t border-line/60 px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-14">
            <p className="mono mb-4 text-[11px] text-gold-soft">What we hold to</p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold uppercase text-bone">Our standards</h2>
          </Reveal>
          <div className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.06} className="group bg-graphite p-9 transition-colors duration-500 hover:bg-charcoal">
                <span className="mb-4 block h-8 w-1 rounded-full" style={{ background: v.accent }} />
                <h3 className="text-2xl text-bone">{v.title}</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-steel">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <Reveal className="mb-14">
            <p className="mono mb-4 text-[11px] text-gold-soft">The arc</p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold uppercase text-bone">
              How we got here
            </h2>
          </Reveal>
          <div className="relative pl-10">
            <div className="absolute left-[9px] top-2 h-full w-px bg-[linear-gradient(180deg,var(--crimson),var(--gold),var(--electric))]" />
            <div className="space-y-14">
              {timeline.map((m, i) => (
                <Reveal key={m.tag} delay={i * 0.05} className="relative">
                  <span className="absolute -left-[38px] top-1.5 h-[18px] w-[18px] rounded-full border-2 border-gold bg-ink shadow-[0_0_18px_-2px_var(--gold)]" />
                  <p className="mono text-[11px] text-electric-soft">{m.tag}</p>
                  <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-ash">{m.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder note — placeholder, swap in real bio */}
      <section className="relative border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <Reveal className="glass rounded-xl p-8">
            <p className="mono mb-4 text-[11px] text-gold-soft">From the founder</p>
            <p className="text-[17px] leading-relaxed text-ash">
              &ldquo;I started Game Integrity Journal because someone had to keep the record — not to
              tear the game down, but because I love it enough to hold it to its own standard.&rdquo;
            </p>
            <p className="mono mt-6 text-[11px] text-steel">
              [ Placeholder founder note — replace with your bio and photo. ]
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 pb-28 pt-4">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Follow the investigation."
            body="New reports, straight to your inbox, the day they publish."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
