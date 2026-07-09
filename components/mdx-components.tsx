import type { MDXComponents } from "mdx/types"

function Pullquote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="my-10 border-l-4 border-crimson pl-6 font-display text-2xl font-extrabold uppercase leading-tight text-bone">
      {children}
    </blockquote>
  )
}

function Callout({ children, label = "Context" }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="my-8 border border-hair bg-panel p-5">
      <p className="mono mb-2 text-xs text-crimson">{label}</p>
      <div className="text-sm text-ash">{children}</div>
    </div>
  )
}

function ImagePlaceholder({ label, aspect = "16/9" }: { label: string; aspect?: string }) {
  return (
    <div
      className="flex items-center justify-center border border-dashed border-hair bg-panel px-4 text-center font-mono text-xs uppercase tracking-widest text-steel"
      style={{ aspectRatio: aspect }}
    >
      {label}
    </div>
  )
}

export const mdxComponents: MDXComponents = {
  Pullquote,
  Callout,
  ImagePlaceholder,
}
