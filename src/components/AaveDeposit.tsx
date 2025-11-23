import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, encodeFunctionData } from 'viem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI, AAVE_V3_POOL_ABI, ROLES } from '@/lib/contracts'
import { AAVE_PROTOCOL } from '@/lib/protocols'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useHasRole, useIsAddressAllowed, useSafeAddress } from '@/hooks/useSafe'

export function AaveDeposit() {
  const { address } = useAccount()
  const { addresses } = useContractAddresses()
  const { data: safeAddress } = useSafeAddress() // Fetch Safe address from contract
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [amount, setAmount] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const aavePool = AAVE_PROTOCOL.pools.find(p => p.address === selectedToken)

  // Check permissions
  const { data: hasExecuteRole } = useHasRole(address, ROLES.DEFI_EXECUTE_ROLE)
  const { data: isAaveAllowed } = useIsAddressAllowed(address, aavePool?.address)

  // Use wagmi's writeContract for direct contract calls
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const selectedPool = AAVE_PROTOCOL.pools.find(p => p.address === selectedToken)

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash) {
      setSuccessMessage(`Transaction successful! TX: ${hash}`)
      setAmount('')
    }
  }, [isSuccess, hash])

  // Handle transaction errors
  useEffect(() => {
    if (writeError) {
      setError(`Transaction failed: ${writeError.message}`)
    }
  }, [writeError])

  const handleApprove = () => {
    console.log(selectedToken, amount, addresses.defiInteractor, safeAddress)
    if (!selectedToken || !amount || !addresses.defiInteractor || !safeAddress) {
      setError('Please fill all fields and ensure contract is configured')
      return
    }

    try {
      setSuccessMessage(null)
      setError(null)

      const decimals = 6 // USDC/USDT decimals, adjust based on token
      const parsedAmount = parseUnits(amount, decimals)

      // Call approveProtocol directly on DeFi Interactor
      writeContract({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'approveProtocol',
        args: [
          aavePool?.tokenAddress as `0x${string}`,
          aavePool?.address as `0x${string}`,
          parsedAmount,
        ],
      })
    } catch (err) {
      console.error('Approval error:', err)
      setError(`Approval failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSupply = () => {
    console.log(selectedToken, amount, addresses.defiInteractor, safeAddress)
    if (!selectedToken || !amount || !addresses.defiInteractor || !safeAddress) {
      setError('Please fill all fields and ensure contract is configured')
      return
    }

    try {
      setSuccessMessage(null)
      setError(null)

      const decimals = 8 // USDC/USDT decimals, adjust based on token
      const parsedAmount = parseUnits(amount, decimals)

      // Encode the Aave supply call
      const supplyData = encodeFunctionData({
        abi: AAVE_V3_POOL_ABI,
        functionName: 'supply',
        args: [
          aavePool?.tokenAddress as `0x${string}`, // asset
          parsedAmount, // amount
          safeAddress, // onBehalfOf (Safe wallet)
          0, // referralCode
        ],
      })

      // Call executeOnProtocol directly on DeFi Interactor
      writeContract({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'executeOnProtocol',
        args: [aavePool?.address as `0x${string}`, supplyData],
      })
    } catch (err) {
      console.error('Supply error:', err)
      setError(`Supply failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Smart Contract - Aave Deposit</CardTitle>
          <CardDescription>Connect your wallet to test Aave deposits</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!hasExecuteRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Test Smart Contract - Aave Deposit</CardTitle>
          <CardDescription>Permission Required</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You need the Execute role to interact with Aave. Contact the Safe owner to grant you
            access.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Smart Contract - Aave Deposit</CardTitle>
        <CardDescription>Deposit tokens to Aave V3 through the DeFi Interactor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Permission Status */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Execute Role:</span>
              <Badge variant={hasExecuteRole ? 'secondary' : 'outline'}>
                {hasExecuteRole ? 'Granted' : 'Not Granted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Aave Pool Whitelisted:</span>
              <Badge variant={isAaveAllowed ? 'secondary' : 'outline'}>
                {isAaveAllowed ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          {!isAaveAllowed && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-900 dark:text-yellow-100">
                Aave Pool is not whitelisted. Ask the Safe owner to whitelist it first.
              </p>
            </div>
          )}

          {/* Aave Pool Info */}
          <div>
            <label className="text-sm font-medium">Aave V3 Pool</label>
            <p className="font-mono text-xs mt-1 text-muted-foreground break-all">
              {AAVE_PROTOCOL.contractAddress}
            </p>
          </div>

          {/* Token Selection */}
          <div>
            <label className="text-sm font-medium">Select Token</label>
            <select
              value={selectedToken}
              onChange={e => setSelectedToken(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
            >
              <option value="">Choose a token...</option>
              {AAVE_PROTOCOL.pools.map(pool => (
                <option
                  key={pool.id}
                  value={pool.address}
                >
                  {pool.name} ({pool.tokenName})
                </option>
              ))}
            </select>
            {selectedPool && (
              <p className="font-mono text-xs mt-1 text-muted-foreground break-all">
                {selectedPool.address}
              </p>
            )}
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium">Amount</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Amount of {selectedPool?.tokenName || 'tokens'} to deposit to Aave
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleApprove}
              disabled={isPending || isConfirming || !selectedToken || !amount || !isAaveAllowed}
              className="w-full"
              variant="outline"
            >
              {isPending || isConfirming ? 'Processing...' : '1. Approve Aave Pool'}
            </Button>

            <Button
              onClick={handleSupply}
              disabled={isPending || isConfirming || !selectedToken || !amount || !isAaveAllowed}
              className="w-full"
            >
              {isPending || isConfirming ? 'Processing...' : '2. Supply to Aave'}
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">How to use:</p>
            <ol className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1 list-decimal list-inside">
              <li>Select a token from the dropdown</li>
              <li>Enter the amount you want to deposit</li>
              <li>Click "Approve Aave Pool" to allow Aave to spend tokens</li>
              <li>Click "Supply to Aave" to deposit tokens and start earning interest</li>
            </ol>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-900 dark:text-green-100">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
