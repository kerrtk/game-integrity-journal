/**
 * Flywheel OS — Capture Pipeline
 * ------------------------------------------------------------------
 * The one path every lead flows through, wiring the CAPTURE stage into
 * NURTURE and MEASURE:
 *
 *   validate → resolve form → persist via provider → enroll in nurture
 *            → emit analytics events
 *
 * Each step is independent and failure-isolated, so a flaky ESP degrades
 * to a logged lead instead of a 500 to the visitor.
 */

import type { ReadonlyRegistry } from "../core/registry"
import { err, ok, type Result } from "../core/result"
import type { EventBus } from "../events/bus"
import type { NurtureEngine } from "../nurture/engine"
import {
  leadInputSchema,
  type CaptureForm,
  type Lead,
  type LeadInput,
} from "./schema"
import type { ProviderRegistry } from "./providers"

export interface CaptureResult {
  lead: Lead
  providerId: string
  enrolledSequence?: string
}

export class CapturePipeline {
  constructor(
    private readonly forms: ReadonlyRegistry<CaptureForm>,
    private readonly providers: ProviderRegistry,
    private readonly nurture: NurtureEngine,
    private readonly bus: EventBus
  ) {}

  async capture(input: LeadInput): Promise<Result<CaptureResult>> {
    const parsed = leadInputSchema.safeParse(input)
    if (!parsed.success) {
      await this.bus.track({
        name: "capture.failed",
        stage: "capture",
        brandId: input?.brandId ?? "unknown",
        props: { reason: "validation" },
      })
      return err("A valid email address and form are required.")
    }

    const data = parsed.data
    const form = this.forms.get(data.brandId, data.form)
    if (!form) {
      await this.bus.track({
        name: "capture.failed",
        stage: "capture",
        brandId: data.brandId,
        entity: data.form,
        props: { reason: "unknown_form" },
      })
      return err(`Unknown capture form "${data.form}".`)
    }

    const lead: Lead = {
      ...data,
      tags: form.tags,
      capturedAt: new Date(),
    }

    // Persist via the form's chosen provider (ESP / CRM / console).
    const provider = this.providers.get(form.provider) ?? this.providers.get("console")
    if (!provider) return err("No capture provider available.")

    const delivered = await provider.deliver(lead)
    if (!delivered.ok) {
      await this.bus.track({
        name: "capture.failed",
        stage: "capture",
        brandId: data.brandId,
        entity: form.slug,
        subjectId: data.email,
        props: { reason: "provider_error", provider: provider.slug, error: delivered.error },
      })
      return err("We couldn't save your details. Please try again.")
    }

    // Lead is now identified — announce it.
    await this.bus.track({
      name: "lead.identified",
      stage: "capture",
      brandId: data.brandId,
      entity: form.slug,
      subjectId: data.email,
      props: { source: data.source ?? null, provider: provider.slug },
    })

    // Enroll into the form's nurture sequence (NURTURE stage).
    let enrolledSequence: string | undefined
    if (form.enrollSequence) {
      const enrolled = this.nurture.enroll(lead, form.enrollSequence)
      if (enrolled.ok) {
        enrolledSequence = form.enrollSequence
        await this.bus.track({
          name: "nurture.enrolled",
          stage: "nurture",
          brandId: data.brandId,
          entity: form.enrollSequence,
          subjectId: data.email,
        })
      }
    }

    await this.bus.track({
      name: "capture.submitted",
      stage: "capture",
      brandId: data.brandId,
      entity: form.slug,
      subjectId: data.email,
    })

    return ok({ lead, providerId: delivered.value.id, enrolledSequence })
  }
}
