import type { Offer } from "@/lib/flywheel/offers/schema"
import { GIJ_BRAND_ID } from "./brand"

/**
 * The GIJ offer graph. `Unwhistled` is the anchor; the tee and bundle
 * hang off it via cross-sell / bundle edges, and the membership is the
 * next step after a purchase. The OS reads these edges to recommend the
 * next best offer anywhere on the site.
 */
export const offers: Offer[] = [
  {
    slug: "unwhistled-book",
    brandId: GIJ_BRAND_ID,
    name: "Unwhistled: How the WNBA Failed Caitlin Clark",
    kind: "product",
    priceCents: 2499,
    url: "/shop",
    status: "preorder",
    related: [
      { to: "case-file-tee", relation: "cross_sell" },
      { to: "book-tee-bundle", relation: "bundle_of" },
      { to: "integrity-membership", relation: "next_step" },
    ],
  },
  {
    slug: "case-file-tee",
    brandId: GIJ_BRAND_ID,
    name: "GIJ Case File Tee",
    kind: "product",
    priceCents: 3200,
    url: "/shop",
    status: "coming_soon",
    related: [{ to: "book-tee-bundle", relation: "bundle_of" }],
  },
  {
    slug: "book-tee-bundle",
    brandId: GIJ_BRAND_ID,
    name: "Book + Tee Bundle",
    kind: "bundle",
    priceCents: 4999,
    url: "/shop",
    status: "coming_soon",
    related: [{ to: "integrity-membership", relation: "next_step" }],
  },
  {
    slug: "integrity-membership",
    brandId: GIJ_BRAND_ID,
    name: "Integrity Desk Membership",
    kind: "membership",
    priceCents: 900,
    url: "/shop",
    status: "coming_soon",
    related: [{ to: "unwhistled-book", relation: "cross_sell" }],
  },
]
