import type { CaptureForm } from "@/lib/flywheel/capture/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * Every visitor entry point on the site is one of these forms. Each one
 * declares the nurture sequence a new lead joins, so capture is never a
 * dead end — the follow-up is wired in at the point of capture.
 */
export const captureForms: CaptureForm[] = [
  {
    slug: "newsroom-signup",
    brandId: GIJ_BRAND_ID,
    name: "Newsroom Signup (footer + inline)",
    incentive: "Get every case file the moment it publishes.",
    enrollSequence: "welcome-newsroom",
    provider: "console",
    tags: ["newsroom", "subscriber"],
  },
  {
    slug: "book-waitlist",
    brandId: GIJ_BRAND_ID,
    name: "Unwhistled Launch Waitlist",
    incentive: "Be first to pre-order Unwhistled and get a launch-day discount.",
    enrollSequence: "book-launch",
    provider: "console",
    tags: ["newsroom", "book-waitlist", "buyer-intent"],
  },
]
