import type { Metadata } from "next"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Capture } from "@/components/capture"
import { ContactForm } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach Game Integrity Journal — story tips, membership, press, and partnerships.",
  alternates: { canonical: "/contact" },
}

// Placeholder handles — replace with real social links.
const socials = [
  { label: "X / Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "Email", href: "mailto:hello@gameintegrityjournal.com" },
]

export default function ContactPage() {
  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-12 pt-24">
        <Aurora />
        <div className="mx-auto max-w-3xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Contact</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.9] text-gradient-bone">
              Got something <span className="text-gradient-gold">we should see?</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ash">
              Tips, questions, membership, press, partnerships — it all lands here. If you saw something
              the record should include, this is where it starts.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.4fr_0.6fr]">
          <Reveal>
            <ContactForm />
          </Reveal>
          <Reveal delay={0.1} className="space-y-8">
            <div className="glass rounded-xl p-6">
              <p className="mono mb-2 text-[10px] text-crimson-soft">Confidential tips</p>
              <p className="text-[14px] leading-relaxed text-steel">
                Have something sensitive? Choose &ldquo;A story tip&rdquo; and tell us how you&apos;d like to
                be contacted. We protect sources.
              </p>
            </div>
            <div className="glass rounded-xl p-6">
              <p className="mono mb-3 text-[10px] text-gold-soft">Follow the work</p>
              <ul className="space-y-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      className="mono text-[12px] text-steel underline-offset-4 transition-colors hover:text-gold-soft hover:underline"
                    >
                      {s.label} →
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mono mt-4 text-[9px] text-steel">[ Placeholder links — swap in real handles. ]</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 pb-28">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Or just follow along."
            body="Every investigation, the day it publishes. No spam, no noise."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
