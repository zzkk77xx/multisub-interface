import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-elevated-2 text-primary border border-subtle",
        secondary:
          "bg-elevated-2 text-secondary border border-subtle",
        success:
          "bg-success-muted text-success border border-success/20",
        error:
          "bg-error-muted text-error border border-error/20",
        warning:
          "bg-warning-muted text-warning border border-warning/20",
        info:
          "bg-info-muted text-info border border-info/20",
        outline:
          "border border-default text-secondary bg-transparent",
        destructive:
          "bg-error-muted text-error border border-error/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
