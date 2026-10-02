"use client"

import Image from "next/image"
import dynamic from "next/dynamic"
import { Component, type ReactNode, useEffect, useState } from "react"

import { usePrefersReducedMotion } from "@/lib/use-reduced-motion"

/* R3F must never run on the server — load the scene client-only. */
const BookScene = dynamic(() => import("@/components/three/book-scene"), {
  ssr: false,
  loading: () => <BookFallback />,
})

/** Static, elegant fallback: the book photo (shown while loading, on
 *  reduced-motion, when WebGL is unavailable, or if the 3D scene errors —
 *  e.g. inside the Facebook / Instagram in-app browser). */
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

/** Catches any runtime error from the WebGL scene and shows the cover
 *  instead of a blank / crashed section. */
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? <BookFallback /> : this.props.children
  }
}

/** True only when the browser can actually create a WebGL context. Many
 *  in-app browsers (Facebook, Instagram) and locked-down devices cannot. */
function webglSupported() {
  try {
    const canvas = document.createElement("canvas")
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    )
  } catch {
    return false
  }
}

export function BookStage() {
  const reduced = usePrefersReducedMotion()
  const [canRender3D, setCanRender3D] = useState(false)

  // Defer 3D until after hydration (instant first paint) and only when the
  // browser truly supports WebGL — otherwise the static cover stands in.
  useEffect(() => {
    if (webglSupported()) setCanRender3D(true)
  }, [])

  const show3D = canRender3D && !reduced

  return (
    <div className="relative aspect-[4/5] w-full">
      {show3D ? (
        <SceneBoundary>
          <BookScene />
        </SceneBoundary>
      ) : (
        <BookFallback />
      )}
      <p className="mono absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] text-steel">
        {show3D ? "Drag your cursor — the book responds" : ""}
      </p>
    </div>
  )
}
