"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when the user (or their OS) asks for reduced motion.
 * Every heavy effect (Lenis, cursor, 3D, parallax) checks this and
 * degrades to a calm, static experience.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefers(mq.matches)
    const onChange = () => setPrefers(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return prefers
}
