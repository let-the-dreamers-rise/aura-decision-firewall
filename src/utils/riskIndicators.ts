import { RiskIndicator, IndicatorType } from '../types';

// Etherscan API configuration
const ETHERSCAN_API_KEY = 'YourApiKeyToken'; // In production, use environment variable
const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';

/**
 * KNOWN PROTOCOL WHITELIST - Fallback verification for demo purposes
 * 
 * These are well-known, audited contracts that we can safely mark as "verified"
 * when the Etherscan API fails. This is ONLY used as a fallback, not a replacement
 * for real API verification.
 * 
 * Format: address (lowercase) -> protocol name
 */
const KNOWN_PROTOCOL_WHITELIST: Record<string, string> = {
  // Uniswap V2
  '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
  '0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f': 'Uniswap V2 Factory',
  
  // Uniswap V3
  '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
  '0x1f98431c8ad98523631ae4a59f267346ea31f984': 'Uniswap V3 Factory',
  '0xc36442b4a4522e871399cd717abdd847ab11fe88': 'Uniswap V3 Positions NFT',
  
  // OpenSea
  '0x00000000006c3852cbef3e08e8df289169ede581': 'OpenSea Seaport',
  
  // Common Stablecoins
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC Token',
  '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT Token',
  '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI Token',
  
  // WETH
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'Wrapped ETH (WETH)',
};

/**
 * Check if an address is in the known protocol whitelist
 * Returns the protocol name if found, null otherwise
 */
function getKnownProtocol(address: string): string | null {
  return KNOWN_PROTOCOL_WHITELIST[address.toLowerCase()] || null;
}

interface EtherscanContractResponse {
  status: string;
  message: string;
  result: Array<{
    SourceCode: string;
    ABI: string;
    ContractName: string;
    CompilerVersion: string;
    OptimizationUsed: string;
    Runs: string;
    ConstructorArguments: string;
    EVMVersion: string;
    Library: string;
    LicenseType: string;
    Proxy: string;
    Implementation: string;
    SwarmSource: string;
  }>;
}

interface EtherscanBlockResponse {
  status: string;
  message: string;
  result: string;
}

/**
 * Check if a contract is verified on Etherscan
 * Falls back to known protocol whitelist if API fails
 */
