import type { Metadata } from "next"
import { Eye, Lock, ShieldCheck } from "lucide-react"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { TipForm } from "@/components/tips/tip-form"

export const metadata: Metadata = {
  title: "Submit a Tip",
  description:
    "Seen something that doesn't add up? Send Game Integrity Journal a confidential tip. Anonymous submissions welcome — we protect our sources.",
  alternates: { canonical: "/tips" },
}

const promises = [
  {
    icon: ShieldCheck,
    title: "We protect sources",
    body: "We never publish who you are without your explicit permission. Full stop.",
  },
  {
    icon: Lock,
    title: "Anonymous is fine",
    body: "Contact details are optional. Say your piece and leave the rest blank.",
  },
  {
    icon: Eye,
    title: "We verify before we publish",
    body: "Tips are a starting point. We corroborate before anything runs — no exceptions.",
  },
]

export default function TipsPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/60 px-6 pb-10 pt-24">
        <Aurora />
        <div className="mx-auto max-w-5xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Confidential tips</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              You saw it. <span className="text-gradient-gold">Tell us.</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ash">
              A blown call nobody flagged. A pattern the league keeps burying. A document that
              shouldn&apos;t stay quiet. The record only gets kept if people come forward — and we
              make it safe to.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Promises */}
      <section className="relative px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {promises.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08} className="rounded-xl glass p-7">
              <p.icon className="h-6 w-6 text-gold-soft" />
              <h2 className="mt-4 text-xl text-bone">{p.title}</h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-steel">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Form */}
      <section className="relative px-6 pb-24 pt-2">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <TipForm />
          </Reveal>
          <Reveal className="mt-8 rounded-xl border border-line/60 p-6">
            <p className="mono mb-2 text-[10px] text-crimson-soft">For highly sensitive material</p>
            <p className="text-[14.5px] leading-relaxed text-steel">
              If disclosure could put you at risk, don&apos;t send the most sensitive details through a
              web form. Reach out first through an encrypted channel and we&apos;ll set up a secure way
              to talk. Never share anything that violates a law or a duty you&apos;re bound by.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  )
}
