import { SafeProvider, createConfig } from '@safe-global/safe-react-hooks'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { useSafeAddress } from '@/hooks/useSafe'
import { useMemo } from 'react'
// import { createEip1193Provider } from '@/lib/viemToEip1193'
import 'viem/window';

export function SafeContextProvider({ children }: { children: React.ReactNode }) {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const { chain } = useAccount()
  const { data: safeAddress } = useSafeAddress()

  const safeConfig = useMemo(() => {
    // Only create config when we have all required data
    if (!safeAddress || !walletClient || !publicClient || !chain) {
      return null
    }

    try {
      // Create clean EIP1193 provider from viem publicClient (no circular refs)
      const provider = (publicClient)

      const config = createConfig({
        chain,
        safeAddress: safeAddress as string,
        provider: provider,
        signer: walletClient.account.address,
      })

      return config
    } catch (error) {
      console.error('Failed to create Safe config:', error)
      return null
    }
  }, [safeAddress, walletClient, publicClient, chain])

  // Always render SafeProvider if we have a config, otherwise just render children
  // Components using Safe hooks should check if wallet is connected first
  if (!safeConfig) {
    return <>{children}</>
  }

  return (
    <SafeProvider config={safeConfig}>
      {children}
    </SafeProvider>
  )
}
