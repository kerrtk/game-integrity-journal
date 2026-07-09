import type { Metadata } from "next"
import Image from "next/image"

import { Capture } from "@/components/capture"

export const metadata: Metadata = {
  title: "About",
  description:
    "Game Integrity Journal exists to hold sports leagues accountable for officiating failures — documented, sourced, and free of speculation.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return (
    <div>
      <section className="border-b border-hair px-6 pb-10 pt-16">
        <div className="mx-auto max-w-[760px]">
          <span className="mono mb-3.5 block text-xs text-crimson">About</span>
          <h1 className="text-[clamp(34px,6vw,58px)] text-bone">Why this exists.</h1>
          <p className="mt-[18px] max-w-[60ch] text-lg text-steel">
            Every league has an officiating problem it doesn&apos;t want documented. Game
            Integrity Journal documents it anyway.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-[760px]">
          <div className="mx-auto mb-12 max-w-xs overflow-hidden border border-hair">
            <Image
              src="/media/unwhistled-shield-logo.png"
              alt="Unwhistled shield emblem: a referee-jersey shield with crossed-out eyes, behind scales of justice"
              width={1536}
              height={1024}
              className="w-full"
            />
          </div>
          <p className="mb-[22px] text-[17px] text-ash">
            We&apos;re not here to pick a side in a rivalry or pile on a bad night for the refs.
            We&apos;re here because officiating failures repeat, get memory-holed, and repeat
            again &mdash; and the only thing that changes that is a record someone actually keeps.
          </p>
          <p className="mb-[22px] text-[17px] text-ash">
            Game Integrity Journal tracks the pattern: missed calls, retroactive corrections, task
            forces that quietly go nowhere. We don&apos;t name individual officials and we
            don&apos;t speculate about motive. We report what happened, cite where it came from,
            and let the pattern make the case.
          </p>
          <p className="text-[17px] text-ash">
            Our first flagship investigation,{" "}
            <em>Unwhistled: How the WNBA Failed Caitlin Clark</em>, is the full record of one
            season&apos;s worth of that pattern. It won&apos;t be the last.
          </p>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <Capture
            heading="Follow the investigation."
            body="New reports, straight to your inbox, the day they publish."
            buttonLabel="Subscribe"
          />
        </div>
      </section>
    </div>
  )
}
