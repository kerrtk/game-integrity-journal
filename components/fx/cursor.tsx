"use client"

import { useEffect, useState } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

/**
 * Custom cursor: a small gold dot with a lagging glass ring that
 * expands over interactive elements. Pointer-fine devices only,
 * and never when reduced motion is requested.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false)
  const [active, setActive] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 350, damping: 28, mass: 0.6 })
  const ringY = useSpring(y, { stiffness: 350, damping: 28, mass: 0.6 })

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!fine || reduced) return
    setEnabled(true)

    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      const el = e.target as HTMLElement
      setActive(Boolean(el.closest("a, button, [data-cursor]")))
    }
    window.addEventListener("pointermove", move)
    return () => window.removeEventListener("pointermove", move)
  }, [x, y])

  if (!enabled) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[95] hidden md:block">
      {/* precise dot */}
      <motion.div
        style={{ x, y }}
        className="absolute -ml-1 -mt-1 h-2 w-2 rounded-full bg-gold mix-blend-difference"
      />
      {/* lagging ring */}
      <motion.div
        style={{ x: ringX, y: ringY, scale: active ? 1.9 : 1 }}
        transition={{ scale: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } }}
        className="absolute -ml-5 -mt-5 h-10 w-10 rounded-full border border-bone/40 backdrop-blur-[1px] mix-blend-difference"
      />
    </div>
  )
}
