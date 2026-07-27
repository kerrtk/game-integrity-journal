/**
 * Hosted Stripe Payment Links for Membership + Support.
 *
 * These are PUBLIC checkout URLs (like the Amazon link) — no secret keys
 * live here, so it's safe in the repo. Fill a slot with its Stripe Payment
 * Link when you create it; an empty string means "not live yet" and the UI
 * shows a Coming-soon state instead of a dead button.
 *
 * Create in Stripe → Payment Links:
 *   membership.supporter.monthly  → subscription, $6/mo   (price must match the site)
 *   membership.supporter.annual   → subscription, $60/yr
 *   membership.member.monthly     → subscription, $12/mo
 *   membership.member.annual      → subscription, $120/yr
 *   donate                        → one-time, "customer chooses amount"
 */
export const PAYMENTS: {
  membership: Record<"supporter" | "member", { monthly: string; annual: string }>
  donate: string
} = {
  membership: {
    supporter: { monthly: "", annual: "" },
    member: { monthly: "", annual: "" },
  },
  donate: "",
}

/** True when a slot holds a real checkout URL. */
export function isLive(url: string | undefined): url is string {
  return typeof url === "string" && url.startsWith("http")
}

export const membershipCheckoutLive =
  isLive(PAYMENTS.membership.supporter.monthly) ||
  isLive(PAYMENTS.membership.supporter.annual) ||
  isLive(PAYMENTS.membership.member.monthly) ||
  isLive(PAYMENTS.membership.member.annual)
