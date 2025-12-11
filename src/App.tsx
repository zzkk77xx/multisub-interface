import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SafeStatus } from '@/components/SafeStatus'
import { SubAccountManager } from '@/components/SubAccountManager'
import { EmergencyControls } from '@/components/EmergencyControls'
import { MyPermissions } from '@/components/MyPermissions'
import { ContractSetup } from '@/components/ContractSetup'
import { ThemeToggle } from '@/components/ThemeToggle'
import { WelcomeHero } from '@/components/WelcomeHero'
import { StatsBar } from '@/components/StatsBar'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useIsSafeOwner } from '@/hooks/useSafe'
import { useAccount } from 'wagmi'

function App() {
  const { isConfigured } = useContractAddresses()
  const { isSafeOwner } = useIsSafeOwner()
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen app-background">
      {/* Header */}
      <header className="top-0 z-50 sticky border-subtle border-b glass">
        <div className="flex justify-between items-center mx-auto px-6 h-16 container">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="MultiSub"
              className="w-9 h-9 object-contain"
            />
            <div>
              <h1 className="font-semibold text-primary text-lg leading-tight">MultiSub</h1>
              <p className="-mt-0.5 text-caption text-tertiary">
                {isSafeOwner ? 'Safe Owner' : 'DeFi Delegated'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isConnected ? (
              <ConnectButton
                accountStatus="address"
                chainStatus="icon"
                showBalance={false}
              />
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => {
                  const ready = mounted
                  if (!ready) return null

                  return (
                    <button
                      onClick={openConnectModal}
                      className="group inline-flex relative justify-center items-center bg-gradient-to-r shadow-glow hover:shadow-xl px-6 rounded-md h-10 overflow-hidden font-semibold text-black text-base hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 from-accent-primary to-accent-secondary"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform -translate-x-full group-hover:translate-x-full duration-700" />
                      <span className="z-10 relative">Connect Wallet</span>
                    </button>
                  )
                }}
              </ConnectButton.Custom>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-6 py-8 min-h-[calc(100dvh-130px)] container">
        {!isConnected ? (
          /* Welcome Screen */
          <WelcomeHero />
        ) : !isConfigured ? (
          /* Setup Required */
          <div className="mx-auto max-w-2xl animate-fade-in-up">
            <ContractSetup />
          </div>
        ) : isSafeOwner ? (
          /* Safe Owner View */
          <div className="animate-fade-in space-y-6">
            {/* Stats + Oracle en haut */}
            <StatsBar />

            {/* Main Content - Full width */}
            <SubAccountManager />

            {/* Secondary Row - 2 colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SafeStatus />
              <div className="space-y-4">
                <EmergencyControls />
                <ContractSetup />
              </div>
            </div>
          </div>
        ) : (
          /* Sub-Account / External View */
          <div className="animate-fade-in space-y-6">
            {/* Stats + Oracle en haut */}
            <StatsBar />

            {/* Main Content - Full width */}
            <MyPermissions />

            {/* Secondary Row - 2 colonnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SafeStatus />
              <ContractSetup />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-subtle border-t">
        <div className="mx-auto px-6 py-6 text-center container">
          <p className="text-caption text-tertiary">Secured by Safe • Built for DeFi</p>
        </div>
      </footer>
    </div>
  )
}

export default App
