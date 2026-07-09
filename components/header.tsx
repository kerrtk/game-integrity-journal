"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"

export const navItems = [
  { href: "/", label: "Home" },
  { href: "/journal", label: "Journal" },
  { href: "/unwhistled", label: "Unwhistled" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
]

export function Header() {
  const pathname = usePathname()
  const showMasthead = !pathname.startsWith("/journal")

  return (
    <>
      {showMasthead && (
        <div className="bg-crimson px-4 py-1.5 text-center font-mono text-[11px] tracking-widest text-ink">
          Unwhistled launches August 1 &mdash;{" "}
          <Link href="/unwhistled" className="font-semibold text-ink underline">
            pre-order now
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-hair bg-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-[18px]">
          <Link href="/" aria-label="Game Integrity Journal home">
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-mono text-[12.5px] uppercase tracking-widest text-steel transition-colors hover:text-bone"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="md:hidden">
            <MobileNav navItems={navItems} />
          </div>
        </div>
      </header>
    </>
  )
}
