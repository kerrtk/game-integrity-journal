/**
 * Flywheel OS — Registry
 * ------------------------------------------------------------------
 * A generic, brand-aware registry. Every module (content, offers,
 * nurture sequences, processes, automations …) is a `Registry` of
 * typed, validated records.
 *
 * The registry is the reason the OS is "modular without restructuring":
 * adding a new brand, product, or automation is a single `.register()`
 * call driven by config — no module code changes.
 */

import type { z } from "zod"
import type { BrandId, Registrable, Slug } from "./types"

export type RegistryKey = `${BrandId}:${Slug}`

export function keyOf(brandId: BrandId, slug: Slug): RegistryKey {
  return `${brandId}:${slug}`
}

/**
 * The read surface of a registry. Consumers (offer graph, capture
 * pipeline, nurture engine) depend on this, not the concrete class, so
 * they're insulated from the write-side input generic `TIn`.
 */
export interface ReadonlyRegistry<TOut extends Registrable> {
  get(brandId: BrandId, slug: Slug): TOut | undefined
  has(brandId: BrandId, slug: Slug): boolean
  all(brandId?: BrandId): TOut[]
  where(predicate: (record: TOut) => boolean, brandId?: BrandId): TOut[]
}

/**
 * `TOut` is the fully-resolved record (defaults applied); `TIn` is the
 * shape config authors write (defaulted fields optional). Keeping them
 * distinct is what lets a new brand/offer/automation be declared with
 * minimal config while the registry always stores complete records.
 */
export class Registry<TOut extends Registrable, TIn = TOut>
  implements ReadonlyRegistry<TOut>
{
  private readonly items = new Map<RegistryKey, TOut>()

  constructor(
    /** Label used in error messages, e.g. "offer" or "process". */
    readonly kind: string,
    /** Zod schema every record is validated against on registration. */
    private readonly schema: z.ZodType<TOut, z.ZodTypeDef, TIn>
  ) {}

  /** Validate and add a record. Throws on duplicate slug or bad shape. */
  register(input: TIn): TOut {
    const parsed = this.schema.safeParse(input)
    if (!parsed.success) {
      const slug = (input as { slug?: string } | null)?.slug ?? "?"
      throw new Error(`[flywheel] invalid ${this.kind} "${slug}": ${parsed.error.message}`)
    }
    const record = parsed.data
    const key = keyOf(record.brandId, record.slug)
    if (this.items.has(key)) {
      throw new Error(`[flywheel] duplicate ${this.kind} registered: ${key}`)
    }
    this.items.set(key, record)
    return record
  }

  /** Register many at once; returns the registry for chaining. */
  registerAll(inputs: readonly TIn[]): this {
    for (const input of inputs) this.register(input)
    return this
  }

  get(brandId: BrandId, slug: Slug): TOut | undefined {
    return this.items.get(keyOf(brandId, slug)) ?? this.items.get(keyOf("*", slug))
  }

  has(brandId: BrandId, slug: Slug): boolean {
    return this.get(brandId, slug) !== undefined
  }

  /** All records, optionally scoped to one brand (plus shared `*`). */
  all(brandId?: BrandId): TOut[] {
    const records = [...this.items.values()]
    if (!brandId) return records
    return records.filter((r) => r.brandId === brandId || r.brandId === "*")
  }

  /** Records matching a predicate, within an optional brand scope. */
  where(predicate: (record: TOut) => boolean, brandId?: BrandId): TOut[] {
    return this.all(brandId).filter(predicate)
  }

  get size(): number {
    return this.items.size
  }
}
