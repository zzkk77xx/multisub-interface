import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI, ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS } from '@/lib/contracts'
import { ProtocolPermissions } from '@/components/ProtocolPermissions'
import { SpendingLimits } from '@/components/SpendingLimits'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { isAddress } from 'viem'

export function SubAccountManager() {
  const { address: connectedAddress } = useAccount()
  const { addresses } = useContractAddresses()
  const [newSubAccount, setNewSubAccount] = useState('')
  const [grantDeposit, setGrantDeposit] = useState(false)
  const [grantWithdraw, setGrantWithdraw] = useState(false)
  const [managedAccounts, setManagedAccounts] = useState<Set<`0x${string}`>>(new Set())

  // Read Safe address to check if user is owner
  const { data: safeAddress } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'safe',
  })

  const isSafeOwner = connectedAddress && safeAddress &&
    connectedAddress.toLowerCase() === safeAddress.toLowerCase()

  // Write contracts
  const { writeContract: grantRole, data: grantHash, isPending: isGrantPending } = useWriteContract()
  const { isLoading: isGrantConfirming, isSuccess: isGrantSuccess } = useWaitForTransactionReceipt({
    hash: grantHash,
  })

  const { writeContract: revokeRole, data: revokeHash, isPending: isRevokePending } = useWriteContract()
  const { isLoading: isRevokeConfirming } = useWaitForTransactionReceipt({
    hash: revokeHash,
  })

  const handleAddSubAccount = async () => {
    if (!isAddress(newSubAccount)) {
      alert('Invalid Ethereum address')
      return
    }

    if (!grantDeposit && !grantWithdraw) {
      alert('Please select at least one role to grant')
      return
    }

    try {
      // Grant deposit role if selected
      if (grantDeposit && addresses.defiInteractor) {
        grantRole({
          address: addresses.defiInteractor,
          abi: DEFI_INTERACTOR_ABI,
          functionName: 'grantRole',
          args: [newSubAccount as `0x${string}`, ROLES.DEFI_DEPOSIT_ROLE],
        })
      }

      // Grant withdraw role if selected
      if (grantWithdraw && addresses.defiInteractor) {
        grantRole({
          address: addresses.defiInteractor,
          abi: DEFI_INTERACTOR_ABI,
          functionName: 'grantRole',
          args: [newSubAccount as `0x${string}`, ROLES.DEFI_WITHDRAW_ROLE],
        })
      }

      // Add to managed list
      setManagedAccounts(prev => new Set(prev).add(newSubAccount as `0x${string}`))

      // Reset form
      setNewSubAccount('')
      setGrantDeposit(false)
      setGrantWithdraw(false)
    } catch (error) {
      console.error('Error granting role:', error)
      alert('Failed to grant role. Make sure you are a Safe owner.')
    }
  }

  const handleRevokeRole = (account: `0x${string}`, roleId: number) => {
    if (!addresses.defiInteractor) return

    try {
      revokeRole({
        address: addresses.defiInteractor,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'revokeRole',
        args: [account, roleId],
      })
    } catch (error) {
      console.error('Error revoking role:', error)
      alert('Failed to revoke role. Make sure you are a Safe owner.')
    }
  }

  if (!isSafeOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sub-Account Management</CardTitle>
          <CardDescription>Only Safe owners can manage sub-accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect with a Safe owner address to create and manage sub-accounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add Sub-Account Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Sub-Account</CardTitle>
          <CardDescription>
            Grant DeFi permissions to an Ethereum address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                type="text"
                placeholder="0x..."
                value={newSubAccount}
                onChange={(e) => setNewSubAccount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Roles to Grant</label>

              <div className="space-y-2">
                <Checkbox
                  id="deposit-role"
                  checked={grantDeposit}
                  onChange={(e) => setGrantDeposit((e.target as HTMLInputElement).checked)}
                  label={ROLE_NAMES[ROLES.DEFI_DEPOSIT_ROLE]}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  {ROLE_DESCRIPTIONS[ROLES.DEFI_DEPOSIT_ROLE]}
                </p>
              </div>

              <div className="space-y-2">
                <Checkbox
                  id="withdraw-role"
                  checked={grantWithdraw}
                  onChange={(e) => setGrantWithdraw((e.target as HTMLInputElement).checked)}
                  label={ROLE_NAMES[ROLES.DEFI_WITHDRAW_ROLE]}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  {ROLE_DESCRIPTIONS[ROLES.DEFI_WITHDRAW_ROLE]}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddSubAccount}
              disabled={isGrantPending || isGrantConfirming || !newSubAccount}
              className="w-full"
            >
              {isGrantPending || isGrantConfirming ? 'Adding Sub-Account...' : 'Add Sub-Account'}
            </Button>

            {isGrantSuccess && (
              <p className="text-sm text-green-600">
                ✓ Sub-account added successfully!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Managed Sub-Accounts</CardTitle>
          <CardDescription>
            View and manage existing sub-accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {managedAccounts.size === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sub-accounts added yet. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {Array.from(managedAccounts).map((account) => (
                <SubAccountRow
                  key={account}
                  account={account}
                  onRevokeRole={handleRevokeRole}
                  isRevoking={isRevokePending || isRevokeConfirming}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface SubAccountRowProps {
  account: `0x${string}`
  onRevokeRole: (account: `0x${string}`, roleId: number) => void
  isRevoking: boolean
}

function SubAccountRow({ account, onRevokeRole, isRevoking }: SubAccountRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { addresses } = useContractAddresses()

  // Check which roles the account has
  const { data: hasDepositRole } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'hasRole',
    args: [account, ROLES.DEFI_DEPOSIT_ROLE],
  })

  const { data: hasWithdrawRole } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'hasRole',
    args: [account, ROLES.DEFI_WITHDRAW_ROLE],
  })

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <div className="flex-1">
          <p className="font-mono text-sm font-medium">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <div className="flex gap-2 mt-2">
            {hasDepositRole && (
              <Badge variant="secondary" className="text-xs">
                {ROLE_NAMES[ROLES.DEFI_DEPOSIT_ROLE]}
              </Badge>
            )}
            {hasWithdrawRole && (
              <Badge variant="secondary" className="text-xs">
                {ROLE_NAMES[ROLES.DEFI_WITHDRAW_ROLE]}
              </Badge>
            )}
            {!hasDepositRole && !hasWithdrawRole && (
              <Badge variant="outline" className="text-xs">No Roles</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide Config' : 'Configure'}
          </Button>
          {hasDepositRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevokeRole(account, ROLES.DEFI_DEPOSIT_ROLE)}
              disabled={isRevoking}
            >
              Revoke Deposit
            </Button>
          )}
          {hasWithdrawRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevokeRole(account, ROLES.DEFI_WITHDRAW_ROLE)}
              disabled={isRevoking}
            >
              Revoke Withdraw
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 border-t bg-background">
          <SpendingLimits subAccountAddress={account} />
          <ProtocolPermissions subAccountAddress={account} />
        </div>
      )}
    </div>
  )
}
