import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Capture } from "@/components/capture"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Unwhistled: How the WNBA Failed Caitlin Clark",
  description:
    "The full indictment of WNBA officiating failures. Unwhistled: How the WNBA Failed Caitlin Clark, from Game Integrity Journal. Pre-order now — launches August 1.",
  alternates: { canonical: "/unwhistled" },
  openGraph: {
    images: [{ url: "/media/unwhistled-banner.png", width: 2048, height: 1152 }],
  },
}

export default function UnwhistledPage() {
  return (
    <div>
      <section className="border-b border-hair px-6 pb-16 pt-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <span className="mono mb-3.5 block text-xs text-crimson">
              Game Integrity Journal &middot; The Full Indictment
            </span>
            <h1 className="text-[clamp(48px,9vw,96px)] text-bone">Unwhistled</h1>
            <p className="mt-[18px] max-w-[56ch] text-lg text-steel">
              How the WNBA failed Caitlin Clark &mdash; and every player the league claims to
              protect. A documented, sourced record of the missed calls, the retroactive
              corrections, and the silence in between.
            </p>
            <div className="mt-7 flex flex-wrap gap-3.5">
              <Button asChild>
                <Link href="/shop">Pre-order now</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="#excerpt">Read an excerpt</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <Image
              src="/media/unwhistled-hero.png"
              alt="Unwhistled book cover, lit under a spotlight on a basketball court, surrounded by whistles"
              width={928}
              height={1152}
              className="w-full"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 border-b border-hair pb-3.5">
            <h2 className="text-[clamp(24px,3vw,32px)] text-bone">What this book is</h2>
          </div>
          <p className="mb-[22px] text-[17px] text-ash">
            Unwhistled isn&apos;t a highlight reel of bad calls. It&apos;s a case file &mdash;
            every incident cross-checked against footage, box scores, and league statements, laid
            out so the pattern speaks for itself. No referee names. No speculation. Just what
            happened, and what the league did &mdash; or didn&apos;t do &mdash; about it.
          </p>
          <p className="text-[17px] text-ash">
            This is the flagship investigation behind Game Integrity Journal, and the first title
            in what&apos;s becoming an ongoing record of sports officiating accountability.
          </p>
        </div>
      </section>

      <section id="excerpt" className="border-t border-hair px-6 py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 border-b border-hair pb-3.5">
            <h2 className="text-[clamp(24px,3vw,32px)] text-bone">Inside the case</h2>
          </div>
          <div className="border border-hair bg-panel p-[26px]">
            <span className="mono mb-3 block text-[11px] text-crimson">Chapter preview</span>
            <h3 className="mb-2.5 text-[22px] leading-[1.15] text-bone">The Pattern, Not the Play</h3>
            <p className="text-[15px] leading-relaxed text-steel">
              How one missed call becomes a data point &mdash; and how enough data points become
              an indictment of the system that let them happen.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-hair px-6 py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 border-b border-hair pb-3.5">
            <h2 className="text-[clamp(24px,3vw,32px)] text-bone">Watch the announcement</h2>
          </div>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- promo trailer has no dialogue captions to source yet */}
          <video
            src="/media/unwhistled-promo.mp4"
            poster="/media/unwhistled-banner.png"
            controls
            playsInline
            className="w-full border border-hair"
          />
        </div>
      </section>

      <section className="px-6 pb-16 pt-2">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Be first to know when it's live."
            body="Get launch-day access and pre-order details straight to your inbox."
            buttonLabel="Notify me"
          />
        </div>
      </section>
    </div>
  )
}
