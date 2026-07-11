import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Cinematic button. Variants map to the evolved palette:
 *  - default  → crimson signature, fills on rest, glows/hollows on hover
 *  - gold     → premium editorial CTA
 *  - electric → interactive accent
 *  - glass    → glassmorphism outline
 *  - ghost / link → quiet
 */
const buttonVariants = cva(
  "group relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-sm font-mono text-[13px] uppercase tracking-[0.18em] transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-crimson bg-crimson text-bone hover:bg-transparent hover:text-crimson-soft hover:glow-crimson",
        gold:
          "border border-gold/70 bg-gold text-ink hover:bg-transparent hover:text-gold-soft hover:glow-gold",
        electric:
          "border border-electric/70 bg-transparent text-electric-soft hover:bg-electric hover:text-ink hover:glow-electric",
        glass:
          "glass text-bone hover:text-bone hover:glow-gold",
        ghost:
          "border border-line bg-transparent text-bone hover:border-gold/60 hover:text-gold-soft",
        link: "text-gold underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[26px] py-[14px]",
        sm: "px-4 py-2.5 text-[11px]",
        lg: "px-11 py-[18px] text-sm",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
