/**
 * Flywheel OS — Offers (CONVERT + EXPAND stages)
 * ------------------------------------------------------------------
 * "Every product is connected to related offers." An offer is anything
 * a lead can say yes to — a book, a tee, a bundle, a membership. The
 * `related` edges turn the catalog into a graph so the OS can always
 * answer "what's the next best offer?" without bespoke cross-sell code.
 */

import { z } from "zod"

export const OFFER_KINDS = ["product", "bundle", "membership", "donation", "service"] as const

/** How one offer relates to another — drives cross-sell / upsell logic. */
export const OFFER_RELATIONS = ["upsell", "cross_sell", "bundle_of", "next_step"] as const

export const offerEdgeSchema = z.object({
  to: z.string().min(1),
  relation: z.enum(OFFER_RELATIONS),
})

export const offerSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(OFFER_KINDS),
  priceCents: z.number().int().nonnegative(),
  /** Where a "buy" click goes. May be a Shopify/Stripe URL later. */
  url: z.string().default("#"),
  status: z.enum(["live", "preorder", "coming_soon", "sold_out"]).default("coming_soon"),
  /** Related offers — the edges that make the catalog a graph. */
  related: z.array(offerEdgeSchema).default([]),
})

export type Offer = z.infer<typeof offerSchema>
export type OfferInput = z.input<typeof offerSchema>
export type OfferRelation = (typeof OFFER_RELATIONS)[number]
