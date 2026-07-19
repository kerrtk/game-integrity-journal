/**
 * Flywheel OS — Capture (CAPTURE stage)
 * ------------------------------------------------------------------
 * "Every visitor enters a lead-capture system." A capture form is a
 * named entry point (footer signup, book waitlist, exit-intent modal).
 * Each form declares which lead-magnet it delivers and which nurture
 * sequence a new lead is enrolled in — so capture, delivery, and
 * follow-up are one connected unit, not three disconnected tools.
 */

import { z } from "zod"

export const captureFormSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  /** Short reason-to-subscribe shown near the form. */
  incentive: z.string().min(1),
  /** Nurture sequence a new lead is enrolled into on submit. */
  enrollSequence: z.string().optional(),
  /** Provider slug used to persist the lead (see providers.ts). */
  provider: z.string().default("console"),
  /** Tags applied to the lead for segmentation. */
  tags: z.array(z.string()).default([]),
})

export type CaptureForm = z.infer<typeof captureFormSchema>
export type CaptureFormInput = z.input<typeof captureFormSchema>

/** The payload a visitor submits. Kept minimal + privacy-conscious. */
export const leadInputSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  /** Which form was submitted. */
  form: z.string().min(1),
  /** Which brand owns the form. */
  brandId: z.string().min(1),
  /** Attribution: the content path that referred this visitor. */
  source: z.string().optional(),
})

export type LeadInput = z.infer<typeof leadInputSchema>

export interface Lead extends LeadInput {
  tags: string[]
  capturedAt: Date
}
