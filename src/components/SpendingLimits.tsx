import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useSubAccountLimits } from '@/hooks/useSafe'
import { useSafeProposal, encodeContractCall } from '@/hooks/useSafeProposal'

interface SpendingLimitsProps {
  subAccountAddress: `0x${string}`
}

export function SpendingLimits({ subAccountAddress }: SpendingLimitsProps) {
  const { addresses } = useContractAddresses()

  // Read current limits using hook
  const { data: currentLimits } = useSubAccountLimits(subAccountAddress)

  const [transferLimit, setTransferLimit] = useState('10') // Default 10%
  const [lossLimit, setLossLimit] = useState('5') // Default 5%
  const [windowHours, setWindowHours] = useState('24') // Default 24 hours
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { proposeTransaction, isPending, error } = useSafeProposal()

  const handleSaveLimits = async () => {
    const transferBps = Math.floor(parseFloat(transferLimit) * 100)
    const lossBps = Math.floor(parseFloat(lossLimit) * 100)
    const windowSeconds = Math.floor(parseFloat(windowHours) * 3600)

    if (transferBps < 0 || transferBps > 10000) {
      alert('Transfer limit must be between 0% and 100%')
      return
    }

    if (lossBps < 0 || lossBps > 10000) {
      alert('Loss limit must be between 0% and 100%')
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

      const data = encodeContractCall(
        addresses.defiInteractor,
        DEFI_INTERACTOR_ABI as any[],
        'setSubAccountLimits',
        [
          subAccountAddress,
          BigInt(lossBps),
          BigInt(transferBps),
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
          Configure percentage-based spending limits with time windows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {currentLimits && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Current Limits</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Max Loss (Execute)</p>
                  <p className="font-medium">{(Number(currentLimits[0]) / 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Transfer Limit</p>
                  <p className="font-medium">{(Number(currentLimits[1]) / 100).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Window Duration</p>
                  <p className="font-medium">{(Number(currentLimits[2]) / 3600).toFixed(0)}h</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Maximum Loss Tolerance (Execute Role)
                <Badge
                  variant="destructive"
                  className="text-xs"
                >
                  Risk Limit
                </Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={lossLimit}
                  onChange={e => setLossLimit(e.target.value)}
                  placeholder="5"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum portfolio value loss allowed from protocol interactions and approvals
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Transfer Limit (% of portfolio)
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Per Window
                </Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={transferLimit}
                  onChange={e => setTransferLimit(e.target.value)}
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum percentage of portfolio that can be transferred within the time window
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Time Window Duration
                <Badge
                  variant="outline"
                  className="text-xs"
                >
                  Hours
                </Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  value={windowHours}
                  onChange={e => setWindowHours(e.target.value)}
                  placeholder="24"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Time window for spending limits to reset (default: 24 hours)
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Preview</p>
              <div className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <p>
                  Sub-account can transfer up to <strong>{transferLimit}%</strong> of the portfolio value per window
                </p>
                <p>
                  Limits reset every <strong>{windowHours} hours</strong>
                </p>
                <p>
                  Protocol executions are blocked if portfolio loss exceeds <strong>{lossLimit}%</strong>
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
              <p className="text-sm text-green-600 mt-2 text-center">✓ {successMessage}</p>
            )}

            {error && <p className="text-sm text-red-600 mt-2 text-center">✗ {String(error)}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
