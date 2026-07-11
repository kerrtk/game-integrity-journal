"use client"

import { motion, type Variants } from "framer-motion"
import type { ReactNode } from "react"

import { inViewOnce, revealBlur, revealUp } from "@/lib/motion"

/**
 * Drop-in scroll reveal. Wrap any block and it fades/rises into view
 * once. `variant="blur"` gives the cinematic blur-in used for headlines.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  variant = "up",
  as = "div",
}: {
  children: ReactNode
  className?: string
  delay?: number
  variant?: "up" | "blur"
  as?: "div" | "section" | "li" | "span"
}) {
  const variants: Variants = variant === "blur" ? revealBlur : revealUp
  const MotionTag = motion[as] as typeof motion.div

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={inViewOnce}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  )
}
