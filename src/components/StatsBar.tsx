import { useAccount, useChainId } from 'wagmi'
import { useSafeAddress, useIsSafeOwner, useManagedAccounts, useSafeValue, useIsValueStale } from '@/hooks/useSafe'
import { Badge } from '@/components/ui/badge'
import { TooltipIcon } from '@/components/ui/tooltip'
import { formatUSD, formatTimeAgo } from '@/lib/utils'

const chainNames: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
  8453: 'Base',
  11155111: 'Sepolia',
}

export function StatsBar() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { data: safeAddress } = useSafeAddress()
  const { isSafeOwner } = useIsSafeOwner()
  const { data: accounts } = useManagedAccounts()

  if (!isConnected) return null

  const networkName = chainNames[chainId] || `Chain ${chainId}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 animate-fade-in">
      {/* Stats Group - Left */}
      <div className="flex flex-wrap gap-3">
        <StatItem
          label="Safe"
          value={safeAddress ? 'Connected' : 'Not configured'}
          status={safeAddress ? 'success' : 'warning'}
        />
        <StatItem
          label="Role"
          value={isSafeOwner ? 'Safe Owner' : 'Sub-Account'}
          status={isSafeOwner ? 'info' : 'default'}
        />
        <StatItem
          label="Sub-Accounts"
          value={(accounts?.length ?? 0).toString()}
          status="default"
        />
        <StatItem
          label="Network"
          value={networkName}
          status="default"
        />
      </div>

      {/* Oracle Status - Right */}
      <OracleStatusCompact />
    </div>
  )
}

function OracleStatusCompact() {
  const { data: safeValue, isLoading } = useSafeValue()
  const { data: isStale } = useIsValueStale(3600)

  if (isLoading || !safeValue) {
    return (
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-elevated border border-subtle">
        <div className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
        <span className="text-small text-tertiary">Oracle loading...</span>
      </div>
    )
  }

  const [totalValueUSD, lastUpdated, updateCount] = safeValue
  const now = Math.floor(Date.now() / 1000)
  const timeSinceUpdate = now - Number(lastUpdated)

  let statusColor = 'bg-success'
  let statusText = 'Active'

  if (isStale || timeSinceUpdate > 3600) {
    statusColor = 'bg-warning'
    statusText = 'Stale'
  } else if (timeSinceUpdate > 900) {
    statusColor = 'bg-info'
    statusText = 'Updated'
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-elevated border border-subtle">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusColor} ${timeSinceUpdate < 300 ? 'animate-pulse' : ''}`} />
        <span className="text-caption text-tertiary uppercase tracking-wider">Oracle</span>
        <TooltipIcon content="Chainlink oracle for portfolio value" />
      </div>
      <Badge variant={isStale ? 'outline' : 'default'} className="text-xs">
        {statusText}
      </Badge>
      <div className="flex items-center gap-4 text-xs">
        <div className="text-right">
          <span className="font-semibold text-primary">${formatUSD(totalValueUSD)}</span>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-tertiary">{formatTimeAgo(lastUpdated)}</span>
        </div>
      </div>
    </div>
  )
}

interface StatItemProps {
  label: string
  value: string
  status?: 'success' | 'warning' | 'info' | 'default'
}

function StatItem({ label, value, status = 'default' }: StatItemProps) {
  const statusColors = {
    success: 'bg-success',
    warning: 'bg-warning',
    info: 'bg-info',
    default: 'bg-tertiary',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-elevated border border-subtle min-w-[140px]">
      <div
        className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'success' ? 'status-pulse' : ''}`}
      />
      <div className="flex flex-col">
        <span className="text-caption text-tertiary uppercase tracking-wider">{label}</span>
        <span className="text-small font-medium text-primary">{value}</span>
      </div>
    </div>
  )
}
