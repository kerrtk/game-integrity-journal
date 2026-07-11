"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { Reveal } from "@/components/fx/reveal"

/**
 * Scroll-linked timeline. A gold line draws itself down the spine as
 * you scroll, and each entry rises in. NOTE: placeholder milestones —
 * swap for GIJ's real editorial timeline.
 */
const milestones = [
  { tag: "The spark", title: "One call, blown live", body: "A flagrant missed in real time, quietly upgraded hours later. The pattern was always there — nobody was keeping the record." },
  { tag: "The record", title: "The Journal opens", body: "Case files begin: sourced, dated, cross-checked against footage and league statements. No names, no noise." },
  { tag: "The indictment", title: "Unwhistled", body: "The flagship investigation — a full season of officiating failure, laid out so the pattern speaks for itself." },
  { tag: "What's next", title: "A platform, not a post", body: "Accountability as an institution: investigations, education, and a standing record of sports integrity." },
]

export function Timeline() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 65%", "end 60%"] })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-4xl">
        <Reveal variant="blur" className="mb-16">
          <p className="mono mb-5 text-[11px] text-gold-soft">How we got here</p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.95] text-bone">
            From one blown call to a{" "}
            <span className="text-gradient-gold">standing record.</span>
          </h2>
        </Reveal>

        <div ref={ref} className="relative pl-10">
          {/* track + animated fill */}
          <div className="absolute left-[9px] top-2 h-full w-px bg-line" />
          <motion.div
            style={{ scaleY: lineScale }}
            className="absolute left-[9px] top-2 h-full w-px origin-top bg-[linear-gradient(180deg,var(--crimson),var(--gold),var(--electric))]"
          />

          <div className="space-y-16">
            {milestones.map((m, i) => (
              <Reveal key={m.title} delay={i * 0.05} className="relative">
                <span className="absolute -left-[38px] top-1.5 h-[18px] w-[18px] rounded-full border-2 border-gold bg-ink shadow-[0_0_18px_-2px_var(--gold)]" />
                <p className="mono text-[11px] text-electric-soft">{m.tag}</p>
                <h3 className="mt-2 text-2xl text-bone">{m.title}</h3>
                <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-steel">{m.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
