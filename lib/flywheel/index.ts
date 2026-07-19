/**
 * Flywheel OS — Public API
 * ------------------------------------------------------------------
 * Import surface for the rest of the app. Pages/routes should import
 * from here (or from `@/config/flywheel` for `getOS()`), not from deep
 * module paths.
 */

export * from "./core/types"
export * from "./core/result"
export { Registry } from "./core/registry"

export type { FlywheelEvent, FlywheelEventName } from "./events/schema"
export { FLYWHEEL_EVENTS } from "./events/schema"

export type { Brand } from "./brands/schema"
export type { Content } from "./content/schema"
export type { Offer, OfferRelation } from "./offers/schema"
export { nextBestOffer, relatedOffers } from "./offers/graph"
export type { CaptureForm, Lead, LeadInput } from "./capture/schema"
export type { NurtureSequence, NurtureStep } from "./nurture/schema"
export type { Process } from "./processes/schema"
export type { Automation } from "./automations/schema"

export { snapshot } from "./analytics/kpis"
export type { FlywheelSnapshot, StageMetric } from "./analytics/kpis"

export { FlywheelOS } from "./os"
export type { BrandConfig } from "./os"
