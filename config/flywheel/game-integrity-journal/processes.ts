import type { ProcessInput } from "@/lib/flywheel/processes/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * Documented SOPs. Each one names the automation that can run it, so the
 * OPERATE capability is the on-ramp to AUTOMATE: document the process,
 * then point an automation at it.
 */
export const processes: ProcessInput[] = [
  {
    slug: "publish-case-file",
    brandId: GIJ_BRAND_ID,
    name: "Publish a Case File",
    area: "attract",
    trigger: "An investigation is fact-checked and ready.",
    owner: "Editorial",
    automationSlug: "distribute-new-content",
    steps: [
      { title: "Add MDX to content/journal", detail: "Frontmatter validated by Zod on build.", automated: false },
      { title: "Generate social cuts", detail: "AI drafts 3 platform-native posts from the piece.", automated: true },
      { title: "Notify newsroom list", detail: "Broadcast to subscribers via ESP.", automated: true },
    ],
  },
  {
    slug: "onboard-subscriber",
    brandId: GIJ_BRAND_ID,
    name: "Onboard a New Subscriber",
    area: "capture",
    trigger: "A visitor submits any capture form.",
    owner: "Growth",
    automationSlug: "enroll-welcome-sequence",
    steps: [
      { title: "Validate + dedupe lead", detail: "Capture pipeline validates and tags.", automated: true },
      { title: "Sync to ESP/CRM", detail: "Provider adapter persists the contact.", automated: true },
      { title: "Enroll in welcome drip", detail: "Nurture engine schedules step 1.", automated: true },
    ],
  },
  {
    slug: "fulfill-preorder",
    brandId: GIJ_BRAND_ID,
    name: "Fulfill a Book Pre-order",
    area: "convert",
    trigger: "An order.placed event for Unwhistled.",
    owner: "Operations",
    steps: [
      { title: "Confirm order + payment", detail: "Reconcile against payment provider.", automated: true },
      { title: "Send receipt + next-best-offer", detail: "Cross-sell the tee/bundle in the receipt.", automated: true },
      { title: "Queue fulfillment", detail: "Hand to print/ship partner at launch.", automated: false },
    ],
  },
]
