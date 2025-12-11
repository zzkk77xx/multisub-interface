import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-subtle bg-elevated px-4 py-3 text-sm text-primary transition-all duration-200",
          "placeholder:text-disabled",
          "focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-success-muted",
          "hover:border-default",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-elevated-2",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
