import { z } from "zod"

export const journalEntryFrontmatterSchema = z.object({
  title: z.string().min(1),
  dek: z.string().min(1),
  slug: z.string().min(1),
  fileNo: z.string().min(1),
  category: z.string().min(1),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  featured: z.boolean().default(false),
  ctaText: z.string().min(1),
})

export type JournalEntryFrontmatter = z.infer<typeof journalEntryFrontmatterSchema>

export type JournalEntry = JournalEntryFrontmatter & {
  content: string
}