export async function checkContractVerification(contractAddress: string): Promise<RiskIndicator | null> {
  try {
    const url = `${ETHERSCAN_BASE_URL}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(url);
    const data: EtherscanContractResponse = await response.json();

    if (data.status === '1' && data.result && data.result.length > 0) {
      const contract = data.result[0];
      
      if (contract.SourceCode && contract.SourceCode.trim() !== '') {
        return {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'info',
          message: 'Contract is verified on Etherscan',
          source: 'Etherscan API'
        };
      } else {
        // API succeeded but contract not verified - check whitelist as fallback
        const knownProtocol = getKnownProtocol(contractAddress);
        if (knownProtocol) {
          return {
            type: IndicatorType.UNVERIFIED_CONTRACT,
            severity: 'info',
            message: `Verified Contract (Known Protocol: ${knownProtocol})`,
            source: 'Fallback Verification'
          };
        }
        
        return {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'warning',
          message: 'Contract is not verified on Etherscan',
          source: 'Etherscan API'
        };
      }
    }

    // API returned unexpected response - check whitelist fallback
    const knownProtocol = getKnownProtocol(contractAddress);
    if (knownProtocol) {
      return {
        type: IndicatorType.UNVERIFIED_CONTRACT,
        severity: 'info',
        message: `Verified Contract (Known Protocol: ${knownProtocol})`,
        source: 'Fallback Verification'
      };
    }

    return {
      type: IndicatorType.UNVERIFIED_CONTRACT,
      severity: 'warning',
      message: 'Unable to verify contract status',
      source: 'Etherscan API'
    };
  } catch (error) {
    console.error('Error checking contract verification:', error);
    
    // API failed - check whitelist fallback
    const knownProtocol = getKnownProtocol(contractAddress);
    if (knownProtocol) {
      return {
        type: IndicatorType.UNVERIFIED_CONTRACT,
        severity: 'info',
        message: `Verified Contract (Known Protocol: ${knownProtocol})`,
        source: 'Fallback Verification'
      };
    }
    
    return {
      type: IndicatorType.UNVERIFIED_CONTRACT,
      severity: 'warning',
      message: 'Unable to verify contract status',
      source: 'Etherscan API (Error)'
    };
  }
}

/**
 * Determine token age from creation block
 */
export async function checkTokenAge(tokenAddress: string): Promise<RiskIndicator | null> {
  try {
    // Get the current block number
    const currentBlockUrl = `${ETHERSCAN_BASE_URL}?module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`;
    const currentBlockResponse = await fetch(currentBlockUrl);
    const currentBlockData: EtherscanBlockResponse = await currentBlockResponse.json();
    
    if (currentBlockData.status !== '1') {
      throw new Error('Failed to get current block number');
    }

    const currentBlock = parseInt(currentBlockData.result, 16);

    // Get the first transaction to estimate creation block
    const txListUrl = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${tokenAddress}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    const txResponse = await fetch(txListUrl);
    const txData = await txResponse.json();

    if (txData.status === '1' && txData.result && txData.result.length > 0) {
      const creationBlock = parseInt(txData.result[0].blockNumber);
      const blockAge = currentBlock - creationBlock;
      
      // Estimate age in days (assuming ~12 seconds per block)
      const estimatedDays = Math.floor((blockAge * 12) / (24 * 60 * 60));

      if (estimatedDays < 7) {
        return {
          type: IndicatorType.NEW_TOKEN,
          severity: 'warning',
          message: `Token is very new (${estimatedDays} days old)`,
          source: 'Etherscan API'
        };
      } else if (estimatedDays < 30) {
        return {
          type: IndicatorType.NEW_TOKEN,
          severity: 'info',
          message: `Token is relatively new (${estimatedDays} days old)`,
          source: 'Etherscan API'
        };
      } else {
        return {
          type: IndicatorType.NEW_TOKEN,
          severity: 'info',
          message: `Token age: ${estimatedDays} days`,
          source: 'Etherscan API'
        };
      }
    }

    return {
      type: IndicatorType.NEW_TOKEN,
      severity: 'warning',
      message: 'Unable to determine token age',
      source: 'Etherscan API'
    };
  } catch (error) {
    console.error('Error checking token age:', error);
    return {
      type: IndicatorType.NEW_TOKEN,
      severity: 'warning',
      message: 'Unable to determine token age',
      source: 'Etherscan API (Error)'
    };
  }
}

/**
 * Check if token has DEX pool presence on Uniswap
 */
export async function checkDEXPoolPresence(tokenAddress: string): Promise<RiskIndicator | null> {
  try {
    // For MVP, we'll use a simplified approach by checking if the token
    // has any transactions with known DEX router addresses
    const uniswapV2Router = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
    const uniswapV3Router = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    
    // Check for transactions with Uniswap routers
    const txListUrl = `${ETHERSCAN_BASE_URL}?module=account&action=txlist&address=${tokenAddress}&startblock=0&endblock=99999999&page=1&offset=100&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(txListUrl);
    const data = await response.json();

    if (data.status === '1' && data.result && data.result.length > 0) {
      const hasUniswapActivity = data.result.some((tx: any) => 
        tx.to?.toLowerCase() === uniswapV2Router.toLowerCase() ||
        tx.to?.toLowerCase() === uniswapV3Router.toLowerCase() ||
        tx.from?.toLowerCase() === uniswapV2Router.toLowerCase() ||
        tx.from?.toLowerCase() === uniswapV3Router.toLowerCase()
      );

      if (hasUniswapActivity) {
        return {
          type: IndicatorType.NO_DEX_POOL,
          severity: 'info',
          message: 'Token has Uniswap trading activity',
          source: 'Etherscan API'
        };
      } else {
        return {
          type: IndicatorType.NO_DEX_POOL,
          severity: 'warning',
          message: 'No major DEX trading activity found',
          source: 'Etherscan API'
        };
      }
    }

    return {
      type: IndicatorType.NO_DEX_POOL,
      severity: 'warning',
      message: 'Unable to verify DEX pool presence',
      source: 'Etherscan API'
    };
  } catch (error) {
    console.error('Error checking DEX pool presence:', error);
    return {
      type: IndicatorType.NO_DEX_POOL,
      severity: 'warning',
      message: 'Unable to verify DEX pool presence',
      source: 'Etherscan API (Error)'
    };
  }
}

