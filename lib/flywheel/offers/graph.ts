/**
 * Flywheel OS — Offer Graph
 * ------------------------------------------------------------------
 * Read helpers over the offer registry. Because relationships are data,
 * "what should we recommend next?" is a graph walk, not hand-written
 * cross-sell rules — so a new product wires itself into recommendations
 * the moment it declares its `related` edges.
 */

import type { ReadonlyRegistry } from "../core/registry"
import type { BrandId } from "../core/types"
import type { Offer, OfferRelation } from "./schema"

export interface Recommendation {
  offer: Offer
  relation: OfferRelation
}

/** Offers directly related to a given offer, resolved to full records. */
export function relatedOffers(
  offers: ReadonlyRegistry<Offer>,
  brandId: BrandId,
  slug: string,
  relations?: OfferRelation[]
): Recommendation[] {
  const source = offers.get(brandId, slug)
  if (!source) return []
  return source.related
    .filter((edge) => !relations || relations.includes(edge.relation))
    .map((edge) => {
      const offer = offers.get(brandId, edge.to)
      return offer ? { offer, relation: edge.relation } : null
    })
    .filter((r): r is Recommendation => r !== null)
}

/**
 * The single "next best offer" for a lead who just engaged with `slug`.
 * Prefers upsell > next_step > cross_sell > bundle_of, then the
 * highest-value live offer as a fallback so there's always an answer.
 */
export function nextBestOffer(
  offers: ReadonlyRegistry<Offer>,
  brandId: BrandId,
  slug?: string
): Offer | undefined {
  const priority: OfferRelation[] = ["upsell", "next_step", "cross_sell", "bundle_of"]

  if (slug) {
    for (const relation of priority) {
      const [match] = relatedOffers(offers, brandId, slug, [relation])
      if (match && match.offer.status !== "sold_out") return match.offer
    }
  }

  return offers
    .where((o) => o.status === "live" || o.status === "preorder", brandId)
    .filter((o) => o.slug !== slug)
    .sort((a, b) => b.priceCents - a.priceCents)[0]
}
