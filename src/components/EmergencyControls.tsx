import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useIsSafeOwner } from '@/hooks/useSafe'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useSafeProposal, encodeContractCall } from '@/hooks/useSafeProposal'
import { useReadContract } from 'wagmi'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'

export function EmergencyControls() {
  const { isSafeOwner } = useIsSafeOwner()
  const { addresses } = useContractAddresses()
  const { proposeTransaction, isPending, error } = useSafeProposal()
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Read current pause status
  const { data: isPaused, refetch: refetchPauseStatus } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'paused',
    query: {
      enabled: Boolean(addresses.defiInteractor),
    },
  })

  const handlePause = async () => {
    if (!addresses.defiInteractor) {
      alert('Contract address not configured')
      return
    }

    try {
      setSuccessMessage(null)

      const data = encodeContractCall(
        addresses.defiInteractor,
        DEFI_INTERACTOR_ABI as unknown as any[],
        'pause',
        []
      )

      const result = await proposeTransaction({
        to: addresses.defiInteractor,
        data,
      })

      if (result.success) {
        await refetchPauseStatus()
        setSuccessMessage(
          `Contract paused successfully! Transaction hash: ${result.transactionHash}`
        )
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing pause:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose pause transaction. ${errorMsg}`)
    }
  }

  const handleUnpause = async () => {
    if (!addresses.defiInteractor) {
      alert('Contract address not configured')
      return
    }

    try {
      setSuccessMessage(null)

      const data = encodeContractCall(
        addresses.defiInteractor,
        DEFI_INTERACTOR_ABI as unknown as any[],
        'unpause',
        []
      )

      const result = await proposeTransaction({
        to: addresses.defiInteractor,
        data,
      })

      if (result.success) {
        await refetchPauseStatus()
        setSuccessMessage(
          `Contract unpaused successfully! Transaction hash: ${result.transactionHash}`
        )
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing unpause:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose unpause transaction. ${errorMsg}`)
    }
  }

  if (!isSafeOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Controls</CardTitle>
          <CardDescription>Only Safe owners can access emergency controls</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect with a Safe owner address to access emergency controls.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          Emergency Controls
          {isPaused ? (
            <Badge
              variant="destructive"
              className="text-xs"
            >
              ⚠️ PAUSED
            </Badge>
          ) : (
            <Badge
              variant="default"
              className="text-xs bg-green-600"
            >
              ✓ Active
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Pause or unpause all sub-account operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Message */}
        {isPaused ? (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-sm font-medium text-red-900 dark:text-red-100">
              ⚠️ Contract is Currently Paused
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
              All sub-account operations are frozen. No transfers or protocol interactions can be
              executed.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Contract is Active
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              All sub-accounts can execute transfers and protocol interactions normally.
            </p>
          </div>
        )}

        {/* Pause Button */}
        {!isPaused && (
          <div className="space-y-2">
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-lg">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
                Pausing will immediately freeze all sub-account operations including:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 ml-4 list-disc">
                <li>Token transfers</li>
                <li>DeFi protocol interactions</li>
                <li>All sub-account transactions</li>
              </ul>
            </div>
            <Button
              onClick={handlePause}
              disabled={isPending}
              variant="destructive"
              className="w-full"
            >
              {isPending ? 'Proposing to Safe...' : '⚠️ Pause Contract'}
            </Button>
          </div>
        )}

        {/* Unpause Button */}
        {isPaused && (
          <div className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-200">
                Unpausing will restore normal operations for all sub-accounts.
              </p>
            </div>
            <Button
              onClick={handleUnpause}
              disabled={isPending}
              variant="default"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isPending ? 'Proposing to Safe...' : '✓ Unpause Contract'}
            </Button>
          </div>
        )}

        {/* Success Message */}
        {successMessage && <p className="text-sm text-green-600 mt-2">✓ {successMessage}</p>}

        {/* Error Message */}
        {error && <p className="text-sm text-red-600 mt-2">✗ {String(error)}</p>}
      </CardContent>
    </Card>
  )
}
