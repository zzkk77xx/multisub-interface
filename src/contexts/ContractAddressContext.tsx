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
    const safeParam = params.get('safe')

    // Check localStorage for saved addresses
    const savedDefiInteractor = localStorage.getItem('defiInteractor')
    const savedSafe = localStorage.getItem('safe')

    const newAddresses: ContractAddresses = {
      defiInteractor: undefined,
      safe: undefined,
    }

    // Priority: URL params > localStorage > env variables
    if (defiInteractorParam && isAddress(defiInteractorParam)) {
      newAddresses.defiInteractor = defiInteractorParam as `0x${string}`
      localStorage.setItem('defiInteractor', defiInteractorParam)
    } else if (savedDefiInteractor && isAddress(savedDefiInteractor)) {
      newAddresses.defiInteractor = savedDefiInteractor as `0x${string}`
    } else if (import.meta.env.VITE_DEFI_INTERACTOR_ADDRESS) {
      const envAddress = import.meta.env.VITE_DEFI_INTERACTOR_ADDRESS
      if (isAddress(envAddress)) {
        newAddresses.defiInteractor = envAddress as `0x${string}`
      }
    }

    if (safeParam && isAddress(safeParam)) {
      newAddresses.safe = safeParam as `0x${string}`
      localStorage.setItem('safe', safeParam)
    } else if (savedSafe && isAddress(savedSafe)) {
      newAddresses.safe = savedSafe as `0x${string}`
    } else if (import.meta.env.VITE_SAFE_ADDRESS) {
      const envAddress = import.meta.env.VITE_SAFE_ADDRESS
      if (isAddress(envAddress)) {
        newAddresses.safe = envAddress as `0x${string}`
      }
    }

    setAddresses(newAddresses)
  }, [])

  const setDefiInteractor = (address: `0x${string}`) => {
    setAddresses(prev => ({ ...prev, defiInteractor: address }))
    localStorage.setItem('defiInteractor', address)

    // Update URL params
    const params = new URLSearchParams(window.location.search)
    params.set('defiInteractor', address)
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
  }

  const setSafe = (address: `0x${string}`) => {
    setAddresses(prev => ({ ...prev, safe: address }))
    localStorage.setItem('safe', address)

    // Update URL params
    const params = new URLSearchParams(window.location.search)
    params.set('safe', address)
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`)
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
