import Link from "next/link"

const footerNav = [
  { href: "/journal", label: "Journal" },
  { href: "/unwhistled", label: "Unwhistled" },
  { href: "/watch", label: "Watch" },
  { href: "/membership", label: "Membership" },
  { href: "/support", label: "Support" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export function Footer() {
  return (
    <footer className="mt-10 border-t border-hair py-10">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6">
        <span className="font-mono text-[11.5px] uppercase tracking-widest text-steel">
          &copy; {new Date().getFullYear()} Game Integrity Journal. All reports independently sourced.
        </span>
        <nav className="flex flex-wrap gap-5">
          {footerNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-[11.5px] uppercase tracking-widest text-steel transition-colors hover:text-bone"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
