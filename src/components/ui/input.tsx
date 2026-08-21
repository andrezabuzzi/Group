import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "premium-input w-full min-w-0 px-4 py-2 text-base md:text-sm font-medium",
        className
      )}
      {...props}
    />
  )
}

export { Input }
