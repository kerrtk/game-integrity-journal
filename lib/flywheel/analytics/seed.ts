/**
 * Flywheel OS — Demo Seed
 * ------------------------------------------------------------------
 * Fires a representative burst of events through the real event bus so
 * the dashboard shows a live snapshot before production traffic exists.
 * Idempotent per process and clearly sample data — remove or gate behind
 * an env flag once real analytics flow in.
 */

import type { FlywheelOS } from "../os"

let seeded = false

export async function seedDemoEvents(os: FlywheelOS, brandId: string): Promise<void> {
  if (seeded || os.events.all().length > 0) return
  seeded = true

  const content = os.content.all(brandId)
  const offers = os.offers.all(brandId)
  const visitors = 120

  for (let i = 0; i < visitors; i++) {
    const asset = content[i % content.length]
    await os.bus.track({
      name: "content.viewed",
      stage: "attract",
      brandId,
      entity: asset.slug,
      subjectId: `visitor_${i}`,
      props: { path: asset.path, sample: true },
    })
  }

  // ~18% of visitors convert to leads.
  for (let i = 0; i < 22; i++) {
    await os.bus.track({
      name: "lead.identified",
      stage: "capture",
      brandId,
      entity: "newsroom-signup",
      subjectId: `lead_${i}`,
      props: { sample: true },
    })
    await os.bus.track({
      name: "nurture.enrolled",
      stage: "nurture",
      brandId,
      entity: "welcome-newsroom",
      subjectId: `lead_${i}`,
      props: { sample: true },
    })
  }

  // A handful convert to orders.
  const book = offers.find((o) => o.slug === "unwhistled-book")
  for (let i = 0; i < 6; i++) {
    await os.bus.track({
      name: "offer.viewed",
      stage: "convert",
      brandId,
      entity: book?.slug,
      subjectId: `lead_${i}`,
      props: { sample: true },
    })
    await os.bus.track({
      name: "order.placed",
      stage: "convert",
      brandId,
      entity: book?.slug,
      subjectId: `lead_${i}`,
      valueCents: book?.priceCents ?? 2499,
      props: { sample: true },
    })
  }

  // Cross-sell expands two of them.
  for (let i = 0; i < 2; i++) {
    await os.bus.track({
      name: "offer.cross_sold",
      stage: "expand",
      brandId,
      entity: "case-file-tee",
      subjectId: `lead_${i}`,
      valueCents: 3200,
      props: { sample: true },
    })
  }
}
