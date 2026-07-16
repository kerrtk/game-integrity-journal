import type { Brand } from "@/lib/flywheel/brands/schema"

export const GIJ_BRAND_ID = "game-integrity-journal"

export const brand: Brand = {
  slug: GIJ_BRAND_ID,
  brandId: GIJ_BRAND_ID,
  name: "Game Integrity Journal",
  domain: "gameintegrityjournal.com",
  tagline: "Every game deserves fair officiating.",
  accent: "#d31f3c",
  mission:
    "The world's first platform dedicated to accountability, transparency, education, and integrity in sports officiating.",
  defaultCaptureProvider: "brevo",
}
