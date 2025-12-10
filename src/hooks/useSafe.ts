import { useAccount, useReadContract, usePublicClient } from 'wagmi'
import { useContractAddresses } from '@/contexts/ContractAddressContext'
import { DEFI_INTERACTOR_ABI, SAFE_ABI, ROLES } from '@/lib/contracts'
import { useEffect, useState } from 'react'
import type { SubAccount } from '@/types'

/**
 * Hook to read the target Safe address from the DeFi Interactor contract
 */
export function useSafeAddress() {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'avatar',
  })
}

/**
 * Hook to fetch the list of Safe owners
 */
export function useSafeOwners() {
  const { data: safeAddress } = useSafeAddress()

  return useReadContract({
    address: safeAddress,
    abi: SAFE_ABI,
    functionName: 'getOwners',
    query: {
      enabled: Boolean(safeAddress),
    },
  })
}

/**
 * Hook to check if the connected address is a Safe owner (signer)
 */
export function useIsSafeOwner() {
  const { address: connectedAddress } = useAccount()
  const { data: safeAddress } = useSafeAddress()
  const { data: owners, isLoading } = useSafeOwners()

  const isSafeOwner =
    connectedAddress &&
    owners &&
    owners.some(owner => owner.toLowerCase() === connectedAddress.toLowerCase())

  return {
    isSafeOwner: Boolean(isSafeOwner),
    isLoading,
    safeAddress,
    connectedAddress,
    owners,
  }
}

/**
 * Hook to read sub-account limits for a given address
 */
export function useSubAccountLimits(subAccountAddress?: `0x${string}`) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getSubAccountLimits',
    args: subAccountAddress ? [subAccountAddress] : undefined,
  })
}

/**
 * Hook to check if an address has a specific role
 */
export function useHasRole(member?: `0x${string}`, roleId?: number) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'hasRole',
    args: member && roleId !== undefined ? [member, roleId] : undefined,
  })
}

/**
 * Hook to check if a target address is allowed for a sub-account
 */
export function useIsAddressAllowed(subAccount?: `0x${string}`, target?: `0x${string}`) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'allowedAddresses',
    args: subAccount && target ? [subAccount, target] : undefined,
  })
}

/**
 * Hook to fetch all managed accounts from the contract using view functions
 * Returns a list of all addresses that have been granted roles
 */
export function useManagedAccounts() {
  const { addresses } = useContractAddresses()
  const publicClient = usePublicClient()
  const [accounts, setAccounts] = useState<SubAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchManagedAccounts() {
      if (!addresses.defiInteractor || !publicClient) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch accounts for each role using the contract's getter functions
        const [executeAccounts, transferAccounts] = await Promise.all([
          publicClient.readContract({
            address: addresses.defiInteractor,
            abi: DEFI_INTERACTOR_ABI,
            functionName: 'getSubaccountsByRole',
            args: [ROLES.DEFI_EXECUTE_ROLE],
          }) as Promise<`0x${string}`[]>,
          publicClient.readContract({
            address: addresses.defiInteractor,
            abi: DEFI_INTERACTOR_ABI,
            functionName: 'getSubaccountsByRole',
            args: [ROLES.DEFI_TRANSFER_ROLE],
          }) as Promise<`0x${string}`[]>,
        ])

        // Build a map of addresses and their roles
        const accountMap = new Map<`0x${string}`, { executeRole: boolean; transferRole: boolean }>()

        // Add execute role accounts
        for (const address of executeAccounts) {
          accountMap.set(address, {
            executeRole: true,
            transferRole: false,
          })
        }

        // Add transfer role accounts
        for (const address of transferAccounts) {
          const existing = accountMap.get(address)
          if (existing) {
            existing.transferRole = true
          } else {
            accountMap.set(address, {
              executeRole: false,
              transferRole: true,
            })
          }
        }

        // Convert map to array
        const accountList: SubAccount[] = Array.from(accountMap.entries()).map(
          ([address, roles]) => ({
            address,
            hasExecuteRole: roles.executeRole,
            hasTransferRole: roles.transferRole,
          })
        )

        setAccounts(accountList)
      } catch (err) {
        console.error('Error fetching managed accounts:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch managed accounts'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchManagedAccounts()
  }, [addresses.defiInteractor, publicClient])

  return { accounts, isLoading, error, refetch: () => setIsLoading(true) }
}

/**
 * Hook to check multiple addresses against the allowedAddresses mapping
 * Takes a list of addresses to check and returns which ones are allowed
 */
