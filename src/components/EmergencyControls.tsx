import { useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { useContractAddresses } from '@/contexts/ContractAddressContext'

export function EmergencyControls() {
  const { address: connectedAddress } = useAccount()
  const { addresses } = useContractAddresses()

  // Read Safe address and pause status
  const { data: safeAddress } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'safe',
  })

  const { data: isPaused, refetch: refetchPauseStatus } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'paused',
  })

  const isSafeOwner = connectedAddress && safeAddress &&
    connectedAddress.toLowerCase() === safeAddress.toLowerCase()

  // Pause contract
  const { writeContract: pause, data: pauseHash, isPending: isPausePending } = useWriteContract()
  const { isLoading: isPauseConfirming, isSuccess: isPauseSuccess } = useWaitForTransactionReceipt({
    hash: pauseHash,
  })

  // Unpause contract
  const { writeContract: unpause, data: unpauseHash, isPending: isUnpausePending } = useWriteContract()
  const { isLoading: isUnpauseConfirming, isSuccess: isUnpauseSuccess } = useWaitForTransactionReceipt({
    hash: unpauseHash,
  })

  // Refetch pause status when transactions succeed
  useEffect(() => {
    if (isPauseSuccess || isUnpauseSuccess) {
      refetchPauseStatus()
    }
  }, [isPauseSuccess, isUnpauseSuccess, refetchPauseStatus])

  const handlePause = () => {
    if (!addresses.defiInteractor) return

    try {
      pause({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'pause',
      })
    } catch (error) {
      console.error('Error pausing contract:', error)
      alert('Failed to pause. Make sure you are a Safe owner and have signed the transaction.')
    }
  }

  const handleUnpause = () => {
    if (!addresses.defiInteractor) return

    try {
      unpause({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'unpause',
      })
    } catch (error) {
      console.error('Error unpausing contract:', error)
      alert('Failed to unpause. Make sure you are a Safe owner and have signed the transaction.')
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
            Connect with a Safe owner address to access pause/unpause controls.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emergency Controls</CardTitle>
        <CardDescription>
          Pause or unpause all DeFi operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Current Status</p>
            <p className="text-2xl font-bold">
              {isPaused ? (
                <span className="text-destructive">PAUSED ⏸</span>
              ) : (
                <span className="text-green-600">ACTIVE ✓</span>
              )}
            </p>
          </div>

          {isPaused ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                The system is currently paused. All deposit and withdrawal operations are blocked.
                Click below to resume normal operations.
              </p>
              <Button
                variant="default"
                onClick={handleUnpause}
                disabled={isUnpausePending || isUnpauseConfirming}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUnpausePending || isUnpauseConfirming ? 'Unpausing...' : 'Unpause System'}
              </Button>
              {isUnpauseSuccess && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ System unpaused successfully!
                </p>
              )}
            </div>
          ) : (
            <div>
              <div className="p-3 bg-destructive/10 rounded-lg mb-3">
                <p className="text-sm text-destructive font-semibold mb-1">
                  ⚠️ Warning: Emergency Pause
                </p>
                <p className="text-xs text-muted-foreground">
                  Pausing will immediately stop all sub-account operations (deposits and withdrawals).
                  Use this in case of:
                </p>
                <ul className="text-xs text-muted-foreground mt-2 ml-4 space-y-1">
                  <li>• Suspected sub-account compromise</li>
                  <li>• Unusual or suspicious activity detected</li>
                  <li>• Emergency security response needed</li>
                </ul>
              </div>
              <Button
                variant="destructive"
                onClick={handlePause}
                disabled={isPausePending || isPauseConfirming}
                className="w-full"
              >
                {isPausePending || isPauseConfirming ? 'Pausing...' : 'Emergency Pause'}
              </Button>
              {isPauseSuccess && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ System paused successfully!
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded">
            <p className="font-medium mb-1">Note:</p>
            <p>
              These controls require Safe multisig signatures. Depending on your Safe's threshold,
              you may need multiple owners to approve the transaction.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
