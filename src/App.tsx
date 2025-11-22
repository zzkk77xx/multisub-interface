import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract } from 'wagmi'
import { SafeStatus } from '@/components/SafeStatus'
import { SubAccountManager } from '@/components/SubAccountManager'
import { EmergencyControls } from '@/components/EmergencyControls'
import { MyPermissions } from '@/components/MyPermissions'
import { ContractSetup } from '@/components/ContractSetup'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { useContractAddresses } from '@/contexts/ContractAddressContext'

function App() {
  const { address: connectedAddress } = useAccount()
  const { addresses, isConfigured } = useContractAddresses()

  // Check if connected address is the Safe owner
  const { data: safeAddress } = useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'safe',
  })

  const isSafeOwner = connectedAddress && safeAddress &&
    connectedAddress.toLowerCase() === safeAddress.toLowerCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Morpho Smart Wallet
              </h1>
              <p className="text-muted-foreground mt-1">
                {isSafeOwner
                  ? 'Manage sub-accounts with delegated DeFi permissions'
                  : 'View your delegated DeFi permissions'}
              </p>
            </div>
            <ConnectButton />
          </div>

          {/* Main Content - Conditional Layout */}
          {!isConfigured ? (
            /* Setup Required */
            <div className="max-w-2xl mx-auto">
              <ContractSetup />
            </div>
          ) : isSafeOwner ? (
            /* Safe Owner View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Status and Emergency */}
              <div className="lg:col-span-1 space-y-6">
                <SafeStatus />
                <EmergencyControls />
                <ContractSetup />
              </div>

              {/* Right Column - Sub-Account Management */}
              <div className="lg:col-span-2">
                <SubAccountManager />
              </div>
            </div>
          ) : (
            /* Sub-Account / External View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Status */}
              <div className="lg:col-span-1 space-y-6">
                <SafeStatus />
                <ContractSetup />
              </div>

              {/* Right Column - My Permissions */}
              <div className="lg:col-span-2">
                <MyPermissions />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-6">
            <p>
              Secure self-custody DeFi wallet combining Safe multisig security with delegated permissions.
            </p>
            <p className="mt-1">
              Sub-accounts can execute operations within strict limits while Safe retains full control.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
