/**
 * Flywheel OS — Processes (OPERATE capability)
 * ------------------------------------------------------------------
 * "Every business process is documented." A process is a versioned SOP:
 * ordered steps, an owner, a trigger, and — importantly — the slug of
 * the automation that can run it hands-free. Documenting a process is
 * therefore the first step to automating it: the SOP is the spec.
 */

import { z } from "zod"

export const processStepSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
  /** Whether this step is already automated (see automations module). */
  automated: z.boolean().default(false),
})

export const processSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  /** Which flywheel stage / capability this SOP supports. */
  area: z.enum(["attract", "capture", "nurture", "convert", "expand", "operate"]),
  /** What kicks this process off. */
  trigger: z.string().min(1),
  owner: z.string().min(1),
  steps: z.array(processStepSchema).min(1),
  /** Automation that executes this SOP end-to-end, if one exists. */
  automationSlug: z.string().optional(),
  version: z.string().default("1.0"),
})

export type Process = z.infer<typeof processSchema>
export type ProcessInput = z.input<typeof processSchema>
