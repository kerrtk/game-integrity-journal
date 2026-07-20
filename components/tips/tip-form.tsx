"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Magnetic } from "@/components/fx/magnetic"
import { cn } from "@/lib/utils"

const categories = [
  "Officiating",
  "Player safety",
  "Governance",
  "Media / narrative",
  "Betting integrity",
  "Other",
]

export function TipForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [form, setForm] = useState({ category: "Officiating", message: "", contact: "" })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("failed")
      setStatus("success")
      setForm({ category: "Officiating", message: "", contact: "" })
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="glass rounded-xl p-10 text-center">
        <p className="cinema text-2xl text-bone">Received — thank you.</p>
        <p className="mt-3 text-[15px] leading-relaxed text-steel">
          Your tip is in. We review every submission and protect every source. If you left a way to
          reach you, we&apos;ll only use it if we need to verify a detail.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-8">
      <div>
        <span className="mono mb-2 block text-[10px] text-steel">What&apos;s it about?</span>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => set("category", c)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                form.category === c
                  ? "border-gold bg-gold/10 text-gold-soft"
                  : "border-line text-steel hover:text-bone"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-6 block">
        <span className="mono mb-2 block text-[10px] text-steel">Your tip</span>
        <textarea
          required
          minLength={20}
          rows={7}
          placeholder="What happened, when, and how you know. Dates, names, documents, or links help — but tell it however you can."
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="w-full rounded-md border border-line bg-graphite px-3 py-2.5 text-sm text-bone placeholder:text-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </label>

      <label className="mt-5 block">
        <span className="mono mb-2 block text-[10px] text-steel">
          How to reach you <span className="text-steel/70">— optional, leave blank to stay anonymous</span>
        </span>
        <Input
          value={form.contact}
          onChange={(e) => set("contact", e.target.value)}
          placeholder="Email, Signal number, or nothing at all"
          className="border-line bg-graphite text-bone"
        />
      </label>

      <div className="mt-6 flex items-center gap-4">
        <Magnetic>
          <Button type="submit" variant="gold" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Submit securely"}
          </Button>
        </Magnetic>
        {status === "error" && <p className="mono text-[11px] text-crimson-soft">Something went wrong. Try again.</p>}
      </div>

      <p className="mono mt-5 text-[10px] leading-relaxed text-steel">
        We never publish a source&apos;s identity without explicit permission. For the most sensitive
        material, use an encrypted channel and share only what you&apos;re comfortable sharing.
      </p>
    </form>
  )
}
