/**
 * Flywheel OS — Nurture Engine
 * ------------------------------------------------------------------
 * Enrolls leads into sequences, computes which steps are due, and — via
 * a pluggable `MessageSender` — actually delivers each step. The engine
 * is storage-agnostic: it keeps enrollments in memory here, but the same
 * API backs a cron/queue worker in production (a scheduled route calls
 * `due()` then `advance()` on each tick).
 *
 * Each `email`/`sms` step is sent for real; `task` steps are internal
 * ops actions and are tracked but not messaged. Sending is
 * failure-isolated: a bad send is recorded and the sequence still
 * advances, so one dropped email never stalls a lead's journey.
 */

import type { ReadonlyRegistry } from "../core/registry"
import { err, ok, type Result } from "../core/result"
import type { EventBus } from "../events/bus"
import type { Lead } from "../capture/schema"
import type { Offer } from "../offers/schema"
import { consoleSender, escapeHtml, type MessageSender, type OutboundMessage } from "./sender"
import type { Enrollment, NurtureSequence, NurtureStep } from "./schema"

const HOUR_MS = 60 * 60 * 1000
const DEFAULT_SITE_URL = "https://gameintegrityjournal.com"

export interface NurtureEngineOptions {
  /** Delivers email/sms steps. Defaults to the console sender. */
  sender?: MessageSender
  /** Offer catalog, used to attach a CTA link to steps with an offerSlug. */
  offers?: ReadonlyRegistry<Offer>
  /** Absolute base URL for building offer links in messages. */
  siteUrl?: string
}

export class NurtureEngine {
  private readonly enrollments: Enrollment[] = []
  private readonly sender: MessageSender
  private readonly offers?: ReadonlyRegistry<Offer>
  private readonly siteUrl: string

  constructor(
    private readonly sequences: ReadonlyRegistry<NurtureSequence>,
    private readonly bus: EventBus,
    options: NurtureEngineOptions = {}
  ) {
    this.sender = options.sender ?? consoleSender
    this.offers = options.offers
    this.siteUrl = options.siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL
  }

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
   * Deliver the current step of an enrollment and schedule the next.
   * A worker loops `for (const e of engine.due()) await engine.advance(e)`.
   */
  async advance(enrollment: Enrollment): Promise<Result<Enrollment>> {
    const sequence = this.sequences.get(enrollment.brandId, enrollment.sequenceSlug)
    if (!sequence) return err("Sequence no longer exists.")

    const step = sequence.steps[enrollment.stepIndex]
    if (!step) return err("Step out of range.")

    // Deliver the step (email/sms). `task` steps are internal, not messaged.
    const delivery = await this.deliver(step, enrollment)

    await this.bus.track({
      name: "nurture.step_sent",
      stage: "nurture",
      brandId: enrollment.brandId,
      entity: enrollment.sequenceSlug,
      subjectId: enrollment.email,
      props: {
        step: enrollment.stepIndex,
        channel: step.channel,
        offer: step.offerSlug ?? null,
        delivered: delivery.delivered,
        via: this.sender.slug,
        ...(delivery.error ? { error: delivery.error } : {}),
      },
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
      enrollment.nextRunAt = new Date(Date.now() + sequence.steps[nextIndex].delayHours * HOUR_MS)
    }
    return ok(enrollment)
  }

  /** Send one step, returning whether it was delivered. Never throws. */
  private async deliver(
    step: NurtureStep,
    enrollment: Enrollment
  ): Promise<{ delivered: boolean; error?: string }> {
    if (step.channel === "task") return { delivered: false }
    // Leads carry an email but no phone, so SMS steps can't be delivered yet.
    if (step.channel === "sms") return { delivered: false, error: "no_recipient" }
    if (!this.sender.supports(step.channel)) {
      return { delivered: false, error: `sender ${this.sender.slug} lacks ${step.channel}` }
    }

    const message = this.buildMessage(step, enrollment)
    const result = await this.sender.send(message)
    return result.ok ? { delivered: true } : { delivered: false, error: result.error }
  }

  /** Build the outbound message for a step, attaching the offer CTA. */
  private buildMessage(step: NurtureStep, enrollment: Enrollment): OutboundMessage {
    const offer =
      step.offerSlug && this.offers
        ? this.offers.get(enrollment.brandId, step.offerSlug)
        : undefined

    const ctaText = offer ? `\n\n${offer.name}: ${this.absolute(offer.url)}` : ""
    const ctaHtml = offer
      ? `<p><a href="${this.absolute(offer.url)}">${escapeHtml(offer.name)}</a></p>`
      : ""

    return {
      channel: "email",
      to: enrollment.email,
      subject: step.subject,
      text: `${step.body}${ctaText}`,
      html: `<p>${escapeHtml(step.body)}</p>${ctaHtml}`,
      tags: [enrollment.sequenceSlug],
    }
  }

  /** Resolve a possibly-relative offer URL to an absolute link. */
  private absolute(url: string): string {
    if (/^https?:\/\//.test(url)) return url
    return `${this.siteUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
  }

  activeCount(): number {
    return this.enrollments.filter((e) => e.status === "active").length
  }
}
