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
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contract Configuration</CardTitle>
              <CardDescription>Currently connected contracts</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Configured
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">DeFi Interactor Contract</p>
              <p className="font-mono text-sm mt-1 break-all">
                {addresses.defiInteractor}
              </p>
            </div>

            {addresses.safe && (
              <div>
                <p className="text-sm text-muted-foreground">Safe Address</p>
                <p className="font-mono text-sm mt-1 break-all">
                  {addresses.safe}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={copyShareableLink}>
                Copy Shareable Link
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                Change Contracts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle>Getting Started</CardTitle>
          <div className="flex gap-2">
            {(['welcome', 'connect-wallet', 'enter-contract'] as const).map((s, idx) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s === step
                    ? 'bg-primary text-primary-foreground'
                    : ['welcome', 'connect-wallet', 'enter-contract'].indexOf(step) > idx
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
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
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Secure DeFi with Sub-Accounts
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  MultiSub combines Safe multisig security with delegated permissions. Create sub-accounts
                  that can execute DeFi operations within strict limits while your Safe retains full control.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-medium">Enhanced Security</p>
                    <p className="text-xs text-muted-foreground">Your Safe multisig remains in full control</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delegated Permissions</p>
                    <p className="text-xs text-muted-foreground">Grant limited DeFi access to sub-accounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm font-medium">Spending Limits</p>
                    <p className="text-xs text-muted-foreground">Set strict percentage-based limits and time windows</p>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep('connect-wallet')} className="w-full">
                Get Started
              </Button>
            </>
          )}

          {step === 'connect-wallet' && (
            <>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Connect Your Wallet
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
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
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Configure Contract Address
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Enter the DeFi Interactor contract address from your Safe deployment.
                  This contract manages sub-account permissions and DeFi interactions.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">DeFi Interactor Address</label>
                <Input
                  type="text"
                  placeholder="0x..."
                  value={defiInteractorInput}
                  onChange={(e) => {
                    setDefiInteractorInput(e.target.value)
                    setError('')
                  }}
                  className="mt-1"
                />
                {error && (
                  <p className="text-sm text-red-600 mt-1">{error}</p>
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
                  Connect to Contract
                </Button>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  You can also share a direct link with the contract address:
                  <br />
                  <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
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
