import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSubAccountLimits } from '@/hooks/useSafe'
import { ROLES, ROLE_NAMES } from '@/lib/contracts'
import { useHasRole } from '@/hooks/useSafe'

export function SubAccountDashboard() {
  const { address } = useAccount()

  // Read limits using hook
  const { data: limits } = useSubAccountLimits(address)

  // Check roles
  const { data: hasExecuteRole } = useHasRole(address, ROLES.DEFI_EXECUTE_ROLE)
  const { data: hasTransferRole } = useHasRole(address, ROLES.DEFI_TRANSFER_ROLE)

  if (!address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Sub-Account</CardTitle>
          <CardDescription>Connect your wallet to view your sub-account details</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!hasExecuteRole && !hasTransferRole) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Sub-Account</CardTitle>
          <CardDescription>No roles assigned</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This address does not have any roles assigned. Contact the Safe owner to request access.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!limits) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Sub-Account</CardTitle>
          <CardDescription>Loading limits...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const [maxLossBps, maxTransferBps, windowDuration] = limits

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Sub-Account</CardTitle>
          <CardDescription>Your roles and limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Roles */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg">
              <p className="text-sm font-medium mb-2">Active Roles</p>
              <div className="flex gap-2">
                {hasExecuteRole && (
                  <Badge variant="secondary">{ROLE_NAMES[ROLES.DEFI_EXECUTE_ROLE]}</Badge>
                )}
                {hasTransferRole && (
                  <Badge variant="secondary">{ROLE_NAMES[ROLES.DEFI_TRANSFER_ROLE]}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Window Duration: {(Number(windowDuration) / 3600).toFixed(0)} hours
              </p>
            </div>

            {/* Transfer Limit */}
            {hasTransferRole && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Transfer Limit</p>
                  <Badge variant="secondary" className="text-xs">
                    {(Number(maxTransferBps) / 100).toFixed(2)}% of portfolio
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Maximum percentage of portfolio value that can be transferred within the time window
                </p>
              </div>
            )}

            {/* Max Loss Tolerance */}
            {hasExecuteRole && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Maximum DeFi Allowance</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                      Protocol executions blocked if portfolio loss exceeds this limit
                    </p>
                  </div>
                  <Badge variant="destructive">
                    {(Number(maxLossBps) / 100).toFixed(2)}%
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
