import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  children: React.ReactNode
  className?: string
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-xs text-white bg-slate-900 dark:bg-slate-700 rounded-md shadow-lg",
            "bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs",
            "after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2",
            "after:border-4 after:border-transparent after:border-t-slate-900 dark:after:border-t-slate-700",
            className
          )}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  )
}

interface TooltipIconProps {
  content: string
  className?: string
}

export function TooltipIcon({ content, className }: TooltipIconProps) {
  return (
    <Tooltip content={content} className={className}>
      <span className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-muted text-muted-foreground hover:bg-muted-foreground hover:text-background cursor-help transition-colors">
        ?
      </span>
    </Tooltip>
  )
}
