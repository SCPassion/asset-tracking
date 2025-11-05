import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-green-500/30 selection:text-white dark:bg-white/5 border-white/10 h-11 w-full min-w-0 rounded-xl border bg-white/5 backdrop-blur-sm px-4 py-2 text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white",
        "focus-visible:border-green-400/50 focus-visible:ring-green-400/20 focus-visible:ring-2 focus-visible:bg-white/8",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-white/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
