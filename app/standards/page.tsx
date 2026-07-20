import type { Metadata } from "next"
import Link from "next/link"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Editorial Standards",
  description:
    "How Game Integrity Journal sources, verifies, and corrects its reporting — our commitment to accuracy, independence, and fairness.",
  alternates: { canonical: "/standards" },
}

const standards = [
  {
    no: "01",
    title: "Accuracy over speed",
    body: "We publish when a claim is verified, not when it's loudest. If we can't stand behind a fact, it doesn't run — and we would rather be second and right than first and wrong.",
  },
  {
    no: "02",
    title: "Sourced and dated",
    body: "Every report names what it's built on — public footage, records, on-the-record accounts, or corroborated tips. Each file carries a publication date so the record is traceable in time.",
  },
  {
    no: "03",
    title: "We protect sources",
    body: "We never reveal a confidential source's identity without explicit permission. Anonymity offered is anonymity kept — it is the foundation everything else stands on.",
  },
  {
    no: "04",
    title: "Independence",
    body: "Our conclusions aren't for sale. Memberships, book sales, and support fund the work; they never buy a verdict. No league, sponsor, or advertiser reviews our reporting before it runs.",
  },
  {
    no: "05",
    title: "Fairness and the right of reply",
    body: "When a report makes a serious claim about a person or institution, we seek their response and represent it honestly. Criticism of a system is not a license to distort the people inside it.",
  },
  {
    no: "06",
    title: "We label opinion",
    body: "Analysis and argument are marked as such and kept distinct from factual reporting, so readers always know which is which.",
  },
]

export default function StandardsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/60 px-6 pb-10 pt-24">
        <Aurora />
        <div className="mx-auto max-w-5xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Editorial standards</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              Held to the <span className="text-gradient-gold">same standard.</span>
            </h1>
            <p className="mt-5 max-w-[62ch] text-lg leading-relaxed text-ash">
              A platform that demands accountability has to be accountable itself. These are the rules
              we hold our own reporting to — the standard we ask of the games we cover, applied to us.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Standards list */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-4xl divide-y divide-line/50">
          {standards.map((s, i) => (
            <Reveal key={s.no} delay={i * 0.05} className="grid gap-4 py-9 md:grid-cols-[auto_1fr] md:gap-10">
              <span className="font-display text-4xl font-extrabold text-line md:text-5xl">{s.no}</span>
              <div>
                <h2 className="text-2xl text-bone">{s.title}</h2>
                <p className="mt-3 max-w-[62ch] text-[15.5px] leading-relaxed text-ash">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Corrections */}
      <section className="relative border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <p className="mono mb-4 text-[11px] text-crimson-soft">Corrections policy</p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold uppercase text-bone">
              When we get it wrong
            </h2>
            <div className="mt-6 space-y-4 text-[15.5px] leading-relaxed text-ash">
              <p>
                We correct errors promptly and in the open. When a report is updated after publication,
                the change is noted on the file itself — we don&apos;t quietly rewrite the record. A
                substantive correction is labeled as one.
              </p>
              <p>
                If you believe something we published is inaccurate, tell us. Send the specifics and any
                evidence you have, and we&apos;ll review it and respond. Accountability runs both ways.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild variant="gold">
                <Link href="/contact">Request a correction</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/tips">Submit a tip</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
