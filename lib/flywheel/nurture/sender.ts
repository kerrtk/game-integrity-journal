/**
 * Flywheel OS — Message Sender
 * ------------------------------------------------------------------
 * The seam through which a nurture step actually reaches a lead. The
 * engine builds a channel-agnostic `OutboundMessage`; a `MessageSender`
 * delivers it. Swapping ESPs (or adding SMS) is a new sender, never a
 * change to the engine.
 *
 * The default `consoleSender` logs instead of sending, so nurture runs
 * with zero configuration; `BrevoSender` (brevo-sender.ts) is the
 * production path, activated by env in os.ts.
 */

import type { Result } from "../core/result"
import { attempt } from "../core/result"

export type MessageChannel = "email" | "sms"

export interface OutboundMessage {
  channel: MessageChannel
  /** Email address or phone number. */
  to: string
  subject: string
  /** Plain-text body. */
  text: string
  /** Optional HTML body (email only). */
  html?: string
  /** Segmentation tags carried from the lead. */
  tags?: string[]
}

export interface MessageSender {
  readonly slug: string
  /** Whether this sender can deliver the given channel. */
  supports(channel: MessageChannel): boolean
  send(message: OutboundMessage): Promise<Result<{ id: string }>>
}

/** Minimal HTML escaping for building email bodies from plain text. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Logs the message. Safe default so nurture never hard-fails in dev. */
export const consoleSender: MessageSender = {
  slug: "console",
  supports: () => true,
  async send(message) {
    // eslint-disable-next-line no-console
    console.log(
      `[flywheel] send ${message.channel} → ${message.to}: "${message.subject}"`
    )
    return attempt(() => ({ id: `console_send_${Date.now()}` }))
  },
}