/**
 * Check transaction value and flag high-value transactions
 */
export function checkTransactionValue(valueInEth: string): RiskIndicator | null {
  const value = parseFloat(valueInEth);
  
  if (value > 10) {
    return {
      type: IndicatorType.HIGH_VALUE,
      severity: 'warning',
      message: `High value transaction: ${value.toFixed(2)} ETH`,
      source: 'Transaction Analysis'
    };
  } else if (value > 1) {
    return {
      type: IndicatorType.HIGH_VALUE,
      severity: 'info',
      message: `Medium value transaction: ${value.toFixed(2)} ETH`,
      source: 'Transaction Analysis'
    };
  }
  
  return null;
}

/**
 * Check if an address is likely a contract (has code)
 */
async function isContract(address: string): Promise<boolean> {
  try {
    const codeUrl = `${ETHERSCAN_BASE_URL}?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
    const response = await fetch(codeUrl);
    const data = await response.json();
    
    // If result is "0x" or empty, it's an EOA (externally owned account), not a contract
    return data.result && data.result !== '0x' && data.result.length > 2;
  } catch (error) {
    console.error('Error checking if address is contract:', error);
    return false;
  }
}

/**
 * Analyze all risk indicators for a transaction
 */
export async function analyzeRiskIndicators(
  recipientAddress: string,
  tokenAddress?: string,
  valueInEth?: string,
  transactionData?: string // Transaction data to determine if this is a contract call
): Promise<RiskIndicator[]> {
  const indicators: RiskIndicator[] = [];

  try {
    // Check if this is a contract interaction by looking at transaction data
    // If data is empty or just "0x", it's a simple ETH transfer to an EOA
    const hasTransactionData = transactionData && transactionData !== '0x' && transactionData.length > 2;
    
    // Only check contract status if there's transaction data (indicating a contract call)
    if (hasTransactionData) {
      const isContractInteraction = await isContract(recipientAddress);
      
      if (isContractInteraction) {
        const contractVerification = await checkContractVerification(recipientAddress);
        if (contractVerification) {
          indicators.push(contractVerification);
        }
      } else {
        // Address has transaction data but isn't a contract - this is suspicious
        indicators.push({
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'warning',
          message: 'Transaction data sent to non-contract address',
          source: 'Transaction Analysis'
        });
      }
    }

    // Check token age if token address is provided and different from recipient
    if (tokenAddress && tokenAddress !== recipientAddress) {
      const tokenAge = await checkTokenAge(tokenAddress);
      if (tokenAge) {
        indicators.push(tokenAge);
      }

      // Check DEX pool presence for token
      const dexPool = await checkDEXPoolPresence(tokenAddress);
      if (dexPool) {
        indicators.push(dexPool);
      }
    }

    // Check transaction value
    if (valueInEth) {
      const valueIndicator = checkTransactionValue(valueInEth);
      if (valueIndicator) {
        indicators.push(valueIndicator);
      }
    }

    // If no indicators were found, add a positive indicator for simple ETH transfers
    if (indicators.length === 0 && !hasTransactionData) {
      indicators.push({
        type: IndicatorType.UNVERIFIED_CONTRACT,
        severity: 'info',
        message: 'Simple ETH transfer to wallet address',
        source: 'Transaction Analysis'
      });
    }

    return indicators;
  } catch (error) {
    console.error('Error analyzing risk indicators:', error);
    return [{
      type: IndicatorType.UNVERIFIED_CONTRACT,
      severity: 'warning',
      message: 'Unable to analyze risk indicators',
      source: 'Risk Analysis (Error)'
    }];
  }
}