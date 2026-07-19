"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

/* R3F must never run on the server — load the scene client-only. */
const BookScene = dynamic(() => import("@/components/three/book-scene"), {
  ssr: false,
  loading: () => <BookFallback />,
})

/** Static, elegant fallback: the book photo (shown while loading, on
 *  reduced-motion, or if WebGL is unavailable). */
function BookFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[62%] max-w-[300px]">
        <div
          className="absolute inset-0 -z-10 blur-3xl"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 38%, transparent), transparent 65%)" }}
        />
        <Image
          src="/media/unwhistled-cover.png"
          alt="Unwhistled: How the WNBA Failed Caitlin Clark — book cover"
          width={1200}
          height={1800}
          className="w-full rounded-md"
          priority
        />
      </div>
    </div>
  )
}

export function BookStage() {
  const reduced = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(false)

  // Defer 3D until after hydration so first paint stays instant.
  useEffect(() => setMounted(true), [])

  return (
    <div className="relative aspect-[4/5] w-full">
      {reduced || !mounted ? <BookFallback /> : <BookScene />}
      <p className="mono absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-steel">
        {reduced ? "" : "Drag your cursor — the book responds"}
      </p>
    </div>
  )
}
