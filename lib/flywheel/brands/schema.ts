/**
 * Flywheel OS — Brand
 * ------------------------------------------------------------------
 * A brand is a tenant of the OS. Each brand owns its own content,
 * offers, sequences, processes, and automations, but shares the same
 * engine. Adding a brand is one `registerBrand()` call — this is how
 * the system "adds new brands without restructuring".
 */

import { z } from "zod"

export const brandSchema = z.object({
  slug: z.string().min(1),
  brandId: z.literal("*").or(z.string().min(1)),
  name: z.string().min(1),
  domain: z.string().min(1),
  tagline: z.string().min(1),
  /** Primary brand color (hex) for the OS dashboard swatches. */
  accent: z.string().regex(/^#([0-9a-f]{6})$/i),
  /** The core promise / mission, shown at the top of the flywheel. */
  mission: z.string().min(1),
  /** Default lead-capture provider slug for this brand. */
  defaultCaptureProvider: z.string().default("console"),
})

export type Brand = z.infer<typeof brandSchema>
export type BrandInput = z.input<typeof brandSchema>
