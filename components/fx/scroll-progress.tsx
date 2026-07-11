"use client"

import { motion, useScroll, useSpring } from "framer-motion"

/**
 * Thin cinematic progress bar across the top of the viewport —
 * crimson → gold → electric, tracking read progress.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 })

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[90] h-[2px] origin-left bg-[linear-gradient(90deg,var(--crimson),var(--gold),var(--electric))]"
    />
  )
}
