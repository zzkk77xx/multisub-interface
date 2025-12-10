import { Badge } from '@/components/ui/badge'
import { TooltipIcon } from '@/components/ui/tooltip'
import { useSafeValue, useIsValueStale } from '@/hooks/useSafe'
import { formatUSD, formatTimeAgo } from '@/lib/utils'

export function OracleStatusIndicator() {
  const { data: safeValue, isLoading } = useSafeValue()
  const { data: isStale } = useIsValueStale(3600) // 1 hour threshold

  if (isLoading || !safeValue) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span>Oracle loading...</span>
      </div>
    )
  }

  const [totalValueUSD, lastUpdated, updateCount] = safeValue

  // Calculate time since last update
  const now = Math.floor(Date.now() / 1000)
  const timeSinceUpdate = now - Number(lastUpdated)

  // Determine status color based on time since update
  let statusColor = 'bg-green-500'
  let statusText = 'Active'
  let statusVariant: 'default' | 'secondary' | 'outline' = 'default'

  if (isStale || timeSinceUpdate > 3600) {
    // More than 1 hour or marked as stale
    statusColor = 'bg-yellow-500'
    statusText = 'Stale'
    statusVariant = 'outline'
  } else if (timeSinceUpdate > 900) {
    // More than 15 minutes
    statusColor = 'bg-blue-500'
    statusText = 'Updated'
    statusVariant = 'secondary'
  } else if (timeSinceUpdate > 300) {
    // More than 5 minutes
    statusColor = 'bg-green-400'
    statusText = 'Active'
    statusVariant = 'default'
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor} ${timeSinceUpdate < 300 ? 'animate-pulse' : ''}`} />
        <span className="text-sm font-medium">Oracle Status</span>
        <TooltipIcon content="The Chainlink oracle updates portfolio value and spending allowance data. Fresh data ensures accurate spending limits." />
      </div>

      <Badge variant={statusVariant} className="text-xs">
        {statusText}
      </Badge>

      <div className="flex items-center gap-4 ml-auto text-xs text-muted-foreground">
        <div className="text-right">
          <p className="font-semibold text-foreground">${formatUSD(totalValueUSD)}</p>
          <p>Portfolio Value</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground">{formatTimeAgo(lastUpdated)}</p>
          <p>Last Update</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground">#{Number(updateCount)}</p>
          <p>Updates</p>
        </div>
      </div>

      {isStale && (
        <Badge variant="outline" className="text-xs text-yellow-600 dark:text-yellow-400 ml-2">
          ⚠️ Data may be outdated
        </Badge>
      )}
    </div>
  )
}
