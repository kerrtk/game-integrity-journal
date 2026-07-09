import type { Metadata } from "next"
import Image from "next/image"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Pre-order Unwhistled: How the WNBA Failed Caitlin Clark, plus Game Integrity Journal apparel and bundles.",
  alternates: { canonical: "/shop" },
}

export default function ShopPage() {
  return (
    <div>
      <section className="border-b border-hair px-6 pb-6 pt-16">
        <div className="mx-auto max-w-5xl">
          <span className="mono mb-3.5 block text-xs text-crimson">Shop</span>
          <h1 className="text-[clamp(32px,6vw,56px)] text-bone">Get the case file.</h1>
          <p className="mt-[18px] max-w-[60ch] text-lg text-steel">
            Pre-orders open now. Purchase links go live once fulfillment is connected &mdash;
            check back shortly.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          <div className="border border-hair bg-panel p-[22px]">
            <span className="mono mb-2.5 block text-[11px] text-crimson">Book</span>
            <h3 className="mb-2 text-[22px] text-bone">Unwhistled</h3>
            <p className="text-[14.5px] text-steel">
              How the WNBA Failed Caitlin Clark. Paperback + Kindle. Launches August 1.
            </p>
            <div className="mono my-3.5 text-xl text-bone">Pre-order</div>
            <Button className="w-full justify-center">Coming soon</Button>
          </div>

          <div className="border border-hair bg-panel p-[22px]">
            <span className="mono mb-2.5 block text-[11px] text-crimson">Apparel</span>
            <h3 className="mb-2 text-[22px] text-bone">GIJ Case File Tee</h3>
            <div className="my-3 aspect-square w-full overflow-hidden border border-hair bg-white">
              <Image
                src="/media/tee-calls-they-wont-make.png"
                alt="Unwhistled t-shirt design: a shattered basketball and whistle, with the tagline 'The calls they won't make'"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="text-[14.5px] text-steel">
              Sharp, minimal, editorial &mdash; the Game Integrity Journal mark on premium cotton.
            </p>
            <div className="mono my-3.5 text-xl text-bone">Coming soon</div>
            <Button variant="ghost" className="w-full justify-center">
              Coming soon
            </Button>
          </div>

          <div className="border border-hair bg-panel p-[22px]">
            <span className="mono mb-2.5 block text-[11px] text-crimson">Bundle</span>
            <h3 className="mb-2 text-[22px] text-bone">Book + Tee Bundle</h3>
            <p className="text-[14.5px] text-steel">
              The full case file, cover to shelf. Best value at launch.
            </p>
            <div className="mono my-3.5 text-xl text-bone">Coming soon</div>
            <Button variant="ghost" className="w-full justify-center">
              Coming soon
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
