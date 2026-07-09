const SITE_URL = "https://gameintegrityjournal.com"

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Game Integrity Journal",
    url: SITE_URL,
    description: "Independent investigative journalism covering sports integrity.",
  }
}

export function articleJsonLd(article: {
  title: string
  dek: string
  slug: string
  publishedAt: Date
  updatedAt?: Date
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.dek,
    datePublished: article.publishedAt.toISOString(),
    dateModified: (article.updatedAt ?? article.publishedAt).toISOString(),
    author: { "@type": "Organization", name: "Game Integrity Journal" },
    publisher: { "@type": "Organization", name: "Game Integrity Journal" },
    mainEntityOfPage: `${SITE_URL}/journal/${article.slug}`,
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export { SITE_URL }
