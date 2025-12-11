import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { isAddress } from 'viem'

type OnboardingStep = 'welcome' | 'connect-wallet' | 'enter-contract'

export function ContractSetup() {
  const { addresses, setDefiInteractor, isConfigured } = useContractAddresses()
  const [defiInteractorInput, setDefiInteractorInput] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<OnboardingStep>('welcome')

  const handleSubmit = () => {
    if (!isAddress(defiInteractorInput)) {
      setError('Invalid Ethereum address')
      return
    }

    setError('')
    setDefiInteractor(defiInteractorInput)
    setDefiInteractorInput('')
  }

  const handleClear = () => {
    localStorage.removeItem('defiInteractor')
    localStorage.removeItem('safe')
    window.location.href = window.location.pathname
  }

  const copyShareableLink = () => {
    if (!addresses.defiInteractor) return

    const params = new URLSearchParams()
    params.set('defiInteractor', addresses.defiInteractor)
    const url = `${window.location.origin}${window.location.pathname}?${params}`

    navigator.clipboard.writeText(url)
    alert('Shareable link copied to clipboard!')
  }

  if (isConfigured && addresses.defiInteractor) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Contract Config</CardTitle>
            <Badge variant="success">Configured</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-elevated-2 border border-subtle">
              <p className="text-caption text-tertiary uppercase tracking-wider mb-1">
                DeFi Interactor
              </p>
              <p className="font-mono text-small text-primary break-all">
                {addresses.defiInteractor.slice(0, 10)}...{addresses.defiInteractor.slice(-8)}
              </p>
            </div>

            {addresses.safe && (
              <div className="p-3 rounded-lg bg-elevated-2 border border-subtle">
                <p className="text-caption text-tertiary uppercase tracking-wider mb-1">
                  Safe Address
                </p>
                <p className="font-mono text-small text-primary break-all">
                  {addresses.safe.slice(0, 10)}...{addresses.safe.slice(-8)}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={copyShareableLink} className="flex-1">
                Share Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
                Change
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card variant="featured">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Getting Started</CardTitle>
          <div className="flex gap-2">
            {(['welcome', 'connect-wallet', 'enter-contract'] as const).map((s, idx) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  s === step
                    ? 'bg-gradient-to-r from-accent-primary to-accent-secondary text-black'
                    : ['welcome', 'connect-wallet', 'enter-contract'].indexOf(step) > idx
                    ? 'bg-success text-black'
                    : 'bg-elevated-2 text-tertiary'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
        <CardDescription>
          {step === 'welcome' && 'Welcome to MultiSub'}
          {step === 'connect-wallet' && 'Step 1: Connect your wallet'}
          {step === 'enter-contract' && 'Step 2: Configure your contract'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {step === 'welcome' && (
            <>
              <div className="p-4 rounded-xl bg-gradient-to-br from-info-muted to-success-muted border border-info/20">
                <h3 className="text-h3 text-primary mb-2">
                  Secure DeFi with Sub-Accounts
                </h3>
                <p className="text-small text-secondary">
                  MultiSub combines Safe multisig security with delegated permissions. Create sub-accounts
                  that can execute DeFi operations within strict limits while your Safe retains full control.
                </p>
              </div>

              <div className="space-y-3">
                <FeatureItem
                  icon="🔒"
                  title="Enhanced Security"
                  description="Your Safe multisig remains in full control"
                />
                <FeatureItem
                  icon="⚡"
                  title="Delegated Permissions"
                  description="Grant limited DeFi access to sub-accounts"
                />
                <FeatureItem
                  icon="📊"
                  title="Spending Limits"
                  description="Set strict percentage-based limits and time windows"
                />
              </div>

              <Button onClick={() => setStep('connect-wallet')} className="w-full">
                Get Started
              </Button>
            </>
          )}

          {step === 'connect-wallet' && (
            <>
              <div className="p-4 rounded-xl bg-info-muted border border-info/20">
                <p className="text-small font-medium text-primary mb-2">
                  Connect Your Wallet
                </p>
                <p className="text-caption text-secondary">
                  Click the "Connect Wallet" button in the top right to connect your wallet.
                  You'll need to be a Safe owner to manage sub-accounts.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('welcome')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep('enter-contract')} className="flex-1">
                  Next
                </Button>
              </div>
            </>
          )}

          {step === 'enter-contract' && (
            <>
              <div className="p-4 rounded-xl bg-info-muted border border-info/20">
                <p className="text-small font-medium text-primary mb-2">
                  Configure Contract Address
                </p>
                <p className="text-caption text-secondary">
                  Enter the DeFi Interactor contract address from your Safe deployment.
                </p>
              </div>

              <div>
                <label className="text-small font-medium text-primary mb-2 block">
                  DeFi Interactor Address
                </label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={defiInteractorInput}
                  onChange={(e) => {
                    setDefiInteractorInput(e.target.value)
                    setError('')
                  }}
                />
                {error && (
                  <p className="text-small text-error mt-2">{error}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('connect-wallet')} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!defiInteractorInput}
                  className="flex-1"
                >
                  Connect
                </Button>
              </div>

              <div className="pt-3 border-t border-subtle">
                <p className="text-caption text-tertiary">
                  You can also share a direct link:
                  <code className="text-caption bg-elevated-2 px-1.5 py-0.5 rounded ml-1">
                    ?defiInteractor=0x...
                  </code>
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-success-muted flex items-center justify-center flex-shrink-0">
        <span>{icon}</span>
      </div>
      <div>
        <p className="text-small font-medium text-primary">{title}</p>
        <p className="text-caption text-tertiary">{description}</p>
      </div>
    </div>
  )
}
