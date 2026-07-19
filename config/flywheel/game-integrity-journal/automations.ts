import type { AutomationInput } from "@/lib/flywheel/automations/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * AI + integration automations. Each binds a flywheel event (or a
 * schedule) to a runner. Runners map to real capabilities available to
 * this OS: `agent` = Claude, `zapier`/`mcp` = connected tools,
 * `function` = in-repo code. Adding an automation is one entry here.
 */
export const automations: AutomationInput[] = [
  {
    slug: "enroll-welcome-sequence",
    brandId: GIJ_BRAND_ID,
    name: "Auto-enroll new leads",
    replaces: "Manually adding subscribers to a drip campaign.",
    trigger: { type: "event", event: "lead.identified" },
    runner: "function",
    spec: "nurture.enroll(lead, form.enrollSequence)",
  },
  {
    slug: "distribute-new-content",
    brandId: GIJ_BRAND_ID,
    name: "Draft social cuts from a new case file",
    replaces: "Writing 3 platform-native social posts by hand for every article.",
    trigger: { type: "event", event: "content.viewed" },
    runner: "agent",
    spec: "Given the article body, draft one X thread, one IG caption, and one LinkedIn post in the GIJ voice. Return as JSON.",
    enabled: true,
  },
  {
    slug: "cross-sell-on-order",
    brandId: GIJ_BRAND_ID,
    name: "Attach next-best-offer to receipts",
    replaces: "Manually choosing an upsell for each order confirmation.",
    trigger: { type: "event", event: "order.placed" },
    runner: "function",
    spec: "offers.nextBestOffer(brandId, purchasedSlug) → inject into receipt email",
  },
  {
    slug: "weekly-flywheel-report",
    brandId: GIJ_BRAND_ID,
    name: "Weekly flywheel health report",
    replaces: "Hand-compiling a Monday KPI email from analytics.",
    trigger: { type: "schedule", cron: "0 13 * * 1" },
    runner: "agent",
    spec: "Summarize the week's flywheel snapshot (leads, conversion, revenue, top content) and flag the weakest stage with one recommendation.",
  },
]
