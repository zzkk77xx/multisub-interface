import { Eip1193Provider } from '@safe-global/protocol-kit';
import type { PublicClient } from 'viem'

/**
 * EIP-1193 Provider interface
 */

/**
 * Creates an EIP-1193 compatible provider from a viem PublicClient
 * This avoids circular reference issues when passing to Safe SDK
 */
export function createEip1193Provider(client: PublicClient): Eip1193Provider {
  return {
    request: async ({ method, params }: { method: string; params?: any[] }) => {
      try {
        // Map EIP-1193 methods to viem client methods
        switch (method) {
          case 'eth_chainId':
            return `0x${client.chain?.id.toString(16)}`

          case 'eth_accounts':
            return []

          case 'eth_getBalance':
            return await client.getBalance({ address: params![0] as `0x${string}` })

          case 'eth_getCode':
            return await client.getCode({ address: params![0] as `0x${string}` })

          case 'eth_getTransactionCount':
            return await client.getTransactionCount({ address: params![0] as `0x${string}` })

          case 'eth_call':
            return await client.call({
              to: params![0].to,
              data: params![0].data,
              account: params![0].from,
              value: params![0].value,
            })

          case 'eth_estimateGas':
            return await client.estimateGas({
              to: params![0].to,
              data: params![0].data,
              account: params![0].from,
              value: params![0].value,
            })

          case 'eth_blockNumber':
            return await client.getBlockNumber()

          case 'eth_getBlockByNumber':
            return await client.getBlock({
              blockNumber: params![0] === 'latest' ? undefined : BigInt(params![0]),
              includeTransactions: params![1]
            })

          case 'eth_getTransactionReceipt':
            return await client.getTransactionReceipt({ hash: params![0] as `0x${string}` })

          case 'eth_sendRawTransaction':
            return await client.sendRawTransaction({ serializedTransaction: params![0] as `0x${string}` })

          default:
            // Use the generic request method for any other methods
            return await client.request({ method: method as any, params: params as any })
        }
      } catch (error) {
        throw error
      }
    },
  }
}
