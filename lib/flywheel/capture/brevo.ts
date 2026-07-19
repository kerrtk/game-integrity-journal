/**
 * Flywheel OS — Brevo Capture Provider
 * ------------------------------------------------------------------
 * Production adapter that persists a captured lead as a Brevo contact
 * via Brevo's REST API. This is a server-side integration: it uses an
 * API key from the environment (not an MCP connector), so it works in
 * the deployed app.
 *
 * Activation is env-driven (see os.ts): the provider is only registered
 * when `BREVO_API_KEY` is present. When it's absent, the capture
 * pipeline transparently falls back to the console provider, so preview
 * deploys without secrets never break signups.
 *
 * Env:
 *   BREVO_API_KEY   (required to activate)
 *   BREVO_LIST_ID   (optional) numeric list id new contacts are added to
 */

import { attempt, err, ok, type Result } from "../core/result"
import type { CaptureProvider } from "./providers"
import type { Lead } from "./schema"

const BREVO_CONTACTS_URL = "https://api.brevo.com/v3/contacts"

export class BrevoProvider implements CaptureProvider {
  readonly slug = "brevo"

  constructor(
    private readonly apiKey = process.env.BREVO_API_KEY ?? "",
    private readonly listId = process.env.BREVO_LIST_ID
  ) {}

  async deliver(lead: Lead): Promise<Result<{ id: string }>> {
    if (!this.apiKey) return err("BREVO_API_KEY is not configured.")

    const body: Record<string, unknown> = {
      email: lead.email,
      updateEnabled: true, // upsert: don't fail if the contact exists
      attributes: {
        ...(lead.name ? { FIRSTNAME: lead.name } : {}),
        FLYWHEEL_FORM: lead.form,
        FLYWHEEL_SOURCE: lead.source ?? "",
        FLYWHEEL_TAGS: lead.tags.join(","),
      },
    }
    if (this.listId) body.listIds = [Number(this.listId)]

    const res = await attempt(() =>
      fetch(BREVO_CONTACTS_URL, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(body),
      })
    )
    if (!res.ok) return err(res.error)

    const response = res.value
    // 201 = created (returns { id }); 204 = updated existing contact.
    if (response.status === 204) return ok({ id: `brevo_${lead.email}` })
    if (response.ok) {
      const json = (await response.json().catch(() => ({}))) as { id?: number }
      return ok({ id: json.id ? `brevo_${json.id}` : `brevo_${lead.email}` })
    }

    const detail = await response.text().catch(() => "")
    return err(`Brevo responded ${response.status}: ${detail.slice(0, 200)}`)
  }
}
