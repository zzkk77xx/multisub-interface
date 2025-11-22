import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ADDRESSES, DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { formatEther } from 'viem'

export function SubAccountDashboard() {
  const { address } = useAccount()
  const [timeRemaining, setTimeRemaining] = useState<string>('')

  // Read limits
  const { data: limits } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getSubAccountLimits',
    args: address ? [address] : undefined,
  })

  // Read portfolio value
  const { data: portfolioValue } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getPortfolioValue',
  })

  // Read deposit window
  const { data: depositWindow } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getDepositWindow',
    args: address ? [address] : undefined,
  })

  // Read withdraw window
  const { data: withdrawWindow } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getWithdrawWindow',
    args: address ? [address] : undefined,
  })

  // Read transfer window
  const { data: transferWindow } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getTransferWindow',
    args: address ? [address] : undefined,
  })

  // Calculate time remaining until window resets
  useEffect(() => {
    if (!limits || !depositWindow) return

    const updateTimer = () => {
      const windowDuration = Number(limits[3]) // windowDuration in seconds
      const windowStart = Number(depositWindow[0]) // windowStart timestamp
      const now = Math.floor(Date.now() / 1000)
      const windowEnd = windowStart + windowDuration
      const remaining = windowEnd - now

      if (remaining <= 0) {
        setTimeRemaining('Window reset - refresh to see updated limits')
      } else {
        const hours = Math.floor(remaining / 3600)
        const minutes = Math.floor((remaining % 3600) / 60)
        const seconds = remaining % 60
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [limits, depositWindow])

  if (!address || !limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Allocation</CardTitle>
          <CardDescription>No spending limits configured yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const [maxDepositBps, maxWithdrawBps, maxLossBps, windowDuration] = limits
  const totalValue = portfolioValue ? Number(formatEther(portfolioValue)) : 0

  // Calculate max allocations
  const maxDepositValue = (totalValue * Number(maxDepositBps)) / 10000
  const maxWithdrawValue = (totalValue * Number(maxWithdrawBps)) / 10000

  // Calculate used amounts
  const depositUsed = depositWindow ? Number(formatEther(depositWindow[1])) : 0
  const withdrawUsed = withdrawWindow ? Number(formatEther(withdrawWindow[1])) : 0
  const transferUsed = transferWindow ? Number(formatEther(transferWindow[1])) : 0

  // Calculate remaining
  const depositRemaining = Math.max(0, maxDepositValue - depositUsed)
  const withdrawRemaining = Math.max(0, maxWithdrawValue - withdrawUsed)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Allocation</CardTitle>
              <CardDescription>Your spending limits and current usage</CardDescription>
            </div>
            {timeRemaining && (
              <Badge variant="outline" className="font-mono">
                Resets in {timeRemaining}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Portfolio Overview */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
              <p className="text-2xl font-bold mt-1">
                {totalValue.toFixed(4)} ETH
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Window Duration: {(Number(windowDuration) / 3600).toFixed(0)} hours
              </p>
            </div>

            {/* Deposit Allocation */}
            <AllocationCard
              title="Deposit Allocation"
              percentage={Number(maxDepositBps) / 100}
              maxValue={maxDepositValue}
              used={depositUsed}
              remaining={depositRemaining}
              color="blue"
            />

            {/* Withdraw Allocation */}
            <AllocationCard
              title="Withdraw Allocation"
              percentage={Number(maxWithdrawBps) / 100}
              maxValue={maxWithdrawValue}
              used={withdrawUsed}
              remaining={withdrawRemaining}
              color="purple"
            />

            {/* Transfer Usage */}
            {transferUsed > 0 && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Transfer Activity</p>
                  <Badge variant="outline" className="text-xs">This Window</Badge>
                </div>
                <p className="text-lg font-semibold">{transferUsed.toFixed(4)} ETH</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Total transferred within current window
                </p>
              </div>
            )}

            {/* Risk Limit */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">Maximum Loss Tolerance</p>
                  <p className="text-xs text-red-700 mt-1">
                    Operations blocked if portfolio loss exceeds this limit
                  </p>
                </div>
                <Badge variant="destructive">
                  {(Number(maxLossBps) / 100).toFixed(2)}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AllocationCardProps {
  title: string
  percentage: number
  maxValue: number
  used: number
  remaining: number
  color: 'blue' | 'purple'
}

function AllocationCard({
  title,
  percentage,
  maxValue,
  used,
  remaining,
  color
}: AllocationCardProps) {
  const usedPercentage = maxValue > 0 ? (used / maxValue) * 100 : 0
  const bgColor = color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'
  const lightBgColor = color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
  const textColor = color === 'blue' ? 'text-blue-900' : 'text-purple-900'

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium">{title}</p>
        <Badge variant="secondary" className="text-xs">
          {percentage.toFixed(2)}% of portfolio
        </Badge>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs text-muted-foreground">Available</span>
            <span className="text-xl font-bold">{remaining.toFixed(4)} ETH</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 ${bgColor} transition-all duration-300`}
              style={{ width: `${Math.min(usedPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>Used: {used.toFixed(4)} ETH</span>
            <span>Max: {maxValue.toFixed(4)} ETH</span>
          </div>
        </div>

        {usedPercentage >= 90 && (
          <div className={`p-2 ${lightBgColor} rounded text-xs ${textColor}`}>
            You've used {usedPercentage.toFixed(0)}% of your {title.toLowerCase()}.
            Limits will reset when the window expires.
          </div>
        )}
      </div>
    </div>
  )
}
