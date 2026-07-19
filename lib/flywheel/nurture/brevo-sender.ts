/**
 * Flywheel OS — Brevo Message Sender
 * ------------------------------------------------------------------
 * Production sender that delivers nurture steps through Brevo's
 * transactional APIs (email + SMS). Server-side, API-key driven, so it
 * works in the deployed app. Registered only when BREVO_API_KEY is set
 * (see os.ts); otherwise the engine uses the console sender.
 *
 * Env:
 *   BREVO_API_KEY       (required to activate)
 *   BREVO_SENDER_EMAIL  (required for email) e.g. desk@gameintegrityjournal.com
 *   BREVO_SENDER_NAME   (optional) defaults to "Game Integrity Journal"
 *   BREVO_SMS_SENDER    (optional) alphanumeric sender id for SMS
 */

import { attempt, err, ok, type Result } from "../core/result"
import { escapeHtml, type MessageChannel, type MessageSender, type OutboundMessage } from "./sender"

const EMAIL_URL = "https://api.brevo.com/v3/smtp/email"
const SMS_URL = "https://api.brevo.com/v3/transactionalSMS/sms"

export class BrevoSender implements MessageSender {
  readonly slug = "brevo"

  constructor(
    private readonly apiKey = process.env.BREVO_API_KEY ?? "",
    private readonly senderEmail = process.env.BREVO_SENDER_EMAIL ?? "",
    private readonly senderName = process.env.BREVO_SENDER_NAME ?? "Game Integrity Journal",
    private readonly smsSender = process.env.BREVO_SMS_SENDER ?? ""
  ) {}

  supports(channel: MessageChannel): boolean {
    if (channel === "email") return Boolean(this.senderEmail)
    if (channel === "sms") return Boolean(this.smsSender)
    return false
  }

  async send(message: OutboundMessage): Promise<Result<{ id: string }>> {
    if (!this.apiKey) return err("BREVO_API_KEY is not configured.")
    return message.channel === "sms" ? this.sendSms(message) : this.sendEmail(message)
  }

  private async sendEmail(message: OutboundMessage): Promise<Result<{ id: string }>> {
    if (!this.senderEmail) return err("BREVO_SENDER_EMAIL is not configured.")
    return this.post(EMAIL_URL, {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html ?? `<p>${escapeHtml(message.text)}</p>`,
      textContent: message.text,
      tags: message.tags,
    })
  }

  private async sendSms(message: OutboundMessage): Promise<Result<{ id: string }>> {
    if (!this.smsSender) return err("BREVO_SMS_SENDER is not configured.")
    return this.post(SMS_URL, {
      sender: this.smsSender,
      recipient: message.to,
      content: message.text,
      type: "transactional",
    })
  }

  private async post(
    url: string,
    body: Record<string, unknown>
  ): Promise<Result<{ id: string }>> {
    const res = await attempt(() =>
      fetch(url, {
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
    if (response.ok) {
      const json = (await response.json().catch(() => ({}))) as {
        messageId?: string
        reference?: string
      }
      return ok({ id: json.messageId ?? json.reference ?? `brevo_send_${Date.now()}` })
    }

    const detail = await response.text().catch(() => "")
    return err(`Brevo send responded ${response.status}: ${detail.slice(0, 200)}`)
  }
}
