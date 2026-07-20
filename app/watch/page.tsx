import type { Metadata } from "next"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Capture } from "@/components/capture"

export const metadata: Metadata = {
  title: "Watch",
  description:
    "Video from Game Integrity Journal — the Unwhistled announcement, interviews, and the podcast.",
  alternates: { canonical: "/watch" },
}

// Placeholder gallery — real interviews / podcast episodes drop here.
const upcoming = [
  { kind: "Interview", title: "Inside the officiating room", note: "Coming soon" },
  { kind: "Podcast", title: "The Integrity Brief · Ep. 01", note: "Coming soon" },
  { kind: "Film study", title: "The pattern, frame by frame", note: "Coming soon" },
]

export default function WatchPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-10 pt-24">
        <Aurora />
        <div className="mx-auto max-w-5xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Watch</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              The record, <span className="text-gradient-gold">on screen.</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ash">
              Announcements, interviews, and the podcast — the investigation in motion.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Featured video */}
      <section className="relative px-6 py-10">
        <div className="mx-auto max-w-[900px]">
          <Reveal className="overflow-hidden rounded-xl glass p-2">
            <p className="mono px-4 pb-3 pt-2 text-[11px] text-crimson-soft">Featured · The Unwhistled announcement</p>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption -- promo trailer has no dialogue captions to source yet */}
            <video
              src="/media/unwhistled-promo.mp4"
              poster="/media/unwhistled-banner.png"
              controls
              playsInline
              className="w-full rounded-lg"
            />
          </Reveal>
        </div>
      </section>

      {/* Upcoming gallery */}
      <section className="relative px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-12">
            <p className="mono mb-4 text-[11px] text-gold-soft">Coming to the channel</p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold uppercase text-bone">
              Interviews & podcast
            </h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-3">
            {upcoming.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08} className="group overflow-hidden rounded-xl glass">
                <div className="relative flex aspect-video items-center justify-center border-b border-line bg-graphite">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold-soft transition-transform duration-500 group-hover:scale-110">
                    ▶
                  </span>
                  <span className="mono absolute left-3 top-3 rounded-full border border-line bg-ink/70 px-2 py-1 text-[9px] text-steel">
                    {v.note}
                  </span>
                </div>
                <div className="p-6">
                  <span className="mono text-[10px] text-crimson-soft">{v.kind}</span>
                  <h3 className="mt-2 text-lg leading-tight text-bone">{v.title}</h3>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mono mt-8 text-center text-[10px] text-steel">
            [ Placeholder gallery — real interviews and podcast episodes will publish here. ]
          </p>
        </div>
      </section>

      <section className="relative px-6 pb-28 pt-2">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Get every drop first."
            body="New videos, interviews, and podcast episodes — straight to your inbox."
            buttonLabel="Notify me"
          />
        </div>
      </section>
    </div>
  )
}
