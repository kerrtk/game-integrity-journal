"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

import { Reveal } from "@/components/fx/reveal"
import { inViewOnce, stagger } from "@/lib/motion"
import type { JournalEntry } from "@/lib/content/schema"

/** A single 3D-tilt card that reacts to the cursor with depth + glare. */
function TiltCard({ entry }: { entry: JournalEntry }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const rx = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 200, damping: 20 })
  const ry = useSpring(useTransform(px, [0, 1], [-8, 8]), { stiffness: 200, damping: 20 })
  const glareX = useTransform(px, [0, 1], ["0%", "100%"])

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  function onLeave() {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40 },
        show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
      }}
      style={{ perspective: 1000 }}
    >
      <motion.a
        ref={ref}
        href={`/journal/${entry.slug}`}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="group relative block h-full overflow-hidden rounded-lg border border-line bg-graphite p-7 transition-colors duration-500 hover:border-gold/40"
        data-cursor
      >
        <motion.span
          aria-hidden
          style={{ left: glareX }}
          className="pointer-events-none absolute top-0 h-full w-1/2 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--gold)_16%,transparent),transparent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <span className="mono text-[11px] text-crimson-soft">File No. {entry.fileNo}</span>
        <h3 className="mt-4 text-xl leading-tight text-bone">{entry.title}</h3>
        <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-steel">{entry.dek}</p>
        <span className="mono mt-6 inline-flex items-center gap-2 text-[11px] text-gold-soft">
          Read report
          <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
        </span>
      </motion.a>
    </motion.div>
  )
}

export function JournalRail({ entries }: { entries: JournalEntry[] }) {
  return (
    <section className="relative px-6 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">From the Journal</p>
            <h2 className="font-display text-[clamp(2rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.95] text-bone">
              The record, <span className="text-gradient-gold">kept current.</span>
            </h2>
          </Reveal>
          <Reveal>
            <Link
              href="/journal"
              className="mono text-[12px] text-steel underline-offset-4 transition-colors hover:text-gold-soft hover:underline"
            >
              All reports &rarr;
            </Link>
          </Reveal>
        </div>

        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inViewOnce}
          className="grid gap-6 md:grid-cols-3"
        >
          {entries.map((entry) => (
            <TiltCard key={entry.slug} entry={entry} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
