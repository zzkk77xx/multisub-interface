import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TooltipIcon } from '@/components/ui/tooltip'
import { useSpendingAllowance, useSubAccountLimits, useSafeValue, useIsValueStale } from '@/hooks/useSafe'
import { formatUSD } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

interface SpendingAllowanceCardProps {
  address: `0x${string}`
}

export function SpendingAllowanceCard({ address }: SpendingAllowanceCardProps) {
  const { data: allowance, isLoading: allowanceLoading } = useSpendingAllowance(address)
  const { data: limits, isLoading: limitsLoading } = useSubAccountLimits(address)
  const { data: safeValue, isLoading: valueLoading } = useSafeValue()
  const { data: isStale } = useIsValueStale(3600) // 1 hour threshold

  if (allowanceLoading || limitsLoading || valueLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Spending Allowance</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!allowance || !limits || !safeValue) {
    return null
  }

  // Calculate max allowance from limit percentage
  const [maxSpendingBps] = limits
  const [totalValueUSD] = safeValue
  const maxAllowance = (totalValueUSD * BigInt(maxSpendingBps)) / 10000n

  // Calculate percent used
  const percentUsed = maxAllowance > 0n
    ? Number((maxAllowance - allowance) * 10000n / maxAllowance) / 100
    : 0

  // Determine color coding
  const percentRemaining = 100 - percentUsed
  let statusColor: 'green' | 'yellow' | 'red' = 'green'
  let statusVariant: 'default' | 'secondary' | 'destructive' = 'default'

  if (percentRemaining < 25) {
    statusColor = 'red'
    statusVariant = 'destructive'
  } else if (percentRemaining < 50) {
    statusColor = 'yellow'
    statusVariant = 'secondary'
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            Spending Allowance
            <TooltipIcon content="The oracle tracks your spending across all operations. Remaining allowance is calculated based on your spending limit and the Safe's portfolio value." />
          </CardTitle>
          {isStale && (
            <Badge variant="outline" className="text-xs text-yellow-600 dark:text-yellow-400">
              Stale Data
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">${formatUSD(allowance)}</p>
            <p className="text-xs text-muted-foreground">Remaining allowance</p>
          </div>
          <Badge variant={statusVariant}>
            {percentRemaining.toFixed(1)}% left
          </Badge>
        </div>

        <div className="space-y-2">
          <Progress value={percentUsed} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Used: ${formatUSD(maxAllowance - allowance)}</span>
            <span>Max: ${formatUSD(maxAllowance)}</span>
          </div>
        </div>

        {percentRemaining < 25 && (
          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900">
            <p className="text-xs text-red-700 dark:text-red-300">
              ⚠️ Low allowance remaining. Further operations may be blocked.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
