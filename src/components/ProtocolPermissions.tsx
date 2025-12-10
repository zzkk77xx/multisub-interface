import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DEFI_INTERACTOR_ABI } from '@/lib/contracts'
import { PROTOCOLS, Protocol, ProtocolContract } from '@/lib/protocols'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { useSafeProposal, encodeContractCall } from '@/hooks/useSafeProposal'
import { useAllowedAddresses } from '@/hooks/useSafe'

interface ProtocolPermissionsProps {
  subAccountAddress: `0x${string}`
}

export function ProtocolPermissions({ subAccountAddress }: ProtocolPermissionsProps) {
  const { addresses } = useContractAddresses()
  const [selectedProtocols, setSelectedProtocols] = useState<Map<string, Set<string>>>(new Map())
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { proposeTransaction, isPending, error } = useSafeProposal()

  // Build list of all addresses to check
  const addressesToCheck = useMemo(() => {
    const allAddresses: `0x${string}`[] = []
    PROTOCOLS.forEach(protocol => {
      protocol.contracts.forEach(contract => {
        allAddresses.push(contract.address)
      })
    })
    return allAddresses
  }, [])

  // Fetch already allowed addresses from contract
  const { data: allowedAddresses = new Set(), isLoading: isLoadingAllowed } = useAllowedAddresses(
    subAccountAddress,
    addressesToCheck
  )

  // Initialize selected protocols from allowed addresses
  useEffect(() => {
    if (allowedAddresses.size === 0) return

    const newMap = new Map<string, Set<string>>()

    PROTOCOLS.forEach(protocol => {
      const selectedContracts = new Set<string>()

      // Check which contracts are allowed
      protocol.contracts.forEach(contract => {
        if (allowedAddresses.has(contract.address)) {
          selectedContracts.add(contract.id)
        }
      })

      if (selectedContracts.size > 0) {
        newMap.set(protocol.id, selectedContracts)
      }
    })

    setSelectedProtocols(newMap)
  }, [allowedAddresses])

  const toggleProtocol = (protocolId: string) => {
    const current = selectedProtocols.get(protocolId)
    if (current && current.size > 0) {
      // Deselect protocol and all contracts
      const newMap = new Map(selectedProtocols)
      newMap.delete(protocolId)
      setSelectedProtocols(newMap)
    } else {
      // Expand to show contracts
      setExpandedProtocol(expandedProtocol === protocolId ? null : protocolId)
    }
  }

  const toggleContract = (protocolId: string, contractId: string) => {
    const newMap = new Map(selectedProtocols)
    const current = newMap.get(protocolId) || new Set<string>()

    if (current.has(contractId)) {
      current.delete(contractId)
      if (current.size === 0) {
        newMap.delete(protocolId)
      } else {
        newMap.set(protocolId, current)
      }
    } else {
      current.add(contractId)
      newMap.set(protocolId, current)
    }

    setSelectedProtocols(newMap)
  }

  const selectAllContracts = (protocol: Protocol) => {
    const newMap = new Map(selectedProtocols)
    const allContractIds = new Set(protocol.contracts.map(c => c.id))
    newMap.set(protocol.id, allContractIds)
    setSelectedProtocols(newMap)
  }

  const handleSavePermissions = async () => {
    // Collect all selected contract addresses
    const allowedAddresses: `0x${string}`[] = []

    selectedProtocols.forEach((contractIds, protocolId) => {
      const protocol = PROTOCOLS.find(p => p.id === protocolId)
      if (protocol) {
        // Add selected contract addresses
        contractIds.forEach(contractId => {
          const contract = protocol.contracts.find(c => c.id === contractId)
          if (contract) {
            allowedAddresses.push(contract.address)
          }
        })
      }
    })

    if (allowedAddresses.length === 0) {
      alert('Please select at least one protocol contract')
      return
    }

    if (!addresses.defiInteractor) {
      alert('Contract address not configured')
      return
    }

    try {
      setSuccessMessage(null)

      const data = encodeContractCall(
        addresses.defiInteractor,
        DEFI_INTERACTOR_ABI as unknown as any[],
        'setAllowedAddresses',
        [subAccountAddress, allowedAddresses, true]
      )

      const result = await proposeTransaction({
        to: addresses.defiInteractor,
        data,
      })

      if (result.success) {
        setSuccessMessage(
          `Protocol permissions set successfully! Transaction hash: ${result.transactionHash}`
        )
      } else {
        throw result.error || new Error('Transaction failed')
      }
    } catch (error) {
      console.error('Error proposing permissions:', error)
      const errorMsg = error instanceof Error ? error.message : 'Failed to propose transaction'
      alert(`Failed to propose transaction. ${errorMsg}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Permissions</CardTitle>
        <CardDescription>
          Select which DeFi protocol contracts this sub-account can interact with
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoadingAllowed ? (
          <p className="text-sm text-muted-foreground">Loading current permissions...</p>
        ) : (
          <div className="space-y-4">
            {allowedAddresses.size > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Currently Allowed</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  {allowedAddresses.size} address{allowedAddresses.size !== 1 ? 'es' : ''} already
                  permitted
                </p>
              </div>
            )}

            {PROTOCOLS.map(protocol => {
              const selectedContracts = selectedProtocols.get(protocol.id)
              const hasSelectedContracts = selectedContracts && selectedContracts.size > 0
              const isExpanded = expandedProtocol === protocol.id

              // Check if any contract in protocol is currently allowed
              const isProtocolAllowed = protocol.contracts.some(c => allowedAddresses.has(c.address))

              return (
                <div
                  key={protocol.id}
                  className={`border rounded-lg p-4 ${isProtocolAllowed ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={`protocol-${protocol.id}`}
                        checked={hasSelectedContracts}
                        onChange={() => toggleProtocol(protocol.id)}
                        label=""
                      />
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setExpandedProtocol(isExpanded ? null : protocol.id)}
                      >
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{protocol.name}</p>
                          {isProtocolAllowed && (
                            <Badge
                              variant="default"
                              className="text-xs bg-blue-600"
                            >
                              Allowed
                            </Badge>
                          )}
                          {hasSelectedContracts && (
                            <Badge
                              variant="secondary"
                              className="text-xs"
                            >
                              {selectedContracts.size} contract{selectedContracts.size !== 1 ? 's' : ''}
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
                          onClick={() => selectAllContracts(protocol)}
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
                      {protocol.contracts.map(contract => {
                        const isContractAllowed = allowedAddresses.has(contract.address)
                        return (
                          <ContractCheckbox
                            key={contract.id}
                            contract={contract}
                            checked={selectedContracts?.has(contract.id) || false}
                            onToggle={() => toggleContract(protocol.id, contract.id)}
                            isAllowed={isContractAllowed}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="pt-4 border-t">
              <Button
                onClick={handleSavePermissions}
                disabled={isPending || selectedProtocols.size === 0}
                className="w-full"
              >
                {isPending ? 'Proposing to Safe...' : 'Propose Protocol Permissions'}
              </Button>

              {successMessage && (
                <p className="text-sm text-green-600 mt-2 text-center">✓ {successMessage}</p>
              )}

              {error && <p className="text-sm text-red-600 mt-2 text-center">✗ {String(error)}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ContractCheckboxProps {
  contract: ProtocolContract
  checked: boolean
  onToggle: () => void
  isAllowed: boolean
}

function ContractCheckbox({ contract, checked, onToggle, isAllowed }: ContractCheckboxProps) {
  return (
    <div className={`flex items-start gap-2 p-2 rounded ${isAllowed ? 'bg-blue-100 dark:bg-blue-950/40' : ''}`}>
      <Checkbox
        id={`contract-${contract.id}`}
        checked={checked}
        onChange={onToggle}
        label=""
      />
      <label
        htmlFor={`contract-${contract.id}`}
        className="cursor-pointer flex-1"
      >
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{contract.name}</p>
          {isAllowed && (
            <Badge
              variant="default"
              className="text-xs bg-blue-600"
            >
              Allowed
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{contract.description}</p>
      </label>
    </div>
  )
}
