/**
 * Flywheel OS — Event Schema
 * ------------------------------------------------------------------
 * A single, typed event envelope that every stage of the flywheel
 * emits. Because all modules speak this one vocabulary, analytics is
 * "measure everything" by construction: if it happened in the OS,
 * it was an event, and every event can be routed to any sink.
 */

import { z } from "zod"
import { FLYWHEEL_STAGES } from "../core/types"

/** Canonical event names, grouped by the stage that emits them. */
export const FLYWHEEL_EVENTS = [
  // attract
  "content.viewed",
  "content.shared",
  // capture
  "lead.identified",
  "capture.submitted",
  "capture.failed",
  // nurture
  "nurture.enrolled",
  "nurture.step_sent",
  "nurture.completed",
  // convert
  "offer.viewed",
  "offer.clicked",
  "order.placed",
  // expand
  "offer.cross_sold",
  "advocate.referred",
] as const

export type FlywheelEventName = (typeof FLYWHEEL_EVENTS)[number]

export const flywheelEventSchema = z.object({
  name: z.enum(FLYWHEEL_EVENTS),
  stage: z.enum(FLYWHEEL_STAGES),
  brandId: z.string().min(1),
  /** Anonymous or known subject (visitor id, lead email hash, etc.). */
  subjectId: z.string().optional(),
  /** Slug of the entity involved (content, offer, sequence …). */
  entity: z.string().optional(),
  /** Free-form, JSON-serializable context. */
  props: z.record(z.string(), z.unknown()).default({}),
  /** Monetary value in cents, when the event carries revenue intent. */
  valueCents: z.number().int().nonnegative().optional(),
  at: z.coerce.date().default(() => new Date()),
})

export type FlywheelEvent = z.infer<typeof flywheelEventSchema>
export type FlywheelEventInput = z.input<typeof flywheelEventSchema>
