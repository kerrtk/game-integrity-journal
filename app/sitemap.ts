import type { MetadataRoute } from "next"

import { getAllJournalEntries } from "@/lib/content/journal"
import { getAllDockets } from "@/lib/docket"
import { SITE_URL } from "@/lib/json-ld"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/journal",
    "/docket",
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

  const docketRoutes = getAllDockets()
    .filter((d) => !d.sample)
    .map((d) => ({
      url: `${SITE_URL}/docket/${d.date}`,
      lastModified: new Date(d.generatedAt),
    }))

  return [...staticRoutes, ...journalRoutes, ...docketRoutes]
}
