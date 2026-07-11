"use client"

import { motion } from "framer-motion"

/**
 * Cinematic animated backdrop: slow-drifting crimson / gold / electric
 * light blooms over the ink base, plus a faint editorial grid and a
 * vignette. Pure CSS transforms — cheap, GPU-friendly, and it sits
 * behind content at -z so it never intercepts pointer events.
 */
export function Aurora({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-grid opacity-[0.5]" />

      <motion.div
        className="absolute -left-1/4 top-[-20%] h-[70vh] w-[70vh] rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--crimson) 45%, transparent), transparent 60%)" }}
        animate={{ x: [0, 80, -40, 0], y: [0, 60, 30, 0], scale: [1, 1.15, 0.95, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-15%] top-[10%] h-[60vh] w-[60vh] rounded-full blur-[130px]"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 34%, transparent), transparent 62%)" }}
        animate={{ x: [0, -70, 30, 0], y: [0, 50, -30, 0], scale: [1, 1.1, 0.9, 1] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-25%] left-[20%] h-[65vh] w-[65vh] rounded-full blur-[140px]"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--electric) 30%, transparent), transparent 62%)" }}
        animate={{ x: [0, 60, -50, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 1, 1] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* vignette + top fade for legibility */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,transparent_40%,var(--ink)_100%)]" />
    </div>
  )
}
