/**
 * Flywheel OS — Nurture (NURTURE stage)
 * ------------------------------------------------------------------
 * "Every lead is nurtured through automation." A sequence is an ordered
 * set of steps (email / SMS / task) fired on a delay after enrollment.
 * Steps can carry an `offerSlug`, so nurture is where NURTURE hands off
 * to CONVERT — the follow-up itself pitches the connected offer.
 *
 * Sequences are data. Adding a drip campaign is a config entry, and the
 * same engine schedules it — no per-campaign code.
 */

import { z } from "zod"

export const NURTURE_CHANNELS = ["email", "sms", "task"] as const

export const nurtureStepSchema = z.object({
  /** Delay after the previous step (or enrollment) in hours. */
  delayHours: z.number().nonnegative(),
  channel: z.enum(NURTURE_CHANNELS),
  subject: z.string().min(1),
  /** Body / template key. */
  body: z.string().min(1),
  /** Offer this step promotes, if any (NURTURE → CONVERT handoff). */
  offerSlug: z.string().optional(),
})

export const nurtureSequenceSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  /** The lead intent this sequence serves. */
  goal: z.string().min(1),
  steps: z.array(nurtureStepSchema).min(1),
})

export type NurtureStep = z.infer<typeof nurtureStepSchema>
export type NurtureSequence = z.infer<typeof nurtureSequenceSchema>
export type NurtureSequenceInput = z.input<typeof nurtureSequenceSchema>

/** A lead's live position in a sequence. */
export interface Enrollment {
  email: string
  brandId: string
  sequenceSlug: string
  stepIndex: number
  enrolledAt: Date
  /** When the next step is due to fire. */
  nextRunAt: Date
  status: "active" | "completed"
}
