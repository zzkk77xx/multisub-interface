import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useIsSafeOwner } from '@/hooks/useSafe'

export function EmergencyControls() {
  const { isSafeOwner } = useIsSafeOwner()

  if (!isSafeOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emergency Controls</CardTitle>
          <CardDescription>Only Safe owners can access emergency controls</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-small text-tertiary">
            Connect with a Safe owner address to access emergency controls.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Emergency Controls</CardTitle>
          <Badge variant="warning">Owner Only</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="p-4 rounded-xl bg-warning-muted border border-warning/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
              <span className="text-warning">⚠️</span>
            </div>
            <div>
              <p className="text-small font-medium text-primary">
                Emergency Actions
              </p>
              <p className="text-caption text-tertiary mt-1">
                Emergency controls for Safe owners to manage critical operations will be available here.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
