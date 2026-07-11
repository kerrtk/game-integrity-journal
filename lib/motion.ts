import type { Variants, Transition } from "framer-motion"

/**
 * Shared motion language for the cinematic system.
 * One easing + a few reusable variants keeps every reveal feeling
 * like part of the same film rather than a grab-bag of animations.
 */

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

export const baseTransition: Transition = {
  duration: 0.9,
  ease: EASE_OUT_EXPO,
}

/** Fade + rise — the default section/element reveal. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 42 },
  show: { opacity: 1, y: 0, transition: baseTransition },
}

/** Blur-in reveal for hero / editorial headlines. */
export const revealBlur: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(14px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { ...baseTransition, duration: 1.1 } },
}

/** Container that staggers its children (line-by-line text reveals). */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren, delayChildren } },
})

/** Scale + fade for cards / imagery entering the frame. */
export const revealScale: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: baseTransition },
}

/** Standard in-view trigger config (fires once, a bit before fully visible). */
export const inViewOnce = { once: true, amount: 0.35 } as const
