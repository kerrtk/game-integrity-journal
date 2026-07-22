"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Play, Volume2, VolumeX } from "lucide-react"

const SEEN_KEY = "gij-intro-seen"

/**
 * Cinematic full-screen intro. Plays once per browser session on the home
 * page, then fades into the site. Muted autoplay (broadly permitted), with
 * a sound toggle and a skip control. Skipped entirely under reduced-motion.
 * If a browser ever refuses autoplay, we surface a Play button rather than
 * trapping the visitor behind a still frame.
 */
export function Intro() {
  const [show, setShow] = useState(false)
  const [muted, setMuted] = useState(true)
  const [needsTap, setNeedsTap] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const seen = sessionStorage.getItem(SEEN_KEY)
    if (reduce || seen) return
    setShow(true)
    document.documentElement.style.overflow = "hidden"
    return () => {
      document.documentElement.style.overflow = ""
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1")
    document.documentElement.style.overflow = ""
    setShow(false)
  }

  function attemptPlay() {
    const v = videoRef.current
    if (!v) return
    const p = v.play()
    if (p && typeof p.catch === "function") {
      p.then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
    }
  }

  function toggleSound() {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setMuted(v.muted)
    if (!v.muted) v.play().catch(() => {})
  }

  useEffect(() => {
    if (show) attemptPlay()
  }, [show])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- branded intro film, no spoken dialogue to caption */}
          <video
            ref={videoRef}
            src="/media/intro.mp4"
            poster="/media/unwhistled-banner.png"
            autoPlay
            muted
            playsInline
            preload="auto"
            onPlaying={() => setNeedsTap(false)}
            onEnded={dismiss}
            className="h-full w-full object-cover"
          />

          {/* Vignette so controls stay legible over any frame */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_50%,transparent_55%,rgba(0,0,0,0.55)_100%)]" />

          {/* Autoplay fallback — only if the browser refuses to start playback */}
          {needsTap && (
            <button
              onClick={attemptPlay}
              className="glow-gold group absolute flex h-24 w-24 items-center justify-center rounded-full border border-gold/60 bg-ink/40 text-gold-soft backdrop-blur transition-transform hover:scale-105"
              aria-label="Play intro"
            >
              <Play className="h-9 w-9 translate-x-0.5 fill-current" />
            </button>
          )}

          {/* Controls */}
          <div className="absolute inset-x-0 bottom-8 flex items-center justify-center gap-4 px-6">
            <button
              onClick={toggleSound}
              className="glass flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone transition-colors hover:text-gold-soft"
              aria-label={muted ? "Unmute intro" : "Mute intro"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {muted ? "Sound on" : "Mute"}
            </button>
            <button
              onClick={dismiss}
              className="glass rounded-full px-5 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-bone transition-colors hover:text-gold-soft"
            >
              Skip intro &rarr;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
