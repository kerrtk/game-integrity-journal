/**
 * Flywheel OS — Analytics (MEASURE capability)
 * ------------------------------------------------------------------
 * "Every action is measured." Because every module emits the one typed
 * event envelope, KPIs are pure functions over the event stream — no
 * bespoke tracking per feature. These power the OS dashboard and can be
 * recomputed from any durable event store in production.
 */

import type { FlywheelStage } from "../core/types"
import { FLYWHEEL_STAGES } from "../core/types"
import type { FlywheelEvent } from "../events/schema"

export interface StageMetric {
  stage: FlywheelStage
  events: number
  /** Distinct known subjects that reached this stage. */
  subjects: number
}

export interface FlywheelSnapshot {
  totalEvents: number
  revenueCents: number
  byStage: StageMetric[]
  /** Capture → convert conversion, 0..1. */
  conversionRate: number
  /** Leads captured (lead.identified events). */
  leads: number
  /** Orders placed. */
  orders: number
}

export function snapshot(events: FlywheelEvent[], brandId?: string): FlywheelSnapshot {
  const scoped = brandId ? events.filter((e) => e.brandId === brandId) : events

  const byStage: StageMetric[] = FLYWHEEL_STAGES.map((stage) => {
    const stageEvents = scoped.filter((e) => e.stage === stage)
    const subjects = new Set(stageEvents.map((e) => e.subjectId).filter(Boolean))
    return { stage, events: stageEvents.length, subjects: subjects.size }
  })

  const leads = new Set(
    scoped.filter((e) => e.name === "lead.identified").map((e) => e.subjectId ?? e.at.toISOString())
  ).size
  const orders = scoped.filter((e) => e.name === "order.placed").length
  const revenueCents = scoped.reduce((sum, e) => sum + (e.valueCents ?? 0), 0)

  return {
    totalEvents: scoped.length,
    revenueCents,
    byStage,
    conversionRate: leads > 0 ? orders / leads : 0,
    leads,
    orders,
  }
}
