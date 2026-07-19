import type { Metadata } from "next"
import { Barlow_Condensed, Fraunces, JetBrains_Mono, PT_Serif } from "next/font/google"

import "./globals.css"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { SmoothScroll } from "@/components/providers/smooth-scroll"
import { Cursor } from "@/components/fx/cursor"
import { ScrollProgress } from "@/components/fx/scroll-progress"
import { organizationJsonLd, SITE_URL } from "@/lib/json-ld"

/* Cinematic serif for editorial display moments */
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
})
/* Case-file condensed display (kicker / labels / bold headlines) */
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
})
const ptSerif = PT_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-pt-serif",
  display: "swap",
})
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-jetbrains",
  display: "swap",
})

const description =
  "An independent platform investigating fairness, accountability, and transparency across sport. Home of Unwhistled: How the WNBA Failed Caitlin Clark."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Game Integrity Journal — Every Game Deserves Fair Officiating",
    template: "%s — Game Integrity Journal",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Game Integrity Journal",
    title: "Game Integrity Journal — Every Game Deserves Fair Officiating",
    description,
    images: [{ url: "/media/unwhistled-banner.png", width: 2048, height: 1152 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/media/unwhistled-banner.png"],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${barlowCondensed.variable} ${ptSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-crimson focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-bone"
        >
          Skip to content
        </a>
        <Cursor />
        <ScrollProgress />
        <SmoothScroll>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </SmoothScroll>
      </body>
    </html>
  )
}
