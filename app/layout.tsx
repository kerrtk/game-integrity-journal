import type { Metadata } from "next"
import { Barlow_Condensed, JetBrains_Mono, PT_Serif } from "next/font/google"

import "./globals.css"
import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { organizationJsonLd, SITE_URL } from "@/lib/json-ld"

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
  "Game Integrity Journal investigates officiating failures in professional sports and holds leagues accountable. Home of Unwhistled: How the WNBA Failed Caitlin Clark."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Game Integrity Journal — Officiating, Accountability, Truth",
    template: "%s — Game Integrity Journal",
  },
  description,
  openGraph: {
    type: "website",
    siteName: "Game Integrity Journal",
    title: "Game Integrity Journal — Officiating, Accountability, Truth",
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
      className={`${barlowCondensed.variable} ${ptSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-crimson focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-bone"
        >
          Skip to content
        </a>
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
