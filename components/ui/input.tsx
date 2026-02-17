import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-sky-500/30 selection:text-white dark:bg-white/5 border-slate-300/20 h-11 w-full min-w-0 rounded-xl border bg-slate-900/50 backdrop-blur-sm px-4 py-2 text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm text-white",
        "focus-visible:border-sky-400/60 focus-visible:ring-sky-400/30 focus-visible:ring-2 focus-visible:bg-slate-900/70",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-slate-200/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
