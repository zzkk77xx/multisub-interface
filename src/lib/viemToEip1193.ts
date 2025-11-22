import { Eip1193Provider } from '@safe-global/protocol-kit';
import type { PublicClient, WalletClient } from 'viem'

/**
 * EIP-1193 Provider interface
 */
interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

/**
 * Creates an EIP-1193 compatible provider from a viem PublicClient
 * This avoids circular reference issues when passing to Safe SDK
 */
export function createEip1193Provider(client: PublicClient, walletClient?: WalletClient): Eip1193Provider {
  return {
    request: async (args: RequestArguments): Promise<unknown> => {
      const { method, params } = args;
      // Normalize params to array format
      const paramsArray = params ? (Array.isArray(params) ? params : [params]) : [];
      try {
        // Map EIP-1193 methods to viem client methods
        switch (method) {
          case 'eth_chainId':
            return `0x${client.chain?.id.toString(16)}`

          case 'eth_accounts':
            return []

          case 'eth_getBalance':
            return await client.getBalance({ address: paramsArray[0] as `0x${string}` })

          case 'eth_getCode':
            return await client.getCode({ address: paramsArray[0] as `0x${string}` })

          case 'eth_getTransactionCount':
            return await client.getTransactionCount({ address: paramsArray[0] as `0x${string}` })

          case 'eth_call':
            return await client.call({
              to: (paramsArray[0] as any).to,
              data: (paramsArray[0] as any).data,
              account: (paramsArray[0] as any).from,
              value: (paramsArray[0] as any).value,
            })

          case 'eth_estimateGas':
            return await client.estimateGas({
              to: (paramsArray[0] as any).to,
              data: (paramsArray[0] as any).data,
              account: (paramsArray[0] as any).from,
              value: (paramsArray[0] as any).value,
            })

          case 'eth_blockNumber':
            return await client.getBlockNumber()

          case 'eth_getBlockByNumber':
            return await client.getBlock({
              blockNumber: paramsArray[0] === 'latest' ? undefined : BigInt(paramsArray[0] as string),
              includeTransactions: paramsArray[1] as boolean
            })

          case 'eth_getTransactionReceipt':
            return await client.getTransactionReceipt({ hash: paramsArray[0] as `0x${string}` })

          case 'eth_sendRawTransaction':
            return await client.sendRawTransaction({ serializedTransaction: paramsArray[0] as `0x${string}` })

          case 'eth_signTypedData_v4':
            if (!walletClient) {
              throw new Error('Wallet client required for eth_signTypedData_v4')
            }
            const [address, typedData] = paramsArray as [string, string]
            const parsedData = typeof typedData === 'string' ? JSON.parse(typedData) : typedData
            return await walletClient.signTypedData({
              account: address as `0x${string}`,
              ...parsedData
            })

          default:
            // Use the generic request method for any other methods
            return await client.request({ method: method as any, params: paramsArray as any })
        }
      } catch (error) {
        throw error
      }
    },
  }
}
