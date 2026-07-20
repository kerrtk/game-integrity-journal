"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

import { CountUp } from "@/components/fx/count-up"

/**
 * Animated funding progress bar. NOTE: placeholder goal/raised figures —
 * wire to real numbers (or a live source) before launch.
 */
const RAISED = 18400
const GOAL = 40000

export function FundingProgress() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const pct = Math.min(100, Math.round((RAISED / GOAL) * 100))

  return (
    <div ref={ref} className="glass rounded-xl p-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-display text-4xl font-extrabold text-gradient-gold">
            <CountUp value={RAISED} prefix="$" />
          </p>
          <p className="mono mt-1 text-[11px] text-steel">Raised this quarter</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold text-bone">${GOAL.toLocaleString()}</p>
          <p className="mono mt-1 text-[11px] text-steel">Goal</p>
        </div>
      </div>
      <div className="mt-6 h-3 overflow-hidden rounded-full bg-graphite">
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--crimson),var(--gold),var(--electric))]"
        />
      </div>
      <p className="mono mt-3 text-[11px] text-gold-soft">{pct}% funded · reader-supported</p>
    </div>
  )
}
