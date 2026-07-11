"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo } from "@/components/logo"
import { MobileNav } from "@/components/mobile-nav"
import { cn } from "@/lib/utils"

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
  const [scrolled, setScrolled] = useState(false)

  /* Glass nav condenses + frosts once you leave the hero. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      {showMasthead && (
        <div className="relative z-40 overflow-hidden bg-crimson px-4 py-1.5 text-center font-mono text-[11px] tracking-[0.18em] text-ink">
          Unwhistled launches August 1 &mdash;{" "}
          <Link href="/unwhistled" className="font-semibold text-ink underline underline-offset-2">
            pre-order now
          </Link>
        </div>
      )}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled ? "glass-strong border-b border-line/70" : "border-b border-transparent bg-transparent"
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 transition-all duration-500",
            scrolled ? "py-3" : "py-[18px]"
          )}
        >
          <Link href="/" aria-label="Game Integrity Journal home" data-cursor>
            <Logo />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative font-mono text-[12px] uppercase tracking-[0.16em] transition-colors",
                    active ? "text-gold-soft" : "text-steel hover:text-bone"
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-1.5 left-0 h-px bg-gold transition-all duration-300",
                      active ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              )
            })}
          </nav>
          <div className="md:hidden">
            <MobileNav navItems={navItems} />
          </div>
        </div>
      </header>
    </>
  )
}
