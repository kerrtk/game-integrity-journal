"use client"

import { motion } from "framer-motion"

import { Reveal } from "@/components/fx/reveal"
import { inViewOnce, stagger } from "@/lib/motion"

/**
 * "What we investigate" — the platform's scope across sport, drawn
 * directly from the Unwhistled cover copy (competitive fairness, player
 * protection, officiating consistency, media influence, institutional
 * accountability). Presented as a cinematic editorial index (01–05).
 * This is the section that broadens GIJ beyond officiating alone.
 */
const areas = [
  {
    n: "01",
    title: "Competitive Fairness",
    body: "Whether the result was earned — rule enforcement, statistical anomalies, and the integrity of the outcome itself.",
    accent: "var(--gold)",
  },
  {
    n: "02",
    title: "Officiating & Fair Play",
    body: "The calls, the retroactive corrections, and who answers for them. Home of our flagship investigation, Unwhistled.",
    accent: "var(--crimson)",
    flagship: true,
  },
  {
    n: "03",
    title: "Player Protection",
    body: "Safety, health, and how leagues protect — or fail to protect — the athletes the game is built on.",
    accent: "var(--electric)",
  },
  {
    n: "04",
    title: "Media & Narrative",
    body: "How coverage shapes what fans believe, which stories get amplified, and which ones quietly get buried.",
    accent: "var(--gold)",
  },
  {
    n: "05",
    title: "Institutional Accountability",
    body: "Governance, leadership, and the systems meant to protect the game when no one is watching.",
    accent: "var(--electric)",
  },
]

export function Coverage() {
  return (
    <section className="relative border-y border-line/60 px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">What we investigate</p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.95] text-bone">
              Integrity isn&apos;t one call. <span className="text-gradient-gold">It&apos;s the whole system.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-md text-[15px] leading-relaxed text-steel lg:text-right">
              Officiating is where we started. But fairness runs deeper than a whistle — through
              the rules, the coverage, the health of the athletes, and the institutions that answer
              to no one. We follow all of it.
            </p>
          </Reveal>
        </div>

        <motion.ul
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="border-t border-line"
        >
          {areas.map((a) => (
            <motion.li
              key={a.n}
              variants={{
                hidden: { opacity: 0, y: 24 },
                show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="group relative border-b border-line"
              data-cursor
            >
              {/* hover wash */}
              <span
                className="pointer-events-none absolute inset-0 origin-left scale-x-0 opacity-0 transition-all duration-500 group-hover:scale-x-100 group-hover:opacity-100"
                style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${a.accent} 8%, transparent), transparent 60%)` }}
              />
              <div className="relative grid grid-cols-[auto_1fr] items-baseline gap-6 py-8 transition-transform duration-500 group-hover:translate-x-2 sm:grid-cols-[auto_1.1fr_2fr] sm:gap-10">
                <span className="mono text-sm" style={{ color: a.accent }}>
                  {a.n}
                </span>
                <h3 className="text-2xl leading-none text-bone sm:text-3xl">
                  {a.title}
                  {a.flagship && (
                    <span className="mono ml-3 align-middle text-[10px] text-crimson-soft">Flagship</span>
                  )}
                </h3>
                <p className="col-span-2 max-w-xl text-[15px] leading-relaxed text-steel sm:col-span-1 sm:mt-1">
                  {a.body}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
