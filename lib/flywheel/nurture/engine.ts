/**
 * Flywheel OS — Nurture Engine
 * ------------------------------------------------------------------
 * Enrolls leads into sequences and computes which steps are due. The
 * engine is deliberately storage-agnostic: it keeps enrollments in
 * memory here, but the same API backs a cron/queue worker in production
 * (a scheduled route calls `due()` and `advance()` on each tick).
 */

import type { ReadonlyRegistry } from "../core/registry"
import { err, ok, type Result } from "../core/result"
import type { EventBus } from "../events/bus"
import type { Lead } from "../capture/schema"
import type { Enrollment, NurtureSequence } from "./schema"

const HOUR_MS = 60 * 60 * 1000

export class NurtureEngine {
  private readonly enrollments: Enrollment[] = []

  constructor(
    private readonly sequences: ReadonlyRegistry<NurtureSequence>,
    private readonly bus: EventBus
  ) {}

  /** Enroll a lead into a sequence, scheduling its first step. */
  enroll(lead: Lead, sequenceSlug: string): Result<Enrollment> {
    const sequence = this.sequences.get(lead.brandId, sequenceSlug)
    if (!sequence) return err(`Unknown sequence "${sequenceSlug}".`)

    const already = this.enrollments.find(
      (e) => e.email === lead.email && e.sequenceSlug === sequenceSlug && e.status === "active"
    )
    if (already) return ok(already)

    const now = new Date()
    const enrollment: Enrollment = {
      email: lead.email,
      brandId: lead.brandId,
      sequenceSlug,
      stepIndex: 0,
      enrolledAt: now,
      nextRunAt: new Date(now.getTime() + sequence.steps[0].delayHours * HOUR_MS),
      status: "active",
    }
    this.enrollments.push(enrollment)
    return ok(enrollment)
  }

  /** Enrollments whose next step is due at or before `at`. */
  due(at: Date = new Date()): Enrollment[] {
    return this.enrollments.filter((e) => e.status === "active" && e.nextRunAt <= at)
  }

  /**
   * Fire the current step of an enrollment and schedule the next.
   * A worker loops `for (const e of engine.due()) await engine.advance(e)`.
   */
  async advance(enrollment: Enrollment): Promise<Result<Enrollment>> {
    const sequence = this.sequences.get(enrollment.brandId, enrollment.sequenceSlug)
    if (!sequence) return err("Sequence no longer exists.")

    const step = sequence.steps[enrollment.stepIndex]
    if (!step) return err("Step out of range.")

    await this.bus.track({
      name: "nurture.step_sent",
      stage: "nurture",
      brandId: enrollment.brandId,
      entity: enrollment.sequenceSlug,
      subjectId: enrollment.email,
      props: { step: enrollment.stepIndex, channel: step.channel, offer: step.offerSlug ?? null },
    })

    const nextIndex = enrollment.stepIndex + 1
    if (nextIndex >= sequence.steps.length) {
      enrollment.status = "completed"
      await this.bus.track({
        name: "nurture.completed",
        stage: "nurture",
        brandId: enrollment.brandId,
        entity: enrollment.sequenceSlug,
        subjectId: enrollment.email,
      })
    } else {
      enrollment.stepIndex = nextIndex
      enrollment.nextRunAt = new Date(
        Date.now() + sequence.steps[nextIndex].delayHours * HOUR_MS
      )
    }
    return ok(enrollment)
  }

  activeCount(): number {
    return this.enrollments.filter((e) => e.status === "active").length
  }
}
