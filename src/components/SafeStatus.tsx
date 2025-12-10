import { useAccount } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { OracleStatusIndicator } from '@/components/OracleStatusIndicator'
import { useIsSafeOwner, useSafeAddress } from '@/hooks/useSafe'

export function SafeStatus() {
  const { address, isConnected } = useAccount()
  const { data: safeAddress } = useSafeAddress()
  const { isSafeOwner, isLoading } = useIsSafeOwner()

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Safe Status</CardTitle>
          <CardDescription>Connect your wallet to view Safe status</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Safe Status</CardTitle>
          </div>
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800"
          >
            ACTIVE
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <OracleStatusIndicator />

        <div className="border-t my-4" />
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Safe Address</p>
            <p className="font-mono text-sm mt-1">
              {safeAddress && typeof safeAddress === 'string'
                ? `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}`
                : 'Loading...'}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Your Address</p>
            <p className="font-mono text-sm mt-1">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Permission Level</p>
            <div className="mt-1">
              {isLoading ? (
                <Badge variant="outline">Checking...</Badge>
              ) : isSafeOwner ? (
                <Badge>Safe Signer</Badge>
              ) : (
                <Badge variant="outline">Sub-Account / External</Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
