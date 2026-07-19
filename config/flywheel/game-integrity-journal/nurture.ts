import type { NurtureSequence } from "@/lib/flywheel/nurture/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * Drip sequences. Note how nurture steps carry `offerSlug` — this is the
 * NURTURE → CONVERT handoff: the follow-up itself pitches the connected
 * offer, so no lead sits warm without a next step.
 */
export const sequences: NurtureSequence[] = [
  {
    slug: "welcome-newsroom",
    brandId: GIJ_BRAND_ID,
    name: "Newsroom Welcome",
    goal: "Turn a new subscriber into a reader who trusts the desk and buys the book.",
    steps: [
      {
        delayHours: 0,
        channel: "email",
        subject: "Welcome to the Integrity Desk",
        body: "What we investigate, why it matters, and the case file that started it all.",
      },
      {
        delayHours: 48,
        channel: "email",
        subject: "The call that only got fixed after the game",
        body: "Our most-read investigation — read it, then see what we're publishing next.",
      },
      {
        delayHours: 120,
        channel: "email",
        subject: "The full story is a book",
        body: "Everything the desk uncovered, in one place.",
        offerSlug: "unwhistled-book",
      },
    ],
  },
  {
    slug: "book-launch",
    brandId: GIJ_BRAND_ID,
    name: "Unwhistled Launch",
    goal: "Convert waitlist intent into a pre-order, then a bundle.",
    steps: [
      {
        delayHours: 0,
        channel: "email",
        subject: "You're on the Unwhistled list",
        body: "Here's your launch-day discount code and the release date.",
        offerSlug: "unwhistled-book",
      },
      {
        delayHours: 72,
        channel: "email",
        subject: "Read the first chapter free",
        body: "A taste of the case file — then lock in your copy.",
        offerSlug: "unwhistled-book",
      },
      {
        delayHours: 168,
        channel: "email",
        subject: "Get the book AND the tee for less",
        body: "The full case file, cover to shelf — best value at launch.",
        offerSlug: "book-tee-bundle",
      },
    ],
  },
]
