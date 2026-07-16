/**
 * Flywheel OS — Core Types
 * ------------------------------------------------------------------
 * The spine of the Business Flywheel Operating System.
 *
 * A flywheel turns visitors into leads, leads into customers, and
 * customers into advocates who send new visitors — so the loop feeds
 * itself. Every module in this OS plugs into one of the five stages
 * below, and three cross-cutting capabilities (operate / automate /
 * measure) wrap around all of them.
 *
 * Nothing here is brand-specific. Brands, products, and automations
 * are registered as *data* (see `config/flywheel/*`), so the system
 * scales by adding config, never by restructuring code.
 */

/** The five stages of the flywheel loop, in turn order. */
export const FLYWHEEL_STAGES = [
  "attract", // content generates traffic
  "capture", // visitors become identified leads
  "nurture", // leads are warmed by automated sequences
  "convert", // leads buy a product / core offer
  "expand", // customers buy connected offers & refer new visitors
] as const

export type FlywheelStage = (typeof FLYWHEEL_STAGES)[number]

/** Human copy for each stage — used by the OS dashboard. */
export const STAGE_META: Record<
  FlywheelStage,
  { label: string; principle: string; verb: string }
> = {
  attract: {
    label: "Attract",
    principle: "Every piece of content generates traffic.",
    verb: "publishes",
  },
  capture: {
    label: "Capture",
    principle: "Every visitor enters a lead-capture system.",
    verb: "captures",
  },
  nurture: {
    label: "Nurture",
    principle: "Every lead is nurtured through automation.",
    verb: "nurtures",
  },
  convert: {
    label: "Convert",
    principle: "Every visitor is offered a product.",
    verb: "converts",
  },
  expand: {
    label: "Expand",
    principle: "Every product is connected to related offers.",
    verb: "expands",
  },
}

/** Cross-cutting capabilities that wrap the whole loop. */
export const CAPABILITIES = ["operate", "automate", "measure"] as const
export type Capability = (typeof CAPABILITIES)[number]

export const CAPABILITY_META: Record<Capability, { label: string; principle: string }> = {
  operate: {
    label: "Operate",
    principle: "Every business process is documented.",
  },
  automate: {
    label: "Automate",
    principle: "Every repetitive task is automated with AI.",
  },
  measure: {
    label: "Measure",
    principle: "Every action is measured through analytics.",
  },
}

/**
 * A slug is the stable, URL-safe identity of any registered entity.
 * Registries are keyed by `${brandId}:${slug}` so two brands can reuse
 * the same local slug without colliding.
 */
export type Slug = string
export type BrandId = string

/** Everything registered in the OS carries this envelope. */
export interface Registrable {
  /** Stable, URL-safe id — unique within a brand. */
  slug: Slug
  /** Owning brand. `"*"` means the entity is shared across all brands. */
  brandId: BrandId | "*"
  /** Human-readable name for dashboards. */
  name: string
}

export type MaybePromise<T> = T | Promise<T>
