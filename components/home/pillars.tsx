"use client"

import { motion } from "framer-motion"
import { Eye, GraduationCap, Scale, ShieldCheck } from "lucide-react"

import { Reveal } from "@/components/fx/reveal"
import { inViewOnce, stagger } from "@/lib/motion"

const pillars = [
  {
    icon: ShieldCheck,
    title: "Accountability",
    body: "When a call is blown, someone should have to answer for it. We keep the record leagues would rather forget.",
    accent: "var(--crimson)",
  },
  {
    icon: Eye,
    title: "Transparency",
    body: "Officiating decisions happen in the dark. We drag the pattern into the light — sourced, dated, undeniable.",
    accent: "var(--gold)",
  },
  {
    icon: GraduationCap,
    title: "Education",
    body: "Fans, players, and officials all deserve to understand how the calls actually get made — and unmade.",
    accent: "var(--electric)",
  },
  {
    icon: Scale,
    title: "Integrity",
    body: "No referee names. No conspiracy theories. Just fair play, defended with evidence and nothing else.",
    accent: "var(--gold)",
  },
]

export function Pillars() {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal variant="blur" className="max-w-3xl">
          <p className="mono mb-5 text-[11px] text-gold-soft">What we stand for</p>
          <h2 className="cinema text-[clamp(2.2rem,5vw,4rem)] font-medium normal-case leading-[1.05] text-bone">
            Sport is worth holding to{" "}
            <span className="text-gradient-gold">its own standards.</span>
          </h2>
        </Reveal>

        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="mt-16 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2"
        >
          {pillars.map((p) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
                }}
                className="group relative bg-graphite p-9 transition-colors duration-500 hover:bg-charcoal"
                data-cursor
              >
                <span
                  className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-md border border-line transition-transform duration-500 group-hover:-translate-y-1"
                  style={{ color: p.accent, boxShadow: `inset 0 0 24px -12px ${p.accent}` }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-2xl text-bone">{p.title}</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-steel">{p.body}</p>
                <span
                  className="absolute inset-x-9 bottom-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100"
                  style={{ background: p.accent }}
                />
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
