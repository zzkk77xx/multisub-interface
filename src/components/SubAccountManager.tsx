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

      const transactions = rolesToGrant.map(roleId => ({
        to: addresses.defiInteractor,
        data: encodeContractCall(addresses.defiInteractor, DEFI_INTERACTOR_ABI, 'grantRole', [
          newSubAccount,
          roleId,
        ]),
      }))

      const result = await proposeTransaction(
        transactions.length === 1 ? transactions[0] : transactions
      )

      if (result.success) {
        refetch()
        setNewSubAccount('')
        setGrantExecute(false)
        setGrantTransfer(false)
        setSuccessMessage(`Transaction executed successfully!`)
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
        refetch()
        setSuccessMessage(`Role revoked successfully!`)
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
          <p className="text-small text-tertiary">
            Connect with a Safe owner address to create and manage sub-accounts.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
      {/* Add Sub-Account Form - 2 cols */}
      <div className="xl:col-span-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Add Sub-Account</CardTitle>
            <CardDescription>Grant DeFi permissions to an address</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium text-primary text-small">
                  Wallet Address
                </label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={newSubAccount}
                  onChange={e => setNewSubAccount(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="block font-medium text-primary text-small">Roles</label>
                <div className="space-y-3 bg-elevated-2 p-3 border border-subtle rounded-xl">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="execute-role"
                      checked={grantExecute}
                      onChange={e => setGrantExecute((e.target as HTMLInputElement).checked)}
                    />
                    <div className="flex-1">
                      <label htmlFor="execute-role" className="font-medium text-primary text-small cursor-pointer">
                        {ROLE_NAMES[ROLES.DEFI_EXECUTE_ROLE]}
                      </label>
                      <p className="mt-0.5 text-caption text-tertiary">
                        {ROLE_DESCRIPTIONS[ROLES.DEFI_EXECUTE_ROLE]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="transfer-role"
                      checked={grantTransfer}
                      onChange={e => setGrantTransfer((e.target as HTMLInputElement).checked)}
                    />
                    <div className="flex-1">
                      <label htmlFor="transfer-role" className="font-medium text-primary text-small cursor-pointer">
                        {ROLE_NAMES[ROLES.DEFI_TRANSFER_ROLE]}
                      </label>
                      <p className="mt-0.5 text-caption text-tertiary">
                        {ROLE_DESCRIPTIONS[ROLES.DEFI_TRANSFER_ROLE]}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddSubAccount}
                disabled={isPending || !newSubAccount}
                className="w-full"
              >
                {isPending ? 'Proposing...' : 'Add Sub-Account'}
              </Button>

              {successMessage && (
                <div className="bg-success-muted p-3 border border-success/20 rounded-lg">
                  <p className="text-small text-success">{successMessage}</p>
                </div>
              )}

              {error && (
                <div className="bg-error-muted p-3 border border-error/20 rounded-lg">
                  <p className="text-error text-small">{error}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sub-Accounts List - 3 cols */}
      <div className="xl:col-span-3">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Managed Sub-Accounts</CardTitle>
                <CardDescription>View and manage permissions</CardDescription>
              </div>
              <Badge variant="outline">{managedAccounts.length} accounts</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAccounts ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3 border-2 border-accent-primary border-t-transparent rounded-full w-8 h-8 animate-spin" />
                <p className="text-small text-tertiary">Loading accounts...</p>
              </div>
            ) : managedAccounts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="flex justify-center items-center bg-elevated-2 mx-auto mb-3 rounded-full w-12 h-12">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-small text-tertiary">
                  No sub-accounts yet. Add one to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {managedAccounts.map((account, index) => (
                  <SubAccountRow
                    key={account.address}
                    account={account.address}
                    onRevokeRole={handleRevokeRole}
                    isRevoking={isPending}
                    index={index}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface SubAccountRowProps {
  account: `0x${string}`
  onRevokeRole: (account: `0x${string}`, roleId: number) => Promise<void>
  isRevoking: boolean
  index: number
}

function SubAccountRow({ account, onRevokeRole, isRevoking, index }: SubAccountRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: hasExecuteRole } = useHasRole(account, ROLES.DEFI_EXECUTE_ROLE)
  const { data: hasTransferRole } = useHasRole(account, ROLES.DEFI_TRANSFER_ROLE)

  return (
    <div
      className="border border-subtle rounded-xl overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex justify-between items-center bg-elevated hover:bg-elevated-2 p-4 transition-colors">
        <div className="flex-1 min-w-0">
          <p className="font-mono font-medium text-primary text-small truncate">
            {account.slice(0, 6)}...{account.slice(-4)}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {hasExecuteRole && <Badge variant="info">{ROLE_NAMES[ROLES.DEFI_EXECUTE_ROLE]}</Badge>}
            {hasTransferRole && (
              <Badge variant="success">{ROLE_NAMES[ROLES.DEFI_TRANSFER_ROLE]}</Badge>
            )}
            {!hasExecuteRole && !hasTransferRole && <Badge variant="outline">No Roles</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Hide' : 'Configure'}
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
        <div className="bg-elevated-2 p-4 border-subtle border-t">
          <div className="gap-4 grid grid-cols-1 lg:grid-cols-2">
            <SpendingLimits subAccountAddress={account} />
            <ProtocolPermissions subAccountAddress={account} />
          </div>
        </div>
      )}
    </div>
  )
}
