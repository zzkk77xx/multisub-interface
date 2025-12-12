import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { isAddress } from 'viem'

interface ContractAddresses {
  defiInteractor: `0x${string}` | undefined
  safe: `0x${string}` | undefined
}

interface ContractAddressContextType {
  addresses: ContractAddresses
  setDefiInteractor: (address: `0x${string}`) => void
  setSafe: (address: `0x${string}`) => void
  isConfigured: boolean
}

const ContractAddressContext = createContext<ContractAddressContextType | undefined>(undefined)

interface ContractAddressProviderProps {
  children: ReactNode
}

export function ContractAddressProvider({ children }: ContractAddressProviderProps) {
  const [addresses, setAddresses] = useState<ContractAddresses>({
    defiInteractor: undefined,
    safe: undefined,
  })

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const defiInteractorParam = params.get('defiInteractor')

    // Check localStorage for saved address
    const savedDefiInteractor = localStorage.getItem('defiInteractor')

    let defiInteractor: `0x${string}` | undefined = undefined

    // Priority: URL params > localStorage
    if (defiInteractorParam && isAddress(defiInteractorParam)) {
      defiInteractor = defiInteractorParam
      localStorage.setItem('defiInteractor', defiInteractorParam)
    } else if (savedDefiInteractor && isAddress(savedDefiInteractor)) {
      defiInteractor = savedDefiInteractor
    }

    // Note: Safe is derived from DeFi Interactor via useSafeAddress() hook
    setAddresses({ defiInteractor, safe: undefined })
  }, [])

  const setDefiInteractor = (address: `0x${string}`) => {
    setAddresses(prev => ({ ...prev, defiInteractor: address, safe: undefined }))
    localStorage.setItem('defiInteractor', address)
    localStorage.removeItem('safe') // Clean up legacy storage

    // Update URL params (only defiInteractor, remove safe if present)
    const params = new URLSearchParams(window.location.search)
    params.set('defiInteractor', address)
    params.delete('safe') // Clean up legacy URL param
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }

  const setSafe = (address: `0x${string}`) => {
    // Safe is derived from DeFi Interactor - only update local state as cache
    setAddresses(prev => ({ ...prev, safe: address }))
  }

  const isConfigured = Boolean(addresses.defiInteractor)

  return (
    <ContractAddressContext.Provider
      value={{
        addresses,
        setDefiInteractor,
        setSafe,
        isConfigured,
      }}
    >
      {children}
    </ContractAddressContext.Provider>
  )
}

export function useContractAddresses() {
  const context = useContext(ContractAddressContext)
  if (context === undefined) {
    throw new Error('useContractAddresses must be used within a ContractAddressProvider')
  }
  return context
}
