import { ethers } from 'ethers';
import { TransactionType } from '../types';

export interface ParsedTransaction {
  to: string;
  value: string;
  data: string;
  functionSignature?: string;
  functionName?: string;
  parameters?: any[];
  type: TransactionType;
}

export interface TransactionRequest {
  to?: string;
  value?: string;
  data?: string;
  from?: string;
  gas?: string;
  gasPrice?: string;
}

// Common function signatures for DeFi operations
const FUNCTION_SIGNATURES = {
  // ERC-20 Token functions
  'transfer(address,uint256)': 'a9059cbb',
  'transferFrom(address,address,uint256)': '23b872dd',
  'approve(address,uint256)': '095ea7b3',
  
  // Uniswap V2 Router functions
  'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)': '38ed1739',
  'swapTokensForExactTokens(uint256,uint256,address[],address,uint256)': '8803dbee',
  'swapExactETHForTokens(uint256,address[],address,uint256)': '7ff36ab5',
  'swapTokensForExactETH(uint256,uint256,address[],address,uint256)': '4a25d94a',
  'swapExactTokensForETH(uint256,uint256,address[],address,uint256)': '18cbafe5',
  'swapETHForExactTokens(uint256,address[],address,uint256)': 'fb3bdb41',
  
  // Uniswap V2 Liquidity functions
  'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)': 'e8e33700',
  'addLiquidityETH(address,uint256,uint256,uint256,address,uint256)': 'f305d719',
  'removeLiquidity(address,address,uint256,uint256,uint256,address,uint256)': 'baa2abde',
  'removeLiquidityETH(address,uint256,uint256,uint256,address,uint256)': '02751cec',
};

// Reverse mapping for quick lookup
const SIGNATURE_TO_FUNCTION = Object.fromEntries(
  Object.entries(FUNCTION_SIGNATURES).map(([func, sig]) => [sig, func])
);

export class TransactionParser {
  /**
   * Parse a transaction request and extract relevant information
   */
  static parseTransaction(txRequest: TransactionRequest): ParsedTransaction {
    const to = txRequest.to || '';
    const value = txRequest.value || '0x0';
    const data = txRequest.data || '0x';

    // Convert hex value to decimal string for display
    const valueInWei = value === '0x0' ? '0' : ethers.getBigInt(value).toString();

    const parsed: ParsedTransaction = {
      to,
      value: valueInWei,
      data,
      type: TransactionType.UNKNOWN
    };

    // If no data, it's likely a simple ETH transfer
    if (data === '0x' || data.length <= 2) {
      parsed.type = TransactionType.TRANSFER;
      return parsed;
    }

    // Extract function signature (first 4 bytes after 0x)
    if (data.length >= 10) {
      const functionSignature = data.slice(2, 10);
      parsed.functionSignature = functionSignature;

      // Look up function name
      const functionName = SIGNATURE_TO_FUNCTION[functionSignature];
      if (functionName) {
        parsed.functionName = functionName;
        parsed.type = this.determineTransactionType(functionName);
        
        // Try to decode parameters
        try {
          parsed.parameters = this.decodeParameters(functionName, data);
        } catch (error) {
          console.warn('Failed to decode parameters:', error);
        }
      }
    }

    return parsed;
  }

  /**
   * Determine transaction type based on function name
   */
  private static determineTransactionType(functionName: string): TransactionType {
    if (functionName.includes('transfer')) {
      return TransactionType.TRANSFER;
    }
    
    if (functionName.includes('swap')) {
      return TransactionType.SWAP;
    }
    
    if (functionName.includes('approve')) {
      return TransactionType.APPROVAL;
    }
    
    if (functionName.includes('addLiquidity') || functionName.includes('removeLiquidity')) {
      return TransactionType.LIQUIDITY;
    }
    
    return TransactionType.UNKNOWN;
  }

  /**
   * Decode function parameters from transaction data
   */
  private static decodeParameters(functionName: string, data: string): any[] {
    try {
      // Create ABI fragment for the function
      const abiFragment = this.createAbiFragment(functionName);
      if (!abiFragment) {
        return [];
      }

      // Create interface and decode
      const iface = new ethers.Interface([abiFragment]);
      const decoded = iface.decodeFunctionData(abiFragment.name, data);
      
      return Array.from(decoded);
    } catch (error) {
      console.warn('Parameter decoding failed:', error);
      return [];
    }
  }

  /**
   * Create ABI fragment from function signature
   */
  private static createAbiFragment(functionName: string): any | null {
    // Parse function signature to create ABI fragment
    const match = functionName.match(/^(\w+)\(([^)]*)\)$/);
    if (!match) return null;

    const [, name, params] = match;
    const inputs = params ? params.split(',').map((param, index) => ({
      name: `param${index}`,
      type: param.trim()
    })) : [];

    return {
      name,
      type: 'function',
      inputs
    };
  }

  /**
   * Format value for display (convert wei to ether for ETH transactions)
   */
  static formatValue(valueWei: string, decimals: number = 18): string {
    if (valueWei === '0') return '0';
    
    try {
      const value = ethers.getBigInt(valueWei);
      const formatted = ethers.formatUnits(value, decimals);
      return formatted;
    } catch (error) {
      return valueWei;
    }
  }

  /**
   * Extract token addresses from swap parameters
   */
  static extractTokenAddresses(parameters: any[], functionName: string): string[] {
    if (!parameters || parameters.length === 0) return [];

    // For Uniswap swaps, token path is usually in the parameters
    if (functionName.includes('swap')) {
      // Look for address array parameter (token path)
      for (const param of parameters) {
        if (Array.isArray(param) && param.length > 0) {
          // Check if first element looks like an address
          if (typeof param[0] === 'string' && param[0].startsWith('0x') && param[0].length === 42) {
            return param;
          }
        }
      }
    }

    return [];
  }

  /**
   * Extract amounts from transaction parameters
   */
  static extractAmounts(parameters: any[], functionName: string): { amountIn?: string; amountOut?: string; amountMin?: string } {
    if (!parameters || parameters.length === 0) return {};

    const amounts: { amountIn?: string; amountOut?: string; amountMin?: string } = {};

    try {
      if (functionName.includes('swapExact')) {
        // First parameter is usually the exact amount
        if (parameters[0] && typeof parameters[0] !== 'object') {
          amounts.amountIn = ethers.getBigInt(parameters[0]).toString();
        }
        // Second parameter is usually minimum amount out
        if (parameters[1] && typeof parameters[1] !== 'object') {
          amounts.amountMin = ethers.getBigInt(parameters[1]).toString();
        }
      } else if (functionName.includes('swapTokensForExact')) {
        // First parameter is exact amount out
        if (parameters[0] && typeof parameters[0] !== 'object') {
          amounts.amountOut = ethers.getBigInt(parameters[0]).toString();
        }
        // Second parameter is maximum amount in
        if (parameters[1] && typeof parameters[1] !== 'object') {
          amounts.amountIn = ethers.getBigInt(parameters[1]).toString();
        }
      } else if (functionName.includes('transfer')) {
        // For transfers, second parameter is amount
        if (parameters[1] && typeof parameters[1] !== 'object') {
          amounts.amountIn = ethers.getBigInt(parameters[1]).toString();
        }
      } else if (functionName.includes('approve')) {
        // For approvals, second parameter is amount
        if (parameters[1] && typeof parameters[1] !== 'object') {
          amounts.amountIn = ethers.getBigInt(parameters[1]).toString();
        }
      }
    } catch (error) {
      console.warn('Failed to extract amounts:', error);
    }

    return amounts;
  }
}