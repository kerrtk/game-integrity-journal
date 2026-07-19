/**
 * Flywheel OS — Capture Providers
 * ------------------------------------------------------------------
 * A provider is where a captured lead is persisted / synced: an ESP
 * (Brevo, MailerLite), a CRM, or — for now — the console and an
 * in-memory list. Swapping ESPs is a one-line config change on the
 * capture form, never a code change to the pipeline.
 *
 * Real ESP providers can be added here as thin adapters; they only need
 * to implement `deliver()`. The MCP connectors available to this OS
 * (Brevo, MailerLite, Zapier) are the natural production backends.
 */

import { attempt, type Result } from "../core/result"
import type { Lead } from "./schema"

export interface CaptureProvider {
  readonly slug: string
  deliver(lead: Lead): Promise<Result<{ id: string }>>
}

/** Logs the lead. Safe default so capture never hard-fails in dev. */
export const consoleProvider: CaptureProvider = {
  slug: "console",
  async deliver(lead) {
    // eslint-disable-next-line no-console
    console.log(`[flywheel] lead captured: ${lead.email} via ${lead.form} (${lead.brandId})`)
    return attempt(() => ({ id: `console_${Date.now()}` }))
  },
}

/** Retains leads in memory for the dashboard. Ephemeral by design. */
export class MemoryProvider implements CaptureProvider {
  readonly slug = "memory"
  private readonly leads: Lead[] = []

  async deliver(lead: Lead): Promise<Result<{ id: string }>> {
    this.leads.push(lead)
    return attempt(() => ({ id: `mem_${this.leads.length}` }))
  }

  all(): Lead[] {
    return [...this.leads]
  }

  count(): number {
    return this.leads.length
  }
}

/** Registry of available providers, keyed by slug. */
export class ProviderRegistry {
  private readonly providers = new Map<string, CaptureProvider>()

  use(provider: CaptureProvider): this {
    this.providers.set(provider.slug, provider)
    return this
  }

  get(slug: string): CaptureProvider | undefined {
    return this.providers.get(slug)
  }
}