export function useAllowedAddresses(
  subAccountAddress?: `0x${string}`,
  addressesToCheck?: `0x${string}`[]
) {
  const { addresses } = useContractAddresses()
  const publicClient = usePublicClient()
  const [allowedAddresses, setAllowedAddresses] = useState<Set<`0x${string}`>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function checkAllowedAddresses() {
      if (!addresses.defiInteractor || !publicClient || !subAccountAddress || !addressesToCheck) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Query the allowedAddresses mapping for each address
        const results = await Promise.all(
          addressesToCheck.map(async targetAddress => {
            try {
              const isAllowed = (await publicClient.readContract({
                address: addresses.defiInteractor,
                abi: DEFI_INTERACTOR_ABI as any,
                functionName: 'allowedAddresses',
                args: [subAccountAddress, targetAddress],
              } as any)) as boolean
              return { address: targetAddress, isAllowed }
            } catch {
              return { address: targetAddress, isAllowed: false }
            }
          })
        )

        // Build set of allowed addresses
        const allowed = new Set<`0x${string}`>()
        results.forEach(({ address, isAllowed }) => {
          if (isAllowed) {
            allowed.add(address)
          }
        })

        setAllowedAddresses(allowed)
      } catch (err) {
        console.error('Error checking allowed addresses:', err)
        setError(err instanceof Error ? err : new Error('Failed to check allowed addresses'))
      } finally {
        setIsLoading(false)
      }
    }

    checkAllowedAddresses()
  }, [addresses.defiInteractor, publicClient, subAccountAddress, addressesToCheck])

  return { allowedAddresses, isLoading, error }
}

/**
 * Hook to get the spending allowance for a sub-account (oracle-managed)
 * Returns remaining USD allowance (18 decimals)
 */
export function useSpendingAllowance(subAccountAddress?: `0x${string}`) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getSpendingAllowance',
    args: subAccountAddress ? [subAccountAddress] : undefined,
    query: {
      enabled: Boolean(subAccountAddress && addresses.defiInteractor),
    },
  })
}

/**
 * Hook to get the acquired balance for a specific token and sub-account
 * Acquired tokens are FREE to use (don't cost spending allowance)
 */
export function useAcquiredBalance(
  subAccountAddress?: `0x${string}`,
  tokenAddress?: `0x${string}`
) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getAcquiredBalance',
    args: subAccountAddress && tokenAddress ? [subAccountAddress, tokenAddress] : undefined,
    query: {
      enabled: Boolean(subAccountAddress && tokenAddress && addresses.defiInteractor),
    },
  })
}

/**
 * Hook to get Safe portfolio value and oracle status
 * Returns: [totalValueUSD, lastUpdated, updateCount]
 */
export function useSafeValue() {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'getSafeValue',
    query: {
      enabled: Boolean(addresses.defiInteractor),
    },
  })
}

/**
 * Hook to check if the Safe value data is stale (oracle hasn't updated recently)
 * @param maxAge Maximum age in seconds (default: 3600 = 1 hour)
 */
export function useIsValueStale(maxAge: number = 3600) {
  const { addresses } = useContractAddresses()

  return useReadContract({
    address: addresses.defiInteractor,
    abi: DEFI_INTERACTOR_ABI,
    functionName: 'isValueStale',
    args: [BigInt(maxAge)],
    query: {
      enabled: Boolean(addresses.defiInteractor),
    },
  })
}

/**
 * Hook to fetch acquired balances for multiple tokens
 * Returns a map of token address -> balance
 */
export function useAcquiredBalances(
  subAccountAddress?: `0x${string}`,
  tokenAddresses?: `0x${string}`[]
) {
  const { addresses } = useContractAddresses()
  const publicClient = usePublicClient()
  const [balances, setBalances] = useState<Map<string, bigint>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBalances() {
      if (
        !addresses.defiInteractor ||
        !publicClient ||
        !subAccountAddress ||
        !tokenAddresses ||
        tokenAddresses.length === 0
      ) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch balance for each token
        const results = await Promise.all(
          tokenAddresses.map(async tokenAddress => {
            try {
              const balance = (await publicClient.readContract({
                address: addresses.defiInteractor,
                abi: DEFI_INTERACTOR_ABI,
                functionName: 'getAcquiredBalance',
                args: [subAccountAddress, tokenAddress],
                code: '0x',
              })) as bigint
              return { address: tokenAddress.toLowerCase(), balance }
            } catch {
              return { address: tokenAddress.toLowerCase(), balance: 0n }
            }
          })
        )

        // Build map of token -> balance
        const balanceMap = new Map<string, bigint>()
        results.forEach(({ address, balance }) => {
          balanceMap.set(address, balance)
        })

        setBalances(balanceMap)
      } catch (err) {
        console.error('Error fetching acquired balances:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch acquired balances'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalances()
  }, [addresses.defiInteractor, publicClient, subAccountAddress, tokenAddresses])

  return { balances, isLoading, error }
}
