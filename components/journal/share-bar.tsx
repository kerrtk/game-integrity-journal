"use client"

import { useState } from "react"
import { Check, Link2, Share2 } from "lucide-react"

/**
 * Sticky-ish share row for article pages. Native share sheet where
 * available (mobile), copy-link fallback everywhere else. No external
 * network calls — keeps the reading view self-contained.
 */
export function ShareBar({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — no-op */
    }
  }

  const share = async () => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        /* user dismissed — fall through to copy */
      }
    }
    copy()
  }

  return (
    <div className="flex items-center gap-3">
      <span className="mono text-[10px] uppercase tracking-widest text-steel">Share this file</span>
      <button
        onClick={share}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-gold/60 hover:text-gold-soft"
        aria-label="Share this report"
      >
        <Share2 className="h-4 w-4" />
      </button>
      <button
        onClick={copy}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-steel transition-colors hover:border-gold/60 hover:text-gold-soft"
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-gold-soft" /> : <Link2 className="h-4 w-4" />}
      </button>
      {copied && <span className="mono text-[10px] text-gold-soft">Link copied</span>}
    </div>
  )
}
