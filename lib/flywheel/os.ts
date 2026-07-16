/**
 * Flywheel OS — Assembly
 * ------------------------------------------------------------------
 * Wires the modules into one operating system and exposes a small
 * façade. This is the *only* place the pieces are connected; brands and
 * their content/offers/sequences are loaded from `config/flywheel`, so
 * this file never changes when a brand is added.
 *
 * A single shared instance (`getOS()`) is memoized per server process.
 */

import { Registry } from "./core/registry"
import type { BrandId } from "./core/types"

import { brandSchema, type Brand, type BrandInput } from "./brands/schema"
import { contentSchema, type Content, type ContentInput } from "./content/schema"
import { offerSchema, type Offer, type OfferInput } from "./offers/schema"
import { captureFormSchema, type CaptureForm, type CaptureFormInput } from "./capture/schema"
import {
  nurtureSequenceSchema,
  type NurtureSequence,
  type NurtureSequenceInput,
} from "./nurture/schema"
import { processSchema, type Process, type ProcessInput } from "./processes/schema"
import { automationSchema, type Automation, type AutomationInput } from "./automations/schema"

import { EventBus } from "./events/bus"
import { consoleSink, MemorySink } from "./events/sinks"
import { MemoryProvider, ProviderRegistry, consoleProvider } from "./capture/providers"
import { BrevoProvider } from "./capture/brevo"
import { NurtureEngine } from "./nurture/engine"
import { CapturePipeline } from "./capture/pipeline"

export interface BrandConfig {
  brand: BrandInput
  content?: ContentInput[]
  offers?: OfferInput[]
  captureForms?: CaptureFormInput[]
  sequences?: NurtureSequenceInput[]
  processes?: ProcessInput[]
  automations?: AutomationInput[]
}

export class FlywheelOS {
  readonly brands = new Registry<Brand, BrandInput>("brand", brandSchema)
  readonly content = new Registry<Content, ContentInput>("content", contentSchema)
  readonly offers = new Registry<Offer, OfferInput>("offer", offerSchema)
  readonly captureForms = new Registry<CaptureForm, CaptureFormInput>(
    "captureForm",
    captureFormSchema
  )
  readonly sequences = new Registry<NurtureSequence, NurtureSequenceInput>(
    "sequence",
    nurtureSequenceSchema
  )
  readonly processes = new Registry<Process, ProcessInput>("process", processSchema)
  readonly automations = new Registry<Automation, AutomationInput>(
    "automation",
    automationSchema
  )

  readonly bus = new EventBus()
  readonly events = new MemorySink()
  readonly leads = new MemoryProvider()
  readonly providers = new ProviderRegistry()
  readonly nurture: NurtureEngine
  readonly capture: CapturePipeline

  constructor() {
    this.bus.use(consoleSink).use(this.events)
    this.providers.use(consoleProvider).use(this.leads)
    // Activate the real ESP only when its key is configured. Forms set to
    // "brevo" fall back to the console provider until then (see pipeline),
    // so signups never break on a preview deploy without secrets.
    if (process.env.BREVO_API_KEY) this.providers.use(new BrevoProvider())
    this.nurture = new NurtureEngine(this.sequences, this.bus)
    this.capture = new CapturePipeline(this.captureForms, this.providers, this.nurture, this.bus)
  }

  /** Register a brand and all of its modules. Pure config in, no code. */
  registerBrand(config: BrandConfig): this {
    this.brands.register(config.brand)
    this.content.registerAll(config.content ?? [])
    this.offers.registerAll(config.offers ?? [])
    this.captureForms.registerAll(config.captureForms ?? [])
    this.sequences.registerAll(config.sequences ?? [])
    this.processes.registerAll(config.processes ?? [])
    this.automations.registerAll(config.automations ?? [])
    return this
  }

  /** Everything owned by one brand — used by the dashboard. */
  brandView(brandId: BrandId) {
    return {
      brand: this.brands.all().find((b) => b.slug === brandId),
      content: this.content.all(brandId),
      offers: this.offers.all(brandId),
      captureForms: this.captureForms.all(brandId),
      sequences: this.sequences.all(brandId),
      processes: this.processes.all(brandId),
      automations: this.automations.all(brandId),
    }
  }
}
