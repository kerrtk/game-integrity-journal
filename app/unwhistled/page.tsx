import type { Metadata } from "next"
import Link from "next/link"

import { BOOK } from "@/lib/book"
import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Magnetic } from "@/components/fx/magnetic"
import { Capture } from "@/components/capture"
import { Button } from "@/components/ui/button"
import { BookStage } from "@/components/unwhistled/book-stage"
import { ReadChapter } from "@/components/unwhistled/read-chapter"
import { Testimonials } from "@/components/unwhistled/testimonials"

export const metadata: Metadata = {
  title: "Unwhistled: How the WNBA Failed Caitlin Clark",
  description:
    "The full indictment of WNBA officiating failures. Unwhistled: How the WNBA Failed Caitlin Clark, from Game Integrity Journal. Out now on Amazon in paperback and Kindle.",
  alternates: { canonical: "/unwhistled" },
  openGraph: {
    images: [{ url: "/media/unwhistled-banner.png", width: 2048, height: 1152 }],
  },
}

export default function UnwhistledPage() {
  return (
    <div>
      {/* Hero — interactive 3D book */}
      <section className="relative min-h-[92svh] overflow-hidden px-6 pb-16 pt-10">
        <Aurora />
        <div className="mx-auto grid max-w-6xl items-center gap-8 lg:min-h-[80svh] lg:grid-cols-[1fr_1fr]">
          <div>
            <Reveal variant="blur">
              <span className="mono mb-5 flex items-center gap-3 text-[11px] text-crimson-soft">
                <span className="inline-block h-px w-8 bg-crimson/70" />
                Game Integrity Journal · The Full Indictment
              </span>
              <h1 className="font-display text-[clamp(3.2rem,10vw,8rem)] font-extrabold uppercase leading-[0.86] text-gradient-bone">
                Unwhistled
              </h1>
              <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ash">
                How the WNBA failed Caitlin Clark — and every player the league claims to protect.
                A documented, sourced record of the missed calls, the retroactive corrections, and
                the silence in between.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-9 flex flex-wrap gap-4">
              <Magnetic>
                <Button asChild variant="gold" size="lg">
                  <a href={BOOK.amazonUrl} target="_blank" rel="noopener noreferrer">
                    Buy on Amazon
                  </a>
                </Button>
              </Magnetic>
              <ReadChapter />
            </Reveal>
            <p className="mono mt-6 text-[10px] text-steel">
              Out now · Paperback {BOOK.paperback} · Kindle {BOOK.kindle}
            </p>
          </div>

          <div className="relative">
            <BookStage />
          </div>
        </div>
      </section>

      {/* What this book is */}
      <section className="relative border-t border-line px-6 py-24">
        <div className="mx-auto max-w-[760px]">
          <Reveal variant="blur" className="mb-8">
            <p className="mono mb-4 text-[11px] text-gold-soft">What this book is</p>
            <h2 className="cinema text-[clamp(1.8rem,4vw,2.8rem)] font-medium normal-case leading-tight text-bone">
              Not a highlight reel of bad calls. A case file.
            </h2>
          </Reveal>
          <Reveal>
            <p className="mb-[22px] text-[17px] leading-relaxed text-ash">
              Every incident is cross-checked against footage, box scores, and league statements,
              laid out so the pattern speaks for itself. No referee names. No speculation. Just what
              happened, and what the league did — or didn&apos;t do — about it.
            </p>
            <p className="text-[17px] leading-relaxed text-ash">
              This is the flagship investigation behind Game Integrity Journal, and the first title
              in what&apos;s becoming an ongoing record of sports officiating accountability.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Inside the case */}
      <section id="excerpt" className="relative px-6 py-8">
        <div className="mx-auto max-w-[760px]">
          <Reveal className="glass rounded-xl p-8">
            <span className="mono mb-3 block text-[11px] text-crimson-soft">Chapter preview</span>
            <h3 className="cinema mb-3 text-2xl normal-case text-bone">The Pattern, Not the Play</h3>
            <p className="text-[15px] leading-relaxed text-steel">
              How one missed call becomes a data point — and how enough data points become an
              indictment of the system that let them happen.
            </p>
            <div className="mt-6">
              <ReadChapter />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Announcement video (GitHub-hosted for now; moves to Vercel CDN on Git-connect) */}
      <section className="relative px-6 py-24">
        <div className="mx-auto max-w-[860px]">
          <Reveal variant="blur" className="mb-8">
            <p className="mono mb-4 text-[11px] text-gold-soft">Watch</p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold uppercase leading-none text-bone">
              The announcement
            </h2>
          </Reveal>
          <Reveal className="overflow-hidden rounded-xl glass p-2">
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

      <Testimonials />

      {/* Newsletter */}
      <section className="relative px-6 pb-28 pt-4">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Get the next investigation first."
            body="New reports and the story behind Unwhistled, straight to your inbox."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
