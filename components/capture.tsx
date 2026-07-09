"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export function Capture({
  heading,
  body,
  buttonLabel = "Subscribe",
  className,
}: {
  heading: string
  body: string
  buttonLabel?: string
  className?: string
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [email, setEmail] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error("Request failed")
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-5 border border-hair bg-panel p-9",
        className
      )}
    >
      <div>
        <h3 className="max-w-[24ch] text-2xl text-bone">{heading}</h3>
        <p className="mt-2 max-w-[40ch] text-steel">{body}</p>
      </div>
      {status === "success" ? (
        <p className="mono text-sm text-crimson">You&apos;re on the list.</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2.5">
          <label htmlFor="capture-email" className="sr-only">
            Email address
          </label>
          <Input
            id="capture-email"
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-[240px] border-hair bg-panel-2 font-mono text-[13px] text-bone placeholder:text-steel"
          />
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : buttonLabel}
          </Button>
          {status === "error" && (
            <p className="mono w-full text-xs text-crimson">Something went wrong. Try again.</p>
          )}
        </form>
      )}
    </div>
  )
}
