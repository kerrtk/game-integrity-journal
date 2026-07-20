import type { MetadataRoute } from "next"

import { getAllJournalEntries } from "@/lib/content/journal"
import { SITE_URL } from "@/lib/json-ld"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/journal",
    "/unwhistled",
    "/watch",
    "/membership",
    "/support",
    "/shop",
    "/about",
    "/standards",
    "/tips",
    "/contact",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }))

  const journalRoutes = getAllJournalEntries().map((e) => ({
    url: `${SITE_URL}/journal/${e.slug}`,
    lastModified: e.updatedAt ?? e.publishedAt,
  }))

  return [...staticRoutes, ...journalRoutes]
}
