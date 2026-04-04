import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-ocean-border bg-ocean-surface/40 px-3 py-2 text-sm ring-offset-ocean-card file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-ocean-text-dim/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-biolum/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
