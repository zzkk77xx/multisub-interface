import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TransactionType } from '@/lib/transactionTypes'
import { INVALIDATION_MAP } from '@/lib/queryInvalidationMap'

export function useTransactionInvalidation() {
  const queryClient = useQueryClient()

  const invalidateQueriesForTransaction = useCallback(
    async (transactionType: TransactionType) => {
      const mapping = INVALIDATION_MAP[transactionType]
      if (!mapping) {
        console.warn(`No invalidation mapping for transaction type: ${transactionType}`)
        return
      }

      const invalidationPromises: Promise<void>[] = []

      // Invalidate React Query useQuery caches
      for (const queryKeyPrefix of mapping.reactQueryKeys) {
        invalidationPromises.push(
          queryClient.invalidateQueries({
            predicate: query => {
              const key = query.queryKey
              return Array.isArray(key) && key[0] === queryKeyPrefix
            },
          })
        )
      }

      // Invalidate Wagmi useReadContract caches
      // Wagmi stores queries with keys like: ['readContract', { functionName, address, args, chainId }]
      for (const functionName of mapping.wagmiFunctions) {
        invalidationPromises.push(
          queryClient.invalidateQueries({
            predicate: query => {
              const key = query.queryKey
              if (!Array.isArray(key)) return false

              // Wagmi v2 uses 'readContract' as the first key element
              if (key[0] === 'readContract') {
                const config = key[1] as Record<string, unknown> | undefined
                return config?.functionName === functionName
              }

              return false
            },
          })
        )
      }

      await Promise.all(invalidationPromises)
    },
    [queryClient]
  )

  return {
    invalidateQueriesForTransaction,
  }
}
