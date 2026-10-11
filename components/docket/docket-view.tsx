import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Capture } from "@/components/capture"
import {
  RESPONSE_LABEL,
  TYPE_LABEL,
  prettyDocketDate,
  type Docket,
  type DocketItem,
} from "@/lib/docket"
import { cn } from "@/lib/utils"

function Tag({ children, tone = "steel" }: { children: React.ReactNode; tone?: "steel" | "gold" | "crimson" }) {
  return (
    <span
      className={cn(
        "mono inline-flex items-center border px-2 py-1 text-[10px]",
        tone === "gold" && "border-gold/50 text-gold-soft",
        tone === "crimson" && "border-crimson/60 text-crimson-soft",
        tone === "steel" && "border-line text-steel"
      )}
    >
      {children}
    </span>
  )
}

function Heat({ level }: { level: number }) {
  return (
    <span className="mono inline-flex items-center gap-1 text-[10px] text-steel" aria-label={`Heat ${level} of 3`}>
      Heat
      {[1, 2, 3].map((n) => (
        <span key={n} className={cn("h-2 w-2", n <= level ? "bg-crimson" : "bg-line")} />
      ))}
    </span>
  )
}

function CaseCard({ item }: { item: DocketItem }) {
  return (
    <article id={item.id} className="scroll-mt-28 border border-line bg-panel p-6 md:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="mono mr-2 text-[11px] text-crimson">Docket {item.id}</span>
        <Tag>{item.league}</Tag>
        <Tag>{TYPE_LABEL[item.type]}</Tag>
        <Tag tone={item.status === "verified" ? "gold" : "steel"}>
          {item.status === "verified" ? "Verified" : "Developing"}
        </Tag>
        <span className="ml-auto">
          <Heat level={item.heat} />
        </span>
      </div>

      <h3 className="mb-3 text-[24px] leading-[1.15] text-bone">{item.headline}</h3>
      <p className="text-[16px] leading-relaxed text-ash">{item.whatHappened}</p>

      <dl className="mt-5 grid gap-4 border-t border-line/70 pt-5 md:grid-cols-2">
        {item.ruleAtIssue ? (
          <div>
            <dt className="mono mb-1.5 text-[10px] text-gold-soft">The rule</dt>
            <dd className="text-[15px] leading-relaxed text-steel">{item.ruleAtIssue}</dd>
          </div>
        ) : null}
        <div>
          <dt className="mono mb-1.5 text-[10px] text-gold-soft">The league &middot; {RESPONSE_LABEL[item.leagueResponse]}</dt>
          <dd className="text-[15px] leading-relaxed text-steel">
            {item.leagueResponseNote || "Nothing on the record yet. We'll update this if the league responds."}
          </dd>
        </div>
      </dl>

      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {item.sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mono inline-flex items-center gap-1 text-[11px] text-crimson-soft hover:underline"
            >
              {s.label} <ArrowUpRight className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  )
}

export function DocketView({ docket, archive }: { docket: Docket; archive: Docket[] }) {
  const leagues = [...new Set(docket.items.map((i) => i.league))]
  const filtered = docket.stats.droppedViralOnly + docket.stats.droppedNoSource

  return (
    <div className="mx-auto max-w-4xl">
      {docket.sample ? (
        <div role="note" className="mb-8 border border-crimson bg-crimson-deep/40 p-4 text-[15px] text-bone">
          <strong className="mono mr-2 text-[11px] text-crimson-soft">Preview only</strong>
          This is sample data with fictional teams and example links, shown so the layout can be reviewed. Nothing on
          this page is real news, and it never appears on the live site.
        </div>
      ) : null}

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line/70 pb-5">
        <div>
          <p className="mono mb-2 text-[11px] text-gold-soft">Filed for</p>
          <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold uppercase leading-none text-bone">
            {prettyDocketDate(docket.date)}
          </h2>
        </div>
        <p className="mono text-[11px] text-steel">
          {docket.items.length} {docket.items.length === 1 ? "story" : "stories"} &middot; {leagues.join(" · ")}
          {filtered ? ` · ${filtered} unverified claims left out` : ""}
        </p>
      </div>

      {docket.items.length ? (
        <div className="grid gap-5">
          {docket.items.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <p className="border border-line bg-panel p-8 text-ash">
          A quiet night. Nothing cleared our sourcing bar for this docket.
        </p>
      )}

      <aside className="mt-10 border-l-2 border-crimson pl-5 text-[15px] leading-relaxed text-steel">
        <p className="mono mb-2 text-[11px] text-bone">How the Docket is made</p>
        Overnight, an automated search scans X and the web for disputed calls, replay reviews, coaching decisions and
        league actions. Anything resting only on a viral claim is dropped, and every item needs a source you can open.
        A person reviews each story before it publishes. We never name individual officials: the failures we track are
        failures of systems, rules and review. See our{" "}
        <Link href="/standards" className="text-crimson-soft hover:underline">
          standards
        </Link>{" "}
        or{" "}
        <Link href="/contact" className="text-crimson-soft hover:underline">
          send a correction
        </Link>
        .
      </aside>

      <Capture
        className="mt-12"
        heading="Get the Docket every morning."
        body="The night's integrity stories across the major leagues, sourced and in your inbox before work."
        buttonLabel="Send me the Docket"
      />

      {archive.length > 1 ? (
        <section className="mt-14">
          <h2 className="mono mb-4 text-[11px] text-gold-soft">Past dockets</h2>
          <ul className="grid gap-px border border-line bg-line sm:grid-cols-2">
            {archive.map((d) => (
              <li key={d.date} className="bg-panel">
                <Link
                  href={`/docket/${d.date}`}
                  className={cn(
                    "flex items-center justify-between p-4 text-[15px] transition-colors hover:bg-graphite",
                    d.date === docket.date ? "text-bone" : "text-ash"
                  )}
                >
                  {prettyDocketDate(d.date)}
                  <span className="mono text-[10px] text-steel">{d.items.length} items</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
