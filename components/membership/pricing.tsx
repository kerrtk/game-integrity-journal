"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"

import { Magnetic } from "@/components/fx/magnetic"
import { Button } from "@/components/ui/button"
import { inViewOnce, stagger } from "@/lib/motion"
import { cn } from "@/lib/utils"

/**
 * Membership pricing. NOTE: placeholder prices — set real numbers before
 * launch. Checkout is stubbed (CTA → /support) until Stripe is connected;
 * email interest still flows through the Brevo capture pipeline.
 */
type Tier = {
  id: string
  name: string
  tagline: string
  monthly: number | null
  annual: number | null
  cta: string
  featured?: boolean
  accent: string
  perks: string[]
}

const tiers: Tier[] = [
  {
    id: "supporter",
    name: "Supporter",
    tagline: "Back independent investigations.",
    monthly: 6,
    annual: 60,
    cta: "Become a Supporter",
    accent: "var(--electric)",
    perks: [
      "Member newsletter",
      "Early access to new reports",
      "Your name on the supporters wall",
      "Ad-free reading, always",
    ],
  },
  {
    id: "member",
    name: "Member",
    tagline: "The full case file.",
    monthly: 12,
    annual: 120,
    cta: "Join as a Member",
    featured: true,
    accent: "var(--gold)",
    perks: [
      "Everything in Supporter",
      "Full investigation archive",
      "Chapter excerpts & briefings",
      "Quarterly member briefing call",
      "Priority tip review",
    ],
  },
  {
    id: "partner",
    name: "Official Partner",
    tagline: "For newsrooms & organizations.",
    monthly: null,
    annual: null,
    cta: "Talk to us",
    accent: "var(--crimson)",
    perks: [
      "Everything in Member",
      "Team & org-wide access",
      "Republishing license",
      "Logo credit as a partner",
      "Direct access to our analysts",
    ],
  },
]

export function Pricing() {
  const [annual, setAnnual] = useState(false)

  return (
    <div>
      {/* billing toggle */}
      <div className="mb-14 flex items-center justify-center gap-4">
        <span className={cn("mono text-[11px]", !annual ? "text-bone" : "text-steel")}>Monthly</span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual((v) => !v)}
          className="relative h-7 w-14 rounded-full border border-line bg-graphite transition-colors"
          data-cursor
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 500, damping: 32 }}
            className={cn("absolute top-1 h-4 w-4 rounded-full bg-gold", annual ? "left-8" : "left-1.5")}
          />
        </button>
        <span className={cn("mono text-[11px]", annual ? "text-bone" : "text-steel")}>
          Annual <span className="text-gold-soft">· 2 months free</span>
        </span>
      </div>

      <motion.div
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={inViewOnce}
        className="grid gap-6 lg:grid-cols-3"
      >
        {tiers.map((tier) => {
          const price = annual ? tier.annual : tier.monthly
          return (
            <motion.div
              key={tier.id}
              variants={{
                hidden: { opacity: 0, y: 34 },
                show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
              }}
              className={cn(
                "relative flex flex-col rounded-xl p-8",
                tier.featured ? "glass-strong glow-gold" : "glass"
              )}
              data-cursor
            >
              {tier.featured && (
                <span className="mono absolute -top-3 left-8 rounded-full bg-gold px-3 py-1 text-[10px] text-ink">
                  Most popular
                </span>
              )}
              <h3 className="text-2xl text-bone" style={{ color: tier.accent }}>
                {tier.name}
              </h3>
              <p className="mt-1 text-sm text-steel">{tier.tagline}</p>

              <div className="mt-6 flex items-end gap-1">
                {price === null ? (
                  <span className="font-display text-4xl font-extrabold text-bone">Custom</span>
                ) : (
                  <>
                    <span className="font-display text-5xl font-extrabold leading-none text-bone">${price}</span>
                    <span className="mono mb-1 text-[11px] text-steel">/{annual ? "yr" : "mo"}</span>
                  </>
                )}
              </div>

              <ul className="mt-8 flex-1 space-y-3">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-3 text-[14px] text-ash">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: tier.accent }} />
                    {perk}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Magnetic>
                  <Button asChild variant={tier.featured ? "gold" : "ghost"} className="w-full justify-center">
                    <a href="/support">{tier.cta}</a>
                  </Button>
                </Magnetic>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
      <p className="mono mt-8 text-center text-[10px] text-steel">
        Prices shown are placeholders · Checkout opens when membership goes live
      </p>
    </div>
  )
}
