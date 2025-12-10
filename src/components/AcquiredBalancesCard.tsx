import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TooltipIcon } from '@/components/ui/tooltip'
import { useAcquiredBalances } from '@/hooks/useSafe'
import { formatTokenAmount } from '@/lib/utils'

interface AcquiredBalancesCardProps {
  address: `0x${string}`
}

// Common tokens to track on Base mainnet
const TOKENS_TO_TRACK = [
  { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, decimals: 6 },
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' as `0x${string}`, decimals: 18 },
  { symbol: 'USDT', address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`, decimals: 6 },
  { symbol: 'WBTC', address: '0x29f2D40B0605204364af54EC677bD022dA425d03' as `0x${string}`, decimals: 8 },
  { symbol: 'DAI', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb' as `0x${string}`, decimals: 18 },
]

export function AcquiredBalancesCard({ address }: AcquiredBalancesCardProps) {
  const tokenAddresses = TOKENS_TO_TRACK.map(t => t.address)
  const { data: balances = new Map(), isLoading } = useAcquiredBalances(address, tokenAddresses)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acquired Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  // Filter to only show tokens with balance > 0
  const tokensWithBalance = TOKENS_TO_TRACK.filter(
    token => (balances.get(token.address.toLowerCase()) || 0n) > 0n
  )

  // Don't render if no acquired balances
  if (tokensWithBalance.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Acquired Balances
          <TooltipIcon content="Tokens received from DeFi operations (swaps, deposits, claims) are FREE to use for 24 hours. They don't count against your spending allowance during this period." />
          <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            Free 24h ✨
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {tokensWithBalance.map(token => {
            const balance = balances.get(token.address.toLowerCase()) || 0n
            return (
              <div
                key={token.address}
                className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-900"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">Acquired</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatTokenAmount(balance, token.decimals)}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">No cost</p>
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-900">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 These tokens can be used in operations without affecting your spending limit for the next 24 hours.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
