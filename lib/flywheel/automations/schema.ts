/**
 * Flywheel OS — Automations (AUTOMATE capability)
 * ------------------------------------------------------------------
 * "Every repetitive task is automated with AI." An automation binds a
 * trigger (an event name or a schedule) to an action run by a runner —
 * an AI agent, a Zapier zap, or an internal function. Declaring an
 * automation is data; the runner that executes it is pluggable.
 *
 * The `runner` values map to the capabilities this OS actually has:
 * `agent` (Claude), `zapier`, `mcp` (a connected MCP tool), or
 * `function` (in-repo code).
 */

import { z } from "zod"
import { FLYWHEEL_EVENTS } from "../events/schema"

export const AUTOMATION_RUNNERS = ["agent", "zapier", "mcp", "function"] as const

/** Fire on a flywheel event, or on a cron schedule. */
export const automationTriggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), event: z.enum(FLYWHEEL_EVENTS) }),
  z.object({ type: z.literal("schedule"), cron: z.string().min(1) }),
])

export const automationSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  /** What repetitive task this replaces, in one line. */
  replaces: z.string().min(1),
  trigger: automationTriggerSchema,
  runner: z.enum(AUTOMATION_RUNNERS),
  /** Prompt (for agent runners) or target ref (for zapier/mcp/function). */
  spec: z.string().min(1),
  enabled: z.boolean().default(true),
})

export type Automation = z.infer<typeof automationSchema>
export type AutomationInput = z.input<typeof automationSchema>
export type AutomationTrigger = z.infer<typeof automationTriggerSchema>
