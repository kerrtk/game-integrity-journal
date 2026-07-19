# Business Flywheel Operating System

A modular, config-driven engine that connects everything the business
does into one self-reinforcing loop. It lives alongside the public
GameIntegrityJournal.com site and is designed so **new brands, products,
and automations are added as configuration — never as a restructuring of
the code.**

Dashboard: **`/os`** (noindex, internal).

---

## The one idea

> Every piece of content generates traffic → every visitor enters a lead
> capture system → every lead is nurtured through automation → every
> visitor is offered a product → every product is connected to related
> offers → and customers/advocates feed the next visitor.

Wrapped around that loop, three capabilities apply to _every_ stage:

- **Operate** — every business process is documented (SOPs).
- **Automate** — every repetitive task is automated with AI.
- **Measure** — every action is measured through analytics.

## The five stages + three capabilities

| Stage       | Principle                                    | Module            |
| ----------- | -------------------------------------------- | ----------------- |
| **Attract** | Every piece of content generates traffic     | `content`         |
| **Capture** | Every visitor enters a lead-capture system   | `capture`         |
| **Nurture** | Every lead is nurtured through automation    | `nurture`         |
| **Convert** | Every visitor is offered a product           | `offers`          |
| **Expand**  | Every product is connected to related offers | `offers` (graph)  |
| _Operate_   | Every business process is documented         | `processes`       |
| _Automate_  | Every repetitive task is automated with AI   | `automations`     |
| _Measure_   | Every action is measured through analytics   | `events` / `analytics` |

---

## Architecture

```
lib/flywheel/
  core/        types (stages, capabilities), Registry, Result
  events/      typed event envelope, EventBus, sinks (console/memory)
  brands/      brand (tenant) schema
  content/     ATTRACT — traffic assets → capture form + offer
  capture/     CAPTURE — forms, lead schema, providers, pipeline
  nurture/     NURTURE — drip sequences + scheduling engine
  offers/      CONVERT/EXPAND — offer schema + relationship graph
  processes/   OPERATE — documented SOPs (point to an automation)
  automations/ AUTOMATE — trigger → runner (agent/zapier/mcp/function)
  analytics/   MEASURE — KPI snapshot over the event stream
  os.ts        assembles all modules into one FlywheelOS
  index.ts     public import surface

config/flywheel/
  <brand>/     brand.ts, content.ts, offers.ts, capture.ts,
               nurture.ts, processes.ts, automations.ts, index.ts
  index.ts     getOS() — registers every brand into a singleton
```

### Why it scales without restructuring

- **Everything is a `Registry`.** Each module is a typed, Zod-validated
  registry keyed by `brandId:slug`. Adding data never touches engine code.
- **Registries are brand-aware.** Two brands can reuse the same local
  slug; a `"*"` brand shares an entity across all brands.
- **Input vs. output types.** `Registry<TOut, TIn>` lets config authors
  omit defaulted fields while the registry always stores complete records.
- **One event vocabulary.** Every module emits the same
  `FlywheelEvent`, so analytics is "measure everything" for free — no
  per-feature tracking code.
- **Pluggable edges.** Capture providers (ESP/CRM), event sinks
  (warehouse/vendor), and automation runners are interfaces. Swapping a
  vendor is a config change, not a refactor.

### How the stages connect (no dead ends)

- Every **content** asset names the `captureSlug` it routes to and the
  `offerSlug` it promotes.
- Every **capture form** names the `enrollSequence` a new lead joins.
- Every **nurture step** can carry an `offerSlug` — the NURTURE → CONVERT
  handoff.
- Every **offer** declares `related` edges (`upsell`, `cross_sell`,
  `bundle_of`, `next_step`), so `nextBestOffer()` always has an answer.
- Every **process** can name the `automationSlug` that runs it — OPERATE
  is the on-ramp to AUTOMATE.

---

## Data flow: a visitor becomes a customer

1. Visitor reads a case file → `content.viewed` (**attract**).
2. Submits the newsroom form → `POST /api/capture` → `CapturePipeline`:
   validates, persists via the form's provider, enrolls in
   `welcome-newsroom`, emits `lead.identified` + `capture.submitted`
   (**capture**).
3. `NurtureEngine` schedules drip steps; a worker calls `due()` /
   `advance()`, emitting `nurture.step_sent` (**nurture**). A step pitches
   `unwhistled-book`.
4. Lead buys → `order.placed` with `valueCents` (**convert**).
5. `nextBestOffer()` walks the offer graph → cross-sell the tee/bundle →
   `offer.cross_sold` (**expand**) → advocacy feeds new visitors.

Every step above is a `FlywheelEvent` fanned out to all sinks, so the
`/os` dashboard and any warehouse see the same truth.

---

## Adding things (the whole point)

**A new brand** — create `config/flywheel/<brand>/`, export a
`BrandConfig`, add one line to `config/flywheel/index.ts`. Done.

**A new product** — append to the brand's `offers.ts` with `related`
edges. It joins recommendations automatically.

**A new automation** — append to `automations.ts`: a trigger (event or
cron) + a `runner` (`agent` = Claude, `zapier`/`mcp` = connected tools,
`function` = in-repo). No engine change.

**A new capture form / drip / SOP** — append to the matching config file.

---

## Production wiring (pluggable seams)

The engine ships with safe, in-memory defaults so it runs with zero
external services. Swap these interfaces for real backends:

- **Capture providers** (`lib/flywheel/capture/providers.ts`) → CRM/ESP
  adapters implementing `deliver()`. A production **Brevo** adapter ships
  in `lib/flywheel/capture/brevo.ts`: it's registered automatically when
  `BREVO_API_KEY` is set (see `.env.example`) and syncs each lead as a
  Brevo contact via the REST API. Without the key, capture falls back to
  the console provider, so preview deploys never break signups. Add
  MailerLite / HubSpot / etc. the same way — one class, one `deliver()`.
- **Event sinks** (`lib/flywheel/events/sinks.ts`) → a durable warehouse
  or product-analytics vendor implementing `emit()`.
- **Nurture engine** (`lib/flywheel/nurture/engine.ts`) → delivers each
  step through a pluggable `MessageSender`. A production **Brevo** sender
  ships in `lib/flywheel/nurture/brevo-sender.ts` (transactional email +
  SMS), activated when `BREVO_API_KEY` + `BREVO_SENDER_EMAIL` are set;
  otherwise steps are logged by the console sender. Steps with an
  `offerSlug` get that offer attached as a CTA link automatically. The
  worker endpoint **`GET /api/nurture/tick`** (scheduled every 15 min via
  `vercel.json`, optionally guarded by `CRON_SECRET`) processes all due
  steps. Enrollments are in-memory per instance — back `enroll` / `due` /
  `advance` with durable storage (a DB/queue) before relying on it across
  a multi-instance deployment.
- **Automation runners** → dispatch `agent` specs to Claude, `zapier` /
  `mcp` specs to those connectors.

`seedDemoEvents()` populates the dashboard with clearly-labelled sample
data before real traffic exists — remove or gate it behind an env flag in
production.
