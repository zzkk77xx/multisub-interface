import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { useContractAddresses } from '@/contexts/ContractAddressContext'

interface SpendingLimitsProps {
  subAccountAddress: `0x${string}`
}

export function SpendingLimits({ subAccountAddress }: SpendingLimitsProps) {
  const { addresses } = useContractAddresses()

  // Read current limits
  const { data: currentLimits } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getSubAccountLimits',
    args: [subAccountAddress],
  })

  const [depositLimit, setDepositLimit] = useState('10') // Default 10%
  const [withdrawLimit, setWithdrawLimit] = useState('10') // Default 10%
  const [lossLimit, setLossLimit] = useState('5') // Default 5%
  const [windowHours, setWindowHours] = useState('24') // Default 24 hours

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleSaveLimits = async () => {
    const depositBps = Math.floor(parseFloat(depositLimit) * 100)
    const withdrawBps = Math.floor(parseFloat(withdrawLimit) * 100)
    const lossBps = Math.floor(parseFloat(lossLimit) * 100)
    const windowSeconds = Math.floor(parseFloat(windowHours) * 3600)

    if (depositBps < 0 || depositBps > 10000) {
      alert('Deposit limit must be between 0% and 100%')
      return
    }

    if (withdrawBps < 0 || withdrawBps > 10000) {
      alert('Withdraw limit must be between 0% and 100%')
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
      writeContract({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'setSubAccountLimits',
        args: [
          subAccountAddress,
          BigInt(depositBps),
          BigInt(withdrawBps),
          BigInt(lossBps),
          BigInt(windowSeconds),
        ],
      })
    } catch (error) {
      console.error('Error setting limits:', error)
      alert('Failed to set spending limits')
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
                  <p className="text-muted-foreground">Deposit Limit</p>
                  <p className="font-medium">
                    {(Number(currentLimits[0]) / 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Withdraw Limit</p>
                  <p className="font-medium">
                    {(Number(currentLimits[1]) / 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Loss</p>
                  <p className="font-medium">
                    {(Number(currentLimits[2]) / 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Window Duration</p>
                  <p className="font-medium">
                    {(Number(currentLimits[3]) / 3600).toFixed(0)}h
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Deposit Limit (% of portfolio)
                <Badge variant="outline" className="text-xs">Per Window</Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={depositLimit}
                  onChange={(e) => setDepositLimit(e.target.value)}
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum percentage of portfolio that can be deposited within the time window
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Withdraw Limit (% of portfolio)
                <Badge variant="outline" className="text-xs">Per Window</Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={withdrawLimit}
                  onChange={(e) => setWithdrawLimit(e.target.value)}
                  placeholder="10"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum percentage of portfolio that can be withdrawn within the time window
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Maximum Loss Tolerance
                <Badge variant="destructive" className="text-xs">Risk Limit</Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={lossLimit}
                  onChange={(e) => setLossLimit(e.target.value)}
                  placeholder="5"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Maximum portfolio value loss allowed from sub-account operations
              </p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                Time Window Duration
                <Badge variant="outline" className="text-xs">Hours</Badge>
              </label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  min="1"
                  max="168"
                  step="1"
                  value={windowHours}
                  onChange={(e) => setWindowHours(e.target.value)}
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
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-blue-900">Preview</p>
              <div className="text-xs text-blue-700 mt-1 space-y-1">
                <p>
                  Sub-account can deposit up to <strong>{depositLimit}%</strong> and withdraw up to{' '}
                  <strong>{withdrawLimit}%</strong> of the portfolio value
                </p>
                <p>
                  Limits reset every <strong>{windowHours} hours</strong>
                </p>
                <p>
                  Operations are blocked if portfolio loss exceeds <strong>{lossLimit}%</strong>
                </p>
              </div>
            </div>

            <Button
              onClick={handleSaveLimits}
              disabled={isPending || isConfirming}
              className="w-full"
            >
              {isPending || isConfirming ? 'Saving Limits...' : 'Save Spending Limits'}
            </Button>

            {isSuccess && (
              <p className="text-sm text-green-600 mt-2 text-center">
                Spending limits updated successfully
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
