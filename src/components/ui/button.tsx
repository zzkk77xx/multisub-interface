import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-accent-primary to-accent-secondary text-black font-semibold shadow-md hover:shadow-glow relative overflow-hidden group",
        destructive:
          "bg-error text-white hover:bg-error/90",
        outline:
          "border border-default bg-transparent hover:bg-elevated-2 hover:border-strong text-primary",
        secondary:
          "bg-elevated-2 text-primary hover:bg-elevated-3 border border-subtle",
        ghost:
          "text-secondary hover:text-primary hover:bg-white/[0.04]",
        link:
          "text-accent-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2.5 rounded-xl text-sm",
        sm: "h-9 px-4 rounded-lg text-sm",
        lg: "h-12 px-8 rounded-xl text-base",
        icon: "h-10 w-10 rounded-lg",
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
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect for default variant */}
        {variant === "default" || variant === undefined ? (
          <>
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <span className="relative z-10">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
