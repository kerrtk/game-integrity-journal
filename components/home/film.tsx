"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

import { Reveal } from "@/components/fx/reveal"

/**
 * Click-to-play film. Nothing autoplays — the visitor taps the poster and
 * the film plays WITH sound (browsers only allow audio after a user
 * gesture). Fully contained and responsive: a 16:9 frame that scales down
 * cleanly on mobile, no scroll-lock, no takeover.
 */
export function Film() {
  const [playing, setPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  function play() {
    setPlaying(true)
    // Let the <video> mount, then start it with sound.
    requestAnimationFrame(() => videoRef.current?.play().catch(() => {}))
  }

  return (
    <section className="relative px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <Reveal className="mb-7 text-center">
          <p className="mono mb-3 text-[11px] text-gold-soft">Watch the film</p>
          <h2 className="font-display text-[clamp(1.7rem,4.5vw,2.8rem)] font-extrabold uppercase leading-[0.95] text-bone">
            The case, <span className="text-gradient-gold">in motion.</span>
          </h2>
        </Reveal>

        <Reveal className="relative overflow-hidden rounded-2xl border border-line/60 glow-gold">
          <div className="relative aspect-video w-full bg-ink">
            {playing ? (
              /* eslint-disable-next-line jsx-a11y/media-has-caption -- branded film, no spoken dialogue to caption */
              <video
                ref={videoRef}
                src="/media/intro.mp4"
                poster="/media/unwhistled-banner.png"
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <button
                type="button"
                onClick={play}
                className="group absolute inset-0 h-full w-full"
                aria-label="Play the film"
              >
                <Image
                  src="/media/unwhistled-banner.png"
                  alt="Unwhistled — Game Integrity Journal"
                  fill
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="object-cover"
                  priority={false}
                />
                <span className="absolute inset-0 bg-ink/40 transition-colors duration-500 group-hover:bg-ink/20" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gold/70 bg-ink/50 text-gold-soft backdrop-blur transition-transform duration-500 group-hover:scale-110 sm:h-20 sm:w-20">
                  <Play className="h-7 w-7 translate-x-0.5 fill-current sm:h-8 sm:w-8" />
                </span>
                <span className="mono absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[0.18em] text-bone/80">
                  Tap to play &middot; with sound
                </span>
              </button>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
