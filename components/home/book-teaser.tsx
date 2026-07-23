"use client"

import Image from "next/image"
import Link from "next/link"
import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

import { Magnetic } from "@/components/fx/magnetic"
import { Reveal } from "@/components/fx/reveal"
import { Button } from "@/components/ui/button"
import { BOOK } from "@/lib/book"

/**
 * Home → Unwhistled bridge. Parallax book cover with a floating glow,
 * pointing at the dedicated 3D book experience on /unwhistled.
 */
export function BookTeaser() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [60, -60])
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6])

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div style={{ y, rotate }} className="relative mx-auto w-full max-w-xs">
          <div className="absolute inset-0 -z-10 blur-3xl" style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 40%, transparent), transparent 65%)" }} />
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="overflow-hidden rounded-md glow-gold"
          >
            <Image
              src="/media/unwhistled-cover.png"
              alt="Unwhistled: How the WNBA Failed Caitlin Clark — book cover"
              width={1200}
              height={1800}
              className="w-full"
            />
          </motion.div>
        </motion.div>

        <div>
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-crimson-soft">The flagship investigation</p>
            <h2 className="font-display text-[clamp(2.4rem,6vw,5rem)] font-extrabold uppercase leading-[0.9] text-bone">
              Unwhistled
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ash">
              How the WNBA failed Caitlin Clark — and every player the league claims to protect.
              A documented, sourced record of the missed calls, the retroactive corrections, and the
              silence in between.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-9 flex flex-wrap gap-4">
            <Magnetic>
              <Button asChild variant="gold" size="lg">
                <Link href="/unwhistled">Enter the book</Link>
              </Button>
            </Magnetic>
            <Magnetic>
              <Button asChild variant="ghost" size="lg">
                <a href={BOOK.amazonUrl} target="_blank" rel="noopener noreferrer">
                  Buy on Amazon
                </a>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
