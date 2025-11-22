import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CONTRACT_ADDRESSES, DEFI_INTERACTOR_ABI, ROLES, ROLE_NAMES, ROLE_DESCRIPTIONS } from '@/lib/contracts'
import { PROTOCOLS } from '@/lib/protocols'
import { SubAccountDashboard } from '@/components/SubAccountDashboard'

export function MyPermissions() {
  const { address, isConnected } = useAccount()
  const [showProtocols, setShowProtocols] = useState(false)

  // Check which roles the connected address has
  const { data: hasDepositRole } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'hasRole',
    args: address ? [address, ROLES.DEFI_DEPOSIT_ROLE] : undefined,
  })

  const { data: hasWithdrawRole } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'hasRole',
    args: address ? [address, ROLES.DEFI_WITHDRAW_ROLE] : undefined,
  })

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Permissions</CardTitle>
          <CardDescription>Connect wallet to view your permissions</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const hasAnyRole = hasDepositRole || hasWithdrawRole

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Permissions</CardTitle>
          <CardDescription>
            Your current roles and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Active Roles</p>
              {hasAnyRole ? (
                <div className="flex flex-wrap gap-2">
                  {hasDepositRole && (
                    <Badge className="bg-blue-100 text-blue-800">
                      {ROLE_NAMES[ROLES.DEFI_DEPOSIT_ROLE]}
                    </Badge>
                  )}
                  {hasWithdrawRole && (
                    <Badge className="bg-purple-100 text-purple-800">
                      {ROLE_NAMES[ROLES.DEFI_WITHDRAW_ROLE]}
                    </Badge>
                  )}
                </div>
              ) : (
                <Badge variant="outline">No Roles</Badge>
              )}
            </div>

            {hasAnyRole && (
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium">Capabilities</p>

                {hasDepositRole && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {ROLE_NAMES[ROLES.DEFI_DEPOSIT_ROLE]} Role
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      {ROLE_DESCRIPTIONS[ROLES.DEFI_DEPOSIT_ROLE]}
                    </p>
                  </div>
                )}

                {hasWithdrawRole && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-900">
                      {ROLE_NAMES[ROLES.DEFI_WITHDRAW_ROLE]} Role
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      {ROLE_DESCRIPTIONS[ROLES.DEFI_WITHDRAW_ROLE]}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProtocols(!showProtocols)}
                    className="w-full"
                  >
                    {showProtocols ? 'Hide' : 'Show'} Allowed Protocols
                  </Button>

                  {showProtocols && address && (
                    <div className="mt-3 space-y-2">
                      {PROTOCOLS.map((protocol) => (
                        <ProtocolAccess
                          key={protocol.id}
                          protocol={protocol}
                          subAccount={address}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!hasAnyRole && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  You don't have any roles yet. A Safe owner needs to grant you permissions before
                  you can execute DeFi operations.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {hasAnyRole && <SubAccountDashboard />}
    </div>
  )
}

interface ProtocolAccessProps {
  protocol: {
    id: string
    name: string
    contractAddress: `0x${string}`
    pools: Array<{ id: string; name: string; address: `0x${string}`; token: string }>
  }
  subAccount: `0x${string}`
}

function ProtocolAccess({ protocol, subAccount }: ProtocolAccessProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if protocol contract is allowed
  const { data: protocolAllowed } = useReadContract({
    address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'allowedAddresses',
    args: [subAccount, protocol.contractAddress],
  })

  // Count allowed pools
  const poolChecks = protocol.pools.map(pool => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: isAllowed } = useReadContract({
      address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
      abi: DEFI_INTERACTOR_ABI,
      functionName: 'allowedAddresses',
      args: [subAccount, pool.address],
    })
    return { pool, isAllowed }
  })

  const allowedPools = poolChecks.filter(p => p.isAllowed).length
  const hasAccess = protocolAllowed || allowedPools > 0

  if (!hasAccess) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-2 bg-muted/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {protocol.name}
          </Badge>
          {allowedPools > 0 && (
            <span className="text-xs text-muted-foreground">
              {allowedPools} pool{allowedPools !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-xs">{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div className="p-2 space-y-1 bg-background">
          {poolChecks.map(({ pool, isAllowed }) =>
            isAllowed ? (
              <div key={pool.id} className="flex items-center justify-between text-xs p-1">
                <span>{pool.name}</span>
                <Badge variant="outline" className="text-xs">
                  {pool.token}
                </Badge>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  )
}
