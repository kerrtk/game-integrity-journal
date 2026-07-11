"use client"

import { motion } from "framer-motion"

import { Reveal } from "@/components/fx/reveal"
import { inViewOnce, stagger } from "@/lib/motion"

/**
 * Testimonials wall. NOTE: placeholder quotes/attribution — replace with
 * real endorsements before launch.
 */
const quotes = [
  {
    quote: "The receipts nobody else bothered to keep. Unwhistled doesn't argue — it documents.",
    name: "Placeholder Name",
    role: "Sports columnist",
  },
  {
    quote: "Reads like a case file because it is one. Every claim is sourced, every pattern earned.",
    name: "Placeholder Name",
    role: "Former official",
  },
  {
    quote: "This is what accountability looks like when someone actually keeps the record.",
    name: "Placeholder Name",
    role: "Broadcast analyst",
  },
]

export function Testimonials() {
  return (
    <section className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal variant="blur" className="mb-14 max-w-2xl">
          <p className="mono mb-5 text-[11px] text-gold-soft">Early praise</p>
          <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold uppercase leading-[0.95] text-bone">
            What readers are <span className="text-gradient-gold">saying.</span>
          </h2>
        </Reveal>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="grid gap-6 md:grid-cols-3"
        >
          {quotes.map((q, i) => (
            <motion.figure
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="glass flex h-full flex-col rounded-lg p-7"
            >
              <span className="cinema text-5xl leading-none text-gold/70" aria-hidden>
                &ldquo;
              </span>
              <blockquote className="-mt-2 flex-1 text-[15px] leading-relaxed text-ash">
                {q.quote}
              </blockquote>
              <figcaption className="mt-6 border-t border-line pt-4">
                <p className="text-sm font-semibold text-bone">{q.name}</p>
                <p className="mono mt-1 text-[10px] text-steel">{q.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
