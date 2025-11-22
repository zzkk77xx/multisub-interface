import { useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { CONTRACT_ADDRESSES, DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { PROTOCOLS, Protocol, ProtocolPool } from '@/lib/protocols'

interface ProtocolPermissionsProps {
  subAccountAddress: `0x${string}`
}

export function ProtocolPermissions({ subAccountAddress }: ProtocolPermissionsProps) {
  const [selectedProtocols, setSelectedProtocols] = useState<Map<string, Set<string>>>(new Map())
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const toggleProtocol = (protocolId: string) => {
    const current = selectedProtocols.get(protocolId)
    if (current && current.size > 0) {
      // Deselect protocol and all pools
      const newMap = new Map(selectedProtocols)
      newMap.delete(protocolId)
      setSelectedProtocols(newMap)
    } else {
      // Expand to show pools
      setExpandedProtocol(expandedProtocol === protocolId ? null : protocolId)
    }
  }

  const togglePool = (protocolId: string, poolId: string) => {
    const newMap = new Map(selectedProtocols)
    const current = newMap.get(protocolId) || new Set<string>()

    if (current.has(poolId)) {
      current.delete(poolId)
      if (current.size === 0) {
        newMap.delete(protocolId)
      } else {
        newMap.set(protocolId, current)
      }
    } else {
      current.add(poolId)
      newMap.set(protocolId, current)
    }

    setSelectedProtocols(newMap)
  }

  const selectAllPools = (protocol: Protocol) => {
    const newMap = new Map(selectedProtocols)
    const allPoolIds = new Set(protocol.pools.map(p => p.id))
    newMap.set(protocol.id, allPoolIds)
    setSelectedProtocols(newMap)
  }

  const handleSavePermissions = async () => {
    // Collect all selected pool addresses
    const allowedAddresses: `0x${string}`[] = []

    selectedProtocols.forEach((poolIds, protocolId) => {
      const protocol = PROTOCOLS.find(p => p.id === protocolId)
      if (protocol) {
        // Add protocol contract address
        allowedAddresses.push(protocol.contractAddress)

        // Add selected pool addresses
        poolIds.forEach(poolId => {
          const pool = protocol.pools.find(p => p.id === poolId)
          if (pool) {
            allowedAddresses.push(pool.address)
          }
        })
      }
    })

    if (allowedAddresses.length === 0) {
      alert('Please select at least one protocol or pool')
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.DEFI_INTERACTOR,
        abi: DEFI_INTERACTOR_ABI,
        functionName: 'setAllowedAddresses',
        args: [subAccountAddress, allowedAddresses, true],
      })
    } catch (error) {
      console.error('Error setting allowed addresses:', error)
      alert('Failed to set protocol permissions')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Permissions</CardTitle>
        <CardDescription>
          Select which DeFi protocols and pools this sub-account can interact with
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {PROTOCOLS.map((protocol) => {
            const selectedPools = selectedProtocols.get(protocol.id)
            const hasSelectedPools = selectedPools && selectedPools.size > 0
            const isExpanded = expandedProtocol === protocol.id

            return (
              <div key={protocol.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={`protocol-${protocol.id}`}
                      checked={hasSelectedPools}
                      onChange={() => toggleProtocol(protocol.id)}
                      label=""
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{protocol.name}</p>
                        {hasSelectedPools && (
                          <Badge variant="secondary" className="text-xs">
                            {selectedPools.size} pool{selectedPools.size !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {protocol.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExpanded && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => selectAllPools(protocol)}
                      >
                        Select All
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="ml-8 mt-3 space-y-2 border-l-2 border-muted pl-4">
                    {protocol.pools.map((pool) => (
                      <PoolCheckbox
                        key={pool.id}
                        pool={pool}
                        checked={selectedPools?.has(pool.id) || false}
                        onToggle={() => togglePool(protocol.id, pool.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          <div className="pt-4 border-t">
            <Button
              onClick={handleSavePermissions}
              disabled={isPending || isConfirming || selectedProtocols.size === 0}
              className="w-full"
            >
              {isPending || isConfirming ? 'Saving Permissions...' : 'Save Protocol Permissions'}
            </Button>

            {isSuccess && (
              <p className="text-sm text-green-600 mt-2 text-center">
                Protocol permissions updated successfully
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface PoolCheckboxProps {
  pool: ProtocolPool
  checked: boolean
  onToggle: () => void
}

function PoolCheckbox({ pool, checked, onToggle }: PoolCheckboxProps) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={`pool-${pool.id}`}
        checked={checked}
        onChange={onToggle}
        label=""
      />
      <label
        htmlFor={`pool-${pool.id}`}
        className="cursor-pointer flex-1"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{pool.name}</p>
          <Badge variant="outline" className="text-xs">
            {pool.token}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pool.description}
        </p>
      </label>
    </div>
  )
}
