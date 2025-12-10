import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI, ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS } from '@/lib/contracts'
import { ProtocolPermissions } from '@/components/ProtocolPermissions'
import { SpendingLimits } from '@/components/SpendingLimits'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useIsSafeOwner, useHasRole, useManagedAccounts } from '@/hooks/useSafe'
import { useSafeProposal, encodeContractCall } from '@/hooks/useSafeProposal'
import { isAddress } from 'viem'

export function SubAccountManager() {
  const { addresses } = useContractAddresses()
  const { isSafeOwner } = useIsSafeOwner()
  const [newSubAccount, setNewSubAccount] = useState('')
  const [grantExecute, setGrantExecute] = useState(false)
  const [grantTransfer, setGrantTransfer] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch managed accounts from contract
  const { data: managedAccounts = [], isLoading: isLoadingAccounts, refetch } = useManagedAccounts()

  // Use Safe proposal hook
  const { proposeTransaction, isPending, error } = useSafeProposal()

  const handleAddSubAccount = async () => {
    if (!isAddress(newSubAccount)) {
      alert('Invalid Ethereum address')
      return
    }

    if (!grantExecute && !grantTransfer) {
      alert('Please select at least one role to grant')
      return
    }

    if (!addresses.defiInteractor) {
      alert('DeFi Interactor address not configured')
      return
    }

    try {
      setSuccessMessage(null)

      const rolesToGrant: number[] = []
      if (grantExecute) rolesToGrant.push(ROLES.DEFI_EXECUTE_ROLE)
      if (grantTransfer) rolesToGrant.push(ROLES.DEFI_TRANSFER_ROLE)

      // Create an array of transactions to batch them
      const transactions = rolesToGrant.map(roleId => ({
        to: addresses.defiInteractor,
        data: encodeContractCall(
          addresses.defiInteractor,
          DEFI_INTERACTOR_ABI,
          'grantRole',
          [newSubAccount, roleId]
        ),
      }))

      // Propose transactions to the Safe (batched if multiple)
      const result = await proposeTransaction(transactions.length === 1 ? transactions[0] : transactions)

      if (result.success) {
        // Refresh the managed accounts list from contract
        refetch()

        // Reset form
        setNewSubAccount('')
        setGrantExecute(false)
        setGrantTransfer(false)

        setSuccessMessage(`Transaction executed successfully! Hash: ${result.transactionHash}`)
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing role grant:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose transaction. ${errorMsg}`)
    }
  }

  const handleRevokeRole = async (account: `0x${string}`, roleId: number) => {
    if (!addresses.defiInteractor) return

    try {
      setSuccessMessage(null)

      const data = encodeContractCall(addresses.defiInteractor, DEFI_INTERACTOR_ABI, 'revokeRole', [
        account,
        roleId,
      ])

      const result = await proposeTransaction({
        to: addresses.defiInteractor,
        data,
      })

      if (result.success) {
        // Refresh the managed accounts list from contract
        refetch()

        setSuccessMessage(
          `Role revoked successfully! Transaction hash: ${result.transactionHash}`
        )
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing role revoke:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose transaction. ${errorMsg}`)
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
          <CardDescription>Grant DeFi permissions to an Ethereum address</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Address</label>
              <Input
                type="text"
                placeholder="0x..."
                value={newSubAccount}
                onChange={e => setNewSubAccount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Roles to Grant</label>

              <div className="space-y-2">
                <Checkbox
                  id="execute-role"
                  checked={grantExecute}
                  onChange={e => setGrantExecute((e.target as HTMLInputElement).checked)}
                  label={ROLE_NAMES[ROLES.DEFI_EXECUTE_ROLE]}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  {ROLE_DESCRIPTIONS[ROLES.DEFI_EXECUTE_ROLE]}
                </p>
              </div>

              <div className="space-y-2">
                <Checkbox
                  id="transfer-role"
                  checked={grantTransfer}
                  onChange={e => setGrantTransfer((e.target as HTMLInputElement).checked)}
                  label={ROLE_NAMES[ROLES.DEFI_TRANSFER_ROLE]}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  {ROLE_DESCRIPTIONS[ROLES.DEFI_TRANSFER_ROLE]}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddSubAccount}
              disabled={isPending || !newSubAccount}
              className="w-full"
            >
              {isPending ? 'Proposing to Safe...' : 'Propose Sub-Account'}
            </Button>

            {successMessage && <p className="text-sm text-green-600">✓ {successMessage}</p>}

            {error && <p className="text-sm text-red-600">✗ {error}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Sub-Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Managed Sub-Accounts</CardTitle>
          <CardDescription>View and manage existing sub-accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAccounts ? (
            <p className="text-sm text-muted-foreground">Loading managed accounts...</p>
          ) : managedAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sub-accounts found. Add one above to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {managedAccounts.map(account => (
                <SubAccountRow
                  key={account.address}
                  account={account.address}
                  onRevokeRole={handleRevokeRole}
                  isRevoking={isPending}
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
  onRevokeRole: (account: `0x${string}`, roleId: number) => Promise<void>
  isRevoking: boolean
}

function SubAccountRow({ account, onRevokeRole, isRevoking }: SubAccountRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check which roles the account has
  const { data: hasExecuteRole } = useHasRole(account, ROLES.DEFI_EXECUTE_ROLE)
  const { data: hasTransferRole } = useHasRole(account, ROLES.DEFI_TRANSFER_ROLE)

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-muted/30">
        <div className="flex-1">
          <p className="font-mono text-sm font-medium">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <div className="flex gap-2 mt-2">
            {hasExecuteRole && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {ROLE_NAMES[ROLES.DEFI_EXECUTE_ROLE]}
              </Badge>
            )}
            {hasTransferRole && (
              <Badge
                variant="secondary"
                className="text-xs"
              >
                {ROLE_NAMES[ROLES.DEFI_TRANSFER_ROLE]}
              </Badge>
            )}
            {!hasExecuteRole && !hasTransferRole && (
              <Badge
                variant="outline"
                className="text-xs"
              >
                No Roles
              </Badge>
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
          {hasExecuteRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevokeRole(account, ROLES.DEFI_EXECUTE_ROLE)}
              disabled={isRevoking}
            >
              Revoke Execute
            </Button>
          )}
          {hasTransferRole && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRevokeRole(account, ROLES.DEFI_TRANSFER_ROLE)}
              disabled={isRevoking}
            >
              Revoke Transfer
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
