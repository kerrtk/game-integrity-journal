import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { Magnetic } from "@/components/fx/magnetic"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Pre-order Unwhistled: How the WNBA Failed Caitlin Clark, plus Game Integrity Journal apparel and bundles.",
  alternates: { canonical: "/shop" },
}

// TODO: replace with the real Amazon product URL at launch.
const BUY_URL = "#"

const products = [
  {
    tag: "Apparel",
    name: "GIJ Case File Tee",
    blurb: "Sharp, minimal, editorial — the Game Integrity Journal mark on premium cotton.",
    price: "Coming soon",
    image: "/media/tee-calls-they-wont-make.png",
    cta: "Coming soon",
    variant: "ghost" as const,
  },
  {
    tag: "Bundle",
    name: "Book + Tee Bundle",
    blurb: "The full case file, cover to shelf. Best value at launch.",
    price: "Coming soon",
    image: null,
    cta: "Coming soon",
    variant: "ghost" as const,
  },
]

export default function ShopPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line/60 px-6 pb-10 pt-24">
        <Aurora />
        <div className="mx-auto max-w-5xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">Shop</p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              Get the <span className="text-gradient-gold">case file.</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ash">
              Every purchase funds independent investigations. Checkout opens once fulfillment is
              connected — pre-order details below.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Featured — Unwhistled */}
      <section className="relative px-6 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <Reveal className="mx-auto w-full max-w-xs">
            <div className="relative">
              <div
                className="absolute inset-0 -z-10 blur-3xl"
                style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--gold) 34%, transparent), transparent 65%)" }}
              />
              <Image
                src="/media/unwhistled-cover.png"
                alt="Unwhistled: How the WNBA Failed Caitlin Clark — book cover"
                width={1200}
                height={1800}
                className="w-full rounded-md glow-gold"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mono mb-4 text-[11px] text-crimson-soft">Book · The flagship</p>
            <h2 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-extrabold uppercase leading-[0.95] text-bone">
              Unwhistled
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-ash">
              How the WNBA Failed Caitlin Clark. The full indictment — every missed call, every
              retroactive correction, laid out so the pattern speaks for itself. Paperback + Kindle.
            </p>
            <div className="mono mt-6 text-2xl text-bone">Launches August 1</div>
            <div className="mt-6 flex flex-wrap gap-4">
              <Magnetic>
                <Button asChild variant="gold" size="lg">
                  <a href={BUY_URL} target={BUY_URL.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    Pre-order on Amazon
                  </a>
                </Button>
              </Magnetic>
              <Button asChild variant="ghost" size="lg">
                <Link href="/unwhistled">See the book</Link>
              </Button>
            </div>
            <p className="mono mt-4 text-[10px] text-steel">Amazon link goes live at launch</p>
          </Reveal>
        </div>
      </section>

      {/* Apparel + bundle */}
      <section className="relative border-t border-line/60 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-12">
            <p className="mono mb-4 text-[11px] text-gold-soft">Merch & bundles</p>
            <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] font-extrabold uppercase text-bone">
              Wear the record
            </h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2">
            {products.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08} className="group flex flex-col overflow-hidden rounded-xl glass">
                {p.image ? (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-white">
                    <Image
                      src={p.image}
                      alt={`${p.name} design`}
                      width={1024}
                      height={640}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center border-b border-line bg-graphite">
                    <span className="font-display text-4xl font-extrabold uppercase text-line">GIJ</span>
                  </div>
                )}
                <div className="flex flex-1 flex-col p-7">
                  <span className="mono mb-2 text-[11px] text-crimson-soft">{p.tag}</span>
                  <h3 className="text-2xl text-bone">{p.name}</h3>
                  <p className="mt-2 flex-1 text-[14.5px] leading-relaxed text-steel">{p.blurb}</p>
                  <div className="mono my-4 text-lg text-bone">{p.price}</div>
                  <Button variant={p.variant} className="w-full justify-center">
                    {p.cta}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
