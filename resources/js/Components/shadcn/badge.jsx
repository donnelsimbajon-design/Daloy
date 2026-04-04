import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-biolum/50",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-biolum text-white hover:bg-biolum/80",
        secondary:
          "border-transparent bg-ocean-surface text-ocean-text hover:bg-ocean-surface/80",
        destructive:
          "border-transparent bg-rose-500 text-white hover:bg-rose-500/80",
        outline: "text-ocean-text border-ocean-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (<div className={cn(badgeVariants({ variant }), className)} {...props} />);
}

export { Badge, badgeVariants }
