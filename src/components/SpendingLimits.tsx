import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TooltipIcon } from '@/components/ui/tooltip'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useSubAccountLimits } from '@/hooks/useSafe'
import { useSafeProposal, encodeContractCall } from '@/hooks/useSafeProposal'

interface SpendingLimitsProps {
  subAccountAddress: `0x${string}`
}

export function SpendingLimits({ subAccountAddress }: SpendingLimitsProps) {
  const { addresses } = useContractAddresses()

  // Read current limits using hook - NEW: returns only 2 values
  const { data: currentLimits } = useSubAccountLimits(subAccountAddress)

  const [spendingLimit, setSpendingLimit] = useState('10') // Default 10% - unified limit
  const [windowHours, setWindowHours] = useState('24') // Default 24 hours
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { proposeTransaction, isPending, error } = useSafeProposal()

  const handleSaveLimits = async () => {
    const spendingBps = Math.floor(parseFloat(spendingLimit) * 100)
    const windowSeconds = Math.floor(parseFloat(windowHours) * 3600)

    if (spendingBps < 0 || spendingBps > 10000) {
      alert('Spending limit must be between 0% and 100%')
      return
    }

    if (windowSeconds < 3600) {
      alert('Window duration must be at least 1 hour')
      return
    }

    if (!addresses.defiInteractor) {
      alert('Contract address not configured')
      return
    }

    try {
      setSuccessMessage(null)

      // NEW signature: only 3 params (subAccount, maxSpendingBps, windowDuration)
      const data = encodeContractCall(
        addresses.defiInteractor,
        DEFI_INTERACTOR_ABI as any[],
        'setSubAccountLimits',
        [
          subAccountAddress,
          BigInt(spendingBps),
          BigInt(windowSeconds),
        ]
      )

      const result = await proposeTransaction({
        to: addresses.defiInteractor,
        data,
      })

      if (result.success) {
        setSuccessMessage(
          `Spending limits set successfully! Transaction hash: ${result.transactionHash}`
        )
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing limits:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose transaction. ${errorMsg}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spending Limits</CardTitle>
        <CardDescription>
          Set strict limits to control sub-account spending
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {currentLimits && (
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg border">
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                Current Configuration
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{(Number(currentLimits[0]) / 100).toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Spending Limit</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{(Number(currentLimits[1]) / 3600).toFixed(0)}h</p>
                  <p className="text-xs text-muted-foreground mt-1">Time Window</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Spending Limit
                <TooltipIcon content="Maximum spending (all operations) as a percentage of portfolio value. Oracle tracks actual spending across swaps, deposits, withdrawals, and transfers." />
                <Badge variant="destructive" className="text-xs">Per Window</Badge>
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={spendingLimit}
                  onChange={e => setSpendingLimit(e.target.value)}
                  placeholder="10"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground font-medium min-w-[30px]">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Time Window
                <TooltipIcon content="Duration in hours for the spending window. Transfer limits reset after this period. Minimum 1 hour, maximum 168 hours (1 week)." />
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  value={windowHours}
                  onChange={e => setWindowHours(e.target.value)}
                  placeholder="24"
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground font-medium min-w-[50px]">hours</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-900">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 text-xs">
                  i
                </div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Summary</p>
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1.5 ml-7">
                <p>
                  • All operations limited to <strong>{spendingLimit}%</strong> of portfolio per {windowHours}-hour window
                </p>
                <p>
                  • Oracle tracks real-time spending across all transactions
                </p>
                <p>
                  • Acquired tokens (from swaps/deposits) are FREE for 24 hours
                </p>
                <p>
                  • Limits automatically reset every <strong>{windowHours} hours</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveLimits}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Proposing to Safe...' : 'Propose Spending Limits'}
            </Button>

            {successMessage && (
              <div className="text-sm text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900 text-center">
                ✓ {successMessage}
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900 text-center">
                ✗ {String(error)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
