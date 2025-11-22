// DeFi Protocol configurations for sub-account permissions

export interface ProtocolPool {
  id: string
  name: string
  token: string
  address: `0x${string}`
  description: string
}

export interface Protocol {
  id: string
  name: string
  description: string
  contractAddress: `0x${string}`
  pools: ProtocolPool[]
}

// Aave Protocol Configuration (Base/Polygon addresses)
export const AAVE_PROTOCOL: Protocol = {
  id: 'aave',
  name: 'Aave V3',
  description: 'Decentralized lending protocol',
  contractAddress: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as `0x${string}`, // Aave V3 Pool on Base
  pools: [
    {
      id: 'aave-usdc',
      name: 'USDC Pool',
      token: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, // USDC on Base
      description: 'Lend and borrow USDC'
    },
    {
      id: 'aave-eth',
      name: 'ETH Pool',
      token: 'ETH',
      address: '0x4200000000000000000000000000000000000006' as `0x${string}`, // WETH on Base
      description: 'Lend and borrow ETH'
    },
    {
      id: 'aave-usdt',
      name: 'USDT Pool',
      token: 'USDT',
      address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`, // USDT on Base
      description: 'Lend and borrow USDT'
    }
  ]
}

// QuickSwap Protocol Configuration (Polygon)
export const QUICKSWAP_PROTOCOL: Protocol = {
  id: 'quickswap',
  name: 'QuickSwap',
  description: 'Decentralized exchange on Polygon',
  contractAddress: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff' as `0x${string}`, // QuickSwap Router
  pools: [
    {
      id: 'quickswap-matic-usdc',
      name: 'MATIC-USDC',
      token: 'MATIC/USDC',
      address: '0x6e7a5FAFcec6BB1e78bAE2A1F0B612012BF14827' as `0x${string}`,
      description: 'Trade and provide liquidity for MATIC/USDC'
    },
    {
      id: 'quickswap-eth-usdc',
      name: 'ETH-USDC',
      token: 'ETH/USDC',
      address: '0x853Ee4b2A13f8a742d64C8F088bE7bA2131f670d' as `0x${string}`,
      description: 'Trade and provide liquidity for ETH/USDC'
    },
    {
      id: 'quickswap-wbtc-eth',
      name: 'WBTC-ETH',
      token: 'WBTC/ETH',
      address: '0xdC9232E2Df177d7a12FdFf6EcBAb114E2231198D' as `0x${string}`,
      description: 'Trade and provide liquidity for WBTC/ETH'
    }
  ]
}

// All available protocols
export const PROTOCOLS = [AAVE_PROTOCOL, QUICKSWAP_PROTOCOL] as const

// Helper to get protocol by ID
export function getProtocolById(id: string): Protocol | undefined {
  return PROTOCOLS.find(p => p.id === id)
}

// Helper to get all pool addresses for a protocol
export function getProtocolPoolAddresses(protocolId: string): `0x${string}`[] {
  const protocol = getProtocolById(protocolId)
  return protocol ? protocol.pools.map(p => p.address) : []
}

// Helper to check if an address is a valid protocol pool
export function isValidProtocolPool(address: `0x${string}`): boolean {
  return PROTOCOLS.some(protocol =>
    protocol.pools.some(pool => pool.address.toLowerCase() === address.toLowerCase())
  )
}
