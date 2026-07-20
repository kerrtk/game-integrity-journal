"use client"

import { useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Magnetic } from "@/components/fx/magnetic"
import { cn } from "@/lib/utils"

const topics = ["General", "A story tip", "Membership", "Press / media", "Partnership"]

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [form, setForm] = useState({ name: "", email: "", topic: "General", message: "" })

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("failed")
      setStatus("success")
      setForm({ name: "", email: "", topic: "General", message: "" })
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="glass rounded-xl p-10 text-center">
        <p className="cinema text-2xl text-bone">Message received.</p>
        <p className="mt-3 text-[15px] text-steel">
          Thanks for reaching out — we read everything. If it needs a reply, we&apos;ll be in touch.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-xl p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="mono mb-2 block text-[10px] text-steel">Name</span>
          <Input required value={form.name} onChange={(e) => set("name", e.target.value)} className="border-line bg-graphite text-bone" />
        </label>
        <label className="block">
          <span className="mono mb-2 block text-[10px] text-steel">Email</span>
          <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="border-line bg-graphite text-bone" />
        </label>
      </div>

      <div className="mt-5">
        <span className="mono mb-2 block text-[10px] text-steel">Topic</span>
        <div className="flex flex-wrap gap-2">
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("topic", t)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
                form.topic === t
                  ? "border-gold bg-gold/10 text-gold-soft"
                  : "border-line text-steel hover:text-bone"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="mono mb-2 block text-[10px] text-steel">Message</span>
        <textarea
          required
          minLength={10}
          rows={5}
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          className="w-full rounded-md border border-line bg-graphite px-3 py-2.5 text-sm text-bone placeholder:text-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        />
      </label>

      <div className="mt-6 flex items-center gap-4">
        <Magnetic>
          <Button type="submit" variant="gold" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Send message"}
          </Button>
        </Magnetic>
        {status === "error" && <p className="mono text-[11px] text-crimson-soft">Something went wrong. Try again.</p>}
      </div>
    </form>
  )
}
