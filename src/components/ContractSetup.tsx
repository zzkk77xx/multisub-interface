import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { isAddress } from 'viem'

export function ContractSetup() {
  const { addresses, setDefiInteractor, isConfigured } = useContractAddresses()
  const [defiInteractorInput, setDefiInteractorInput] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!isAddress(defiInteractorInput)) {
      setError('Invalid Ethereum address')
      return
    }

    setError('')
    setDefiInteractor(defiInteractorInput as `0x${string}`)
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
            <Badge variant="secondary" className="bg-green-100 text-green-800">
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
        <CardTitle>Setup Required</CardTitle>
        <CardDescription>
          Enter the DeFi Interactor contract address to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">What is this?</p>
            <p className="text-xs text-blue-700 mt-1">
              The DeFi Interactor is the smart contract that manages sub-account permissions
              and DeFi interactions. You can find this address from your Safe deployment or
              share it via URL.
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

          <Button
            onClick={handleSubmit}
            disabled={!defiInteractorInput}
            className="w-full"
          >
            Connect to Contract
          </Button>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              You can also share a direct link with the contract address:
              <br />
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                ?defiInteractor=0x...
              </code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
