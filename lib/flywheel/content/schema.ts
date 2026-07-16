/**
 * Flywheel OS — Content (ATTRACT stage)
 * ------------------------------------------------------------------
 * "Every piece of content generates traffic." Content records describe
 * traffic-generating assets (journal entries, videos, lead magnets) and,
 * critically, the *capture form* and *offer* each one routes to — so no
 * asset is a dead end. The site's MDX journal is ingested into this
 * shape (see config), meaning editorial and marketing share one graph.
 */

import { z } from "zod"

export const CONTENT_KINDS = ["article", "video", "lead_magnet", "landing", "social"] as const

export const contentSchema = z.object({
  slug: z.string().min(1),
  brandId: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(CONTENT_KINDS),
  /** Canonical path on the site, e.g. "/journal/the-call". */
  path: z.string().startsWith("/"),
  /** Topics/keywords this asset ranks or is discovered for. */
  topics: z.array(z.string()).default([]),
  /** Which capture form this content routes visitors into. */
  captureSlug: z.string().min(1),
  /** The offer this content is connected to (may be undefined for top-funnel). */
  offerSlug: z.string().optional(),
  publishedAt: z.coerce.date().optional(),
})

export type Content = z.infer<typeof contentSchema>
export type ContentInput = z.input<typeof contentSchema>
