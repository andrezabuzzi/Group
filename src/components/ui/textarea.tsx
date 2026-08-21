import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[100px] premium-input py-3 w-full text-base transition-colors outline-none placeholder:text-muted-foreground md:text-sm resize-y font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
