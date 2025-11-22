// DeFiInteractor contract ABI
export const DEFI_INTERACTOR_ABI = [
  // Role Constants
  {
    inputs: [],
    name: 'DEFI_DEPOSIT_ROLE',
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFI_WITHDRAW_ROLE',
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFI_EXECUTE_ROLE',
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DEFI_TRANSFER_ROLE',
    outputs: [{ name: '', type: 'uint16' }],
    stateMutability: 'view',
    type: 'function'
  },

  // Read Functions
  {
    inputs: [
      { name: 'member', type: 'address' },
      { name: 'roleId', type: 'uint16' }
    ],
    name: 'hasRole',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'safe',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'priceOracle',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'subAccount', type: 'address' }],
    name: 'getSubAccountLimits',
    outputs: [
      { name: 'maxDepositBps', type: 'uint256' },
      { name: 'maxWithdrawBps', type: 'uint256' },
      { name: 'maxLossBps', type: 'uint256' },
      { name: 'windowDuration', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getPortfolioValue',
    outputs: [{ name: 'totalValue', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTrackedTokenCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'getTrackedProtocolCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'subAccount', type: 'address' },
      { name: 'target', type: 'address' }
    ],
    name: 'allowedAddresses',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'subAccount', type: 'address' }],
    name: 'getDepositWindow',
    outputs: [
      { name: 'windowStart', type: 'uint256' },
      { name: 'cumulativeDeposit', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'subAccount', type: 'address' }],
    name: 'getWithdrawWindow',
    outputs: [
      { name: 'windowStart', type: 'uint256' },
      { name: 'cumulativeWithdraw', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'subAccount', type: 'address' }],
    name: 'getTransferWindow',
    outputs: [
      { name: 'windowStart', type: 'uint256' },
      { name: 'cumulativeTransfer', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },

  // Role Management Functions (Safe only)
  {
    inputs: [
      { name: 'member', type: 'address' },
      { name: 'roleId', type: 'uint16' }
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'member', type: 'address' },
      { name: 'roleId', type: 'uint16' }
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Emergency Controls (Safe only)
  {
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Oracle Management (Safe only)
  {
    inputs: [{ name: '_oracle', type: 'address' }],
    name: 'setOracle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'addTrackedToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'removeTrackedToken',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'protocol', type: 'address' }],
    name: 'addTrackedProtocol',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'protocol', type: 'address' }],
    name: 'removeTrackedProtocol',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Sub-Account Configuration (Safe only)
  {
    inputs: [
      { name: 'subAccount', type: 'address' },
      { name: 'maxDepositBps', type: 'uint256' },
      { name: 'maxWithdrawBps', type: 'uint256' },
      { name: 'maxLossBps', type: 'uint256' },
      { name: 'windowDuration', type: 'uint256' }
    ],
    name: 'setSubAccountLimits',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'subAccount', type: 'address' },
      { name: 'targets', type: 'address[]' },
      { name: 'allowed', type: 'bool' }
    ],
    name: 'setAllowedAddresses',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Core DeFi Operations (Sub-accounts)
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'minShares', type: 'uint256' }
    ],
    name: 'depositTo',
    outputs: [{ name: 'actualShares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'assets', type: 'uint256' },
      { name: 'receiver', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'maxShares', type: 'uint256' }
    ],
    name: 'withdrawFrom',
    outputs: [{ name: 'actualShares', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'transferToken',
    outputs: [{ name: 'success', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'target', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approveProtocol',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'data', type: 'bytes' }
    ],
    name: 'executeOnProtocol',
    outputs: [{ name: 'result', type: 'bytes' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'member', type: 'address' },
      { indexed: true, name: 'roleId', type: 'uint16' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'RoleAssigned',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'member', type: 'address' },
      { indexed: true, name: 'roleId', type: 'uint16' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'RoleRevoked',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'by', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'EmergencyPaused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'by', type: 'address' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'EmergencyUnpaused',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: true, name: 'target', type: 'address' },
      { indexed: false, name: 'assets', type: 'uint256' },
      { indexed: false, name: 'actualSharesReceived', type: 'uint256' },
      { indexed: false, name: 'safeBalanceBefore', type: 'uint256' },
      { indexed: false, name: 'safeBalanceAfter', type: 'uint256' },
      { indexed: false, name: 'cumulativeInWindow', type: 'uint256' },
      { indexed: false, name: 'percentageOfBalance', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'DepositExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: true, name: 'target', type: 'address' },
      { indexed: false, name: 'assets', type: 'uint256' },
      { indexed: false, name: 'actualSharesBurned', type: 'uint256' },
      { indexed: false, name: 'safeSharesBefore', type: 'uint256' },
      { indexed: false, name: 'safeSharesAfter', type: 'uint256' },
      { indexed: false, name: 'cumulativeInWindow', type: 'uint256' },
      { indexed: false, name: 'percentageOfPosition', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'WithdrawExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: false, name: 'maxDepositBps', type: 'uint256' },
      { indexed: false, name: 'maxWithdrawBps', type: 'uint256' },
      { indexed: false, name: 'maxLossBps', type: 'uint256' },
      { indexed: false, name: 'windowDuration', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'SubAccountLimitsSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: false, name: 'targets', type: 'address[]' },
      { indexed: false, name: 'allowed', type: 'bool' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'AllowedAddressesSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: true, name: 'recipient', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'safeBalanceBefore', type: 'uint256' },
      { indexed: false, name: 'safeBalanceAfter', type: 'uint256' },
      { indexed: false, name: 'cumulativeInWindow', type: 'uint256' },
      { indexed: false, name: 'percentageOfBalance', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'TransferExecuted',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'subAccount', type: 'address' },
      { indexed: false, name: 'activityType', type: 'string' },
      { indexed: false, name: 'value', type: 'uint256' },
      { indexed: false, name: 'threshold', type: 'uint256' },
      { indexed: false, name: 'timestamp', type: 'uint256' }
    ],
    name: 'UnusualActivity',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'oldOracle', type: 'address' },
      { indexed: true, name: 'newOracle', type: 'address' }
    ],
    name: 'OracleUpdated',
    type: 'event'
  }
] as const

// Contract addresses - update these with your deployed addresses
export const CONTRACT_ADDRESSES = {
  DEFI_INTERACTOR: (import.meta.env.VITE_DEFI_INTERACTOR_ADDRESS || '0x') as `0x${string}`,
  SAFE: (import.meta.env.VITE_SAFE_ADDRESS || '0x') as `0x${string}`,
} as const

// Role constants
export const ROLES = {
  DEFI_DEPOSIT_ROLE: 1,
  DEFI_WITHDRAW_ROLE: 2,
  DEFI_EXECUTE_ROLE: 3,
  DEFI_TRANSFER_ROLE: 4,
} as const

export const ROLE_NAMES = {
  [ROLES.DEFI_DEPOSIT_ROLE]: 'Deposit',
  [ROLES.DEFI_WITHDRAW_ROLE]: 'Withdraw',
  [ROLES.DEFI_EXECUTE_ROLE]: 'Execute',
  [ROLES.DEFI_TRANSFER_ROLE]: 'Transfer',
} as const

export const ROLE_DESCRIPTIONS = {
  [ROLES.DEFI_DEPOSIT_ROLE]: 'Can deposit to Morpho Vaults (configurable % per window)',
  [ROLES.DEFI_WITHDRAW_ROLE]: 'Can withdraw from Morpho Vaults (configurable % per window)',
  [ROLES.DEFI_EXECUTE_ROLE]: 'Can execute generic protocol interactions (limited by portfolio loss %)',
  [ROLES.DEFI_TRANSFER_ROLE]: 'Can transfer tokens from Safe (configurable % per window)',
} as const
