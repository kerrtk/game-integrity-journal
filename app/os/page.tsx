import type { Metadata } from "next"

import { getOS } from "@/config/flywheel"
import { seedDemoEvents } from "@/lib/flywheel/analytics/seed"
import { snapshot } from "@/lib/flywheel/analytics/kpis"
import { nextBestOffer } from "@/lib/flywheel/offers/graph"
import {
  CAPABILITIES,
  CAPABILITY_META,
  FLYWHEEL_STAGES,
  STAGE_META,
  type FlywheelStage,
} from "@/lib/flywheel/core/types"

export const metadata: Metadata = {
  title: "Flywheel OS",
  description:
    "The Business Flywheel Operating System — every stage of attract → capture → nurture → convert → expand, wired together and measured.",
  robots: { index: false, follow: false },
}

const BRAND_ID = "game-integrity-journal"

const money = (cents: number) =>
  `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

export default async function FlywheelOSPage() {
  const os = getOS()
  await seedDemoEvents(os, BRAND_ID)

  const view = os.brandView(BRAND_ID)
  const brand = view.brand
  const snap = snapshot(os.events.all(), BRAND_ID)
  const stageEvents = new Map(snap.byStage.map((s) => [s.stage, s.events]))
  const recommended = nextBestOffer(os.offers, BRAND_ID, "unwhistled-book")
  const recent = os.events.recent(12)

  const moduleCounts: { label: string; value: number; href?: string }[] = [
    { label: "Content assets", value: view.content.length },
    { label: "Capture forms", value: view.captureForms.length },
    { label: "Nurture sequences", value: view.sequences.length },
    { label: "Offers", value: view.offers.length },
    { label: "Documented processes", value: view.processes.length },
    { label: "AI automations", value: view.automations.length },
  ]

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-16">
      {/* Masthead */}
      <header className="border-b border-hair pb-8">
        <span className="mono text-xs text-crimson">Business Flywheel Operating System</span>
        <h1 className="mt-3 text-[clamp(30px,5vw,52px)] leading-[1.02] text-bone">
          One loop. Every action measured.
        </h1>
        <p className="mt-4 max-w-[62ch] text-lg text-steel">
          {brand?.mission} Content feeds capture, capture feeds nurture, nurture feeds
          conversion, conversion feeds expansion — and expansion feeds the next visitor.
          New brands, products, and automations are registered as config, never as refactors.
        </p>
        <div className="mono mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-steel">
          <span>brand: <span className="text-bone">{brand?.slug}</span></span>
          <span>events tracked: <span className="text-bone">{snap.totalEvents}</span></span>
          <span>modules: <span className="text-bone">7</span></span>
        </div>
      </header>

      {/* Live KPI band */}
      <section className="mt-10 grid gap-px overflow-hidden rounded border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Leads captured", value: snap.leads.toString() },
          { label: "Orders placed", value: snap.orders.toString() },
          { label: "Lead → order", value: pct(snap.conversionRate) },
          { label: "Revenue (sample)", value: money(snap.revenueCents) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-graphite p-5">
            <div className="mono text-[11px] uppercase tracking-wide text-steel">{kpi.label}</div>
            <div className="mt-2 font-cinema text-3xl text-bone">{kpi.value}</div>
          </div>
        ))}
      </section>

      {/* The flywheel — five stages in loop order */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">The Flywheel</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-5">
          {FLYWHEEL_STAGES.map((stage: FlywheelStage, i) => {
            const meta = STAGE_META[stage]
            return (
              <div
                key={stage}
                className="relative flex flex-col border border-hair bg-charcoal p-5"
              >
                <span className="mono text-[11px] text-crimson">0{i + 1}</span>
                <h3 className="mt-1 font-cinema text-2xl text-bone">{meta.label}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-snug text-steel">
                  {meta.principle}
                </p>
                <div className="mono mt-4 text-2xl text-gold">
                  {(stageEvents.get(stage) ?? 0).toLocaleString()}
                  <span className="ml-1 text-[10px] uppercase text-steel">events</span>
                </div>
                {i < FLYWHEEL_STAGES.length - 1 && (
                  <span
                    aria-hidden
                    className="mono absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-crimson md:block"
                  >
                    →
                  </span>
                )}
              </div>
            )
          })}
        </div>
        <p className="mono mt-4 text-center text-[11px] text-steel">
          expand → attract · advocates and cross-sells feed the top of the loop
        </p>
      </section>

      {/* Cross-cutting capabilities */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">Wrapped by three capabilities</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((cap) => (
            <div key={cap} className="border border-hair bg-graphite p-5">
              <h3 className="font-cinema text-xl text-bone">{CAPABILITY_META[cap].label}</h3>
              <p className="mt-2 text-[13.5px] text-steel">{CAPABILITY_META[cap].principle}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Module inventory */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">Registered modules</h2>
        <div className="mt-5 grid gap-px overflow-hidden rounded border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-3">
          {moduleCounts.map((m) => (
            <div key={m.label} className="flex items-baseline justify-between bg-graphite p-5">
              <span className="text-[14px] text-steel">{m.label}</span>
              <span className="font-cinema text-2xl text-bone">{m.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Offer graph — related offers make the catalog a graph */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">Offer graph</h2>
        <p className="mt-2 text-sm text-steel">
          Every product declares its related offers, so the OS always knows the next best offer.
          {recommended && (
            <>
              {" "}After <span className="text-bone">Unwhistled</span>, it recommends{" "}
              <span className="text-crimson">{recommended.name}</span>.
            </>
          )}
        </p>
        <div className="mt-5 space-y-2">
          {view.offers.map((offer) => (
            <div key={offer.slug} className="border border-hair bg-charcoal p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] text-bone">{offer.name}</span>
                <span className="mono text-xs text-steel">
                  {money(offer.priceCents)} · {offer.status}
                </span>
              </div>
              {offer.related.length > 0 && (
                <div className="mono mt-2 flex flex-wrap gap-2 text-[11px] text-steel">
                  {offer.related.map((edge) => (
                    <span key={edge.to} className="rounded border border-hair px-2 py-0.5">
                      {edge.relation.replace("_", " ")} → {edge.to}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Automations */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">AI automations</h2>
        <div className="mt-5 space-y-2">
          {view.automations.map((a) => (
            <div key={a.slug} className="border border-hair bg-charcoal p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[15px] text-bone">{a.name}</span>
                <span className="mono text-[11px] text-electric">
                  {a.runner} ·{" "}
                  {a.trigger.type === "event" ? a.trigger.event : `cron ${a.trigger.cron}`}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-steel">Replaces: {a.replaces}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live activity feed */}
      <section className="mt-14">
        <h2 className="mono text-xs uppercase tracking-widest text-gold">Recent activity</h2>
        <div className="mono mt-5 space-y-1 rounded border border-hair bg-ink-2 p-4 text-[12px]">
          {recent.length === 0 && <p className="text-steel">No events yet.</p>}
          {recent.map((e, i) => (
            <div key={i} className="flex items-center gap-3 text-steel">
              <span className="text-crimson">{e.stage}</span>
              <span className="text-bone">{e.name}</span>
              {e.entity && <span className="text-steel">· {e.entity}</span>}
              {e.valueCents ? <span className="text-gold">· {money(e.valueCents)}</span> : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
