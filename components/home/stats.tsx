"use client"

import { CountUp } from "@/components/fx/count-up"
import { Reveal } from "@/components/fx/reveal"

/**
 * Animated statistics band. Numbers count up on scroll-in.
 * NOTE: placeholder figures — swap for GIJ's verified stats.
 */
const stats = [
  { value: 1, prefix: "#", label: "Platform for officiating integrity", sub: "First of its kind" },
  { value: 100, suffix: "%", label: "Independently sourced", sub: "No league funding" },
  { value: 4, label: "Investigations filed", sub: "And counting" },
  { value: 0, label: "Referees named", sub: "The pattern, not the person" },
]

export function Stats() {
  return (
    <section className="relative border-y border-line/60 px-6 py-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-12 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08} className="px-2 text-center md:text-left">
            <div className="font-display text-[clamp(2.6rem,6vw,4.5rem)] font-extrabold leading-none text-gradient-gold">
              <CountUp value={s.value} prefix={s.prefix} suffix={s.suffix} />
            </div>
            <p className="mt-3 text-sm font-semibold text-bone">{s.label}</p>
            <p className="mono mt-1 text-[10px] text-steel">{s.sub}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
