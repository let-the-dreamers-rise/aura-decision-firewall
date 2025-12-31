/**
 * Mock Transactions for Development and Demo
 * 
 * These are realistic transaction objects that flow through the same
 * parsing + intent analysis pipeline as real MetaMask transactions.
 * 
 * Used for:
 * - Fast development iteration
 * - Demo scenarios without requiring real funds
 * - Testing transaction analysis logic
 */

export interface MockTransaction {
  id: string;
  name: string;
  description: string;
  to: string;
  value: string;
  data: string;
  from: string;
  gas: string;
  gasPrice: string;
}

export const MOCK_TRANSACTIONS: MockTransaction[] = [
  {
    id: 'eth-transfer',
    name: 'ETH Transfer',
    description: 'Send 0.5 ETH to another wallet',
    to: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6',
    value: '0x6F05B59D3B20000', // 0.5 ETH in hex
    data: '0x',
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0x5208', // 21000
    gasPrice: '0x9184e72a000' // 10 gwei
  },
  
  {
    id: 'erc20-approve',
    name: 'USDC Approval',
    description: 'Approve Uniswap to spend unlimited USDC',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Real USDC contract on mainnet
    value: '0x0',
    data: '0x095ea7b3000000000000000000000000e592427a0aece92de3edee1f18e0157c05861564ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // approve(spender, amount)
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0xc350', // 50000
    gasPrice: '0x9184e72a000'
  },
  
  {
    id: 'erc20-transfer',
    name: 'USDC Transfer',
    description: 'Send 100 USDC to recipient',
    to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Real USDC contract on mainnet
    value: '0x0',
    data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4c9db996c4b4d8b0000000000000000000000000000000000000000000000000000000005f5e100', // transfer(to, 100 USDC)
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0xc350',
    gasPrice: '0x9184e72a000'
  },
  
  {
    id: 'uniswap-swap',
    name: 'Uniswap Swap',
    description: 'Swap 1 ETH for USDC on Uniswap',
    to: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    value: '0xDE0B6B3A7640000', // 1 ETH
    data: '0x414bf389000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000a0b86a33e6441e6e80d0c4c96c5c2e5c5e5c5e5c0000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000742d35cc6634c0532925a3b8d4c9db996c4b4d8b0000000000000000000000000000000000000000000000000de0b6b3a76400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', // exactInputSingle
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0x30d40', // 200000
    gasPrice: '0x9184e72a000'
  },
  
  {
    id: 'high-value-transfer',
    name: 'High Value Transfer',
    description: 'Send 50 ETH (high value warning)',
    to: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6',
    value: '0x2b5e3af16b1880000', // 50 ETH in hex (50 * 10^18 wei)
    data: '0x',
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0x5208',
    gasPrice: '0x9184e72a000'
  },
  
  {
    id: 'unknown-contract',
    name: 'Unknown Contract',
    description: 'Interact with unverified contract',
    to: '0x1234567890123456789012345678901234567890', // Unknown contract
    value: '0x0',
    data: '0x12345678abcdef', // Unknown function
    from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
    gas: '0x7530', // 30000
    gasPrice: '0x9184e72a000'
  }
];

/**
 * Get a mock transaction by ID
 */
export function getMockTransaction(id: string): MockTransaction | undefined {
  return MOCK_TRANSACTIONS.find(tx => tx.id === id);
}

/**
 * Get all available mock transactions
 */
export function getAllMockTransactions(): MockTransaction[] {
  return MOCK_TRANSACTIONS;
}

/**
 * Get a random mock transaction for testing
 */
export function getRandomMockTransaction(): MockTransaction {
  const randomIndex = Math.floor(Math.random() * MOCK_TRANSACTIONS.length);
  return MOCK_TRANSACTIONS[randomIndex];
}