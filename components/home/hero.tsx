"use client"

import Link from "next/link"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { Aurora } from "@/components/fx/aurora"
import { Magnetic } from "@/components/fx/magnetic"
import { Button } from "@/components/ui/button"
import { EASE_OUT_EXPO, stagger } from "@/lib/motion"

const line = {
  hidden: { opacity: 0, y: "110%" },
  show: { opacity: 1, y: "0%", transition: { duration: 1, ease: EASE_OUT_EXPO } },
}

/**
 * Cinematic hero. Layered parallax on scroll, a mouse-reactive glow,
 * word-by-word masked headline reveal, and magnetic CTAs.
 */
export function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })

  // Depth parallax — layers move at different rates as you scroll away.
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -120])
  const ySub = useTransform(scrollYProgress, [0, 1], [0, -60])
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.08])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden px-6 pt-16"
      data-cursor
    >
      <motion.div style={{ scale }} className="absolute inset-0">
        <Aurora />
      </motion.div>

      <div className="mx-auto w-full max-w-6xl">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.1 }}
          className="mono mb-8 flex items-center gap-3 text-[11px] text-gold-soft"
        >
          <span className="inline-block h-px w-10 bg-gold/70" />
          Independent investigations · Integrity in sport
        </motion.p>

        <motion.h1
          style={{ y: yTitle, opacity }}
          variants={stagger(0.12, 0.15)}
          initial="hidden"
          animate="show"
          className="max-w-[15ch] font-display text-[clamp(3rem,9vw,7.5rem)] font-extrabold uppercase leading-[0.9] tracking-tight"
        >
          <span className="block overflow-hidden">
            <motion.span variants={line} className="block text-gradient-bone">
              The game is
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span variants={line} className="block text-gradient-bone">
              only as fair as
            </motion.span>
          </span>
          <span className="block overflow-hidden">
            <motion.span variants={line} className="block text-gradient-gold">
              the record we keep.
            </motion.span>
          </span>
        </motion.h1>

        <motion.p
          style={{ y: ySub, opacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.7 }}
          className="mt-8 max-w-[52ch] text-lg leading-relaxed text-ash sm:text-xl"
        >
          Game Integrity Journal is an independent platform investigating fairness,
          accountability, and transparency across sport — documented, sourced, and
          impossible to ignore.
        </motion.p>

        <motion.div
          style={{ opacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE_OUT_EXPO, delay: 0.9 }}
          className="mt-11 flex flex-wrap items-center gap-4"
        >
          <Magnetic>
            <Button asChild variant="gold" size="lg">
              <Link href="/unwhistled">Read Unwhistled</Link>
            </Button>
          </Magnetic>
          <Magnetic>
            <Button asChild variant="glass" size="lg">
              <Link href="/journal">Explore the Journal</Link>
            </Button>
          </Magnetic>
        </motion.div>
      </div>

      {/* scroll cue */}
      <motion.div
        style={{ opacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="mono text-[10px] text-steel">Scroll</span>
        <span className="relative flex h-10 w-6 justify-center rounded-full border border-line">
          <motion.span
            className="mt-1.5 h-1.5 w-1 rounded-full bg-gold"
            animate={{ y: [0, 12, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  )
}
