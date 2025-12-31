import { ethers } from 'ethers';
import { TransactionType } from '../types';
import { ParsedTransaction, TransactionParser } from './transactionParser';

export interface IntentAnalysis {
  intent: string;
  estimatedOutcome: string;
  confidence: 'high' | 'medium' | 'low';
  details: string[];
}

export class IntentAnalyzer {
  /**
   * Analyze a parsed transaction and generate human-readable intent
   */
  static analyzeIntent(parsedTx: ParsedTransaction): IntentAnalysis {
    const { type } = parsedTx;

    switch (type) {
      case TransactionType.TRANSFER:
        return this.analyzeTransfer(parsedTx);
      
      case TransactionType.SWAP:
        return this.analyzeSwap(parsedTx);
      
      case TransactionType.APPROVAL:
        return this.analyzeApproval(parsedTx);
      
      case TransactionType.LIQUIDITY:
        return this.analyzeLiquidity(parsedTx);
      
      case TransactionType.UNKNOWN:
      default:
        return this.analyzeUnknown(parsedTx);
    }
  }

  /**
   * Analyze transfer transactions
   */
  private static analyzeTransfer(parsedTx: ParsedTransaction): IntentAnalysis {
    const { functionName, parameters, to, value } = parsedTx;

    // Simple ETH transfer
    if (!functionName) {
      const ethAmount = TransactionParser.formatValue(value);
      const recipient = this.formatAddress(to);
      
      return {
        intent: `Send ${ethAmount} ETH to ${recipient}`,
        estimatedOutcome: `${ethAmount} ETH will be transferred from your wallet`,
        confidence: 'high',
        details: [
          `Recipient: ${to}`,
          `Amount: ${ethAmount} ETH`,
          'This is a simple ETH transfer'
        ]
      };
    }

    // ERC-20 token transfer
    if (functionName === 'transfer(address,uint256)' && parameters && parameters.length >= 2) {
      const recipient = this.formatAddress(parameters[0]);
      const amount = ethers.getBigInt(parameters[1]).toString();
      const contractAddress = this.formatAddress(to);
      
      return {
        intent: `Send tokens to ${recipient}`,
        estimatedOutcome: `Tokens will be transferred from your wallet`,
        confidence: 'high',
        details: [
          `Token contract: ${contractAddress}`,
          `Recipient: ${parameters[0]}`,
          `Amount: ${amount} tokens`,
          'This transfers tokens you own to another address'
        ]
      };
    }

    // TransferFrom (usually called by contracts)
    if (functionName === 'transferFrom(address,address,uint256)' && parameters && parameters.length >= 3) {
      const from = this.formatAddress(parameters[0]);
      const recipient = this.formatAddress(parameters[1]);
      const amount = ethers.getBigInt(parameters[2]).toString();
      
      return {
        intent: `Transfer tokens from ${from} to ${recipient}`,
        estimatedOutcome: `Tokens will be moved between addresses (requires approval)`,
        confidence: 'medium',
        details: [
          `From: ${parameters[0]}`,
          `To: ${parameters[1]}`,
          `Amount: ${amount} tokens`,
          'This moves tokens between addresses (typically used by contracts)'
        ]
      };
    }

    return this.analyzeUnknown(parsedTx);
  }

  /**
   * Analyze swap transactions
   */
  private static analyzeSwap(parsedTx: ParsedTransaction): IntentAnalysis {
    const { functionName, parameters, to } = parsedTx;

    if (!functionName || !parameters) {
      return this.analyzeUnknown(parsedTx);
    }

    const amounts = TransactionParser.extractAmounts(parameters, functionName);
    const tokenPath = TransactionParser.extractTokenAddresses(parameters, functionName);
    const dexName = this.identifyDEX(to);

    // Exact tokens for tokens
    if (functionName.includes('swapExactTokensForTokens')) {
      const amountIn = amounts.amountIn ? this.formatTokenAmount(amounts.amountIn) : 'unknown';
      const minAmountOut = amounts.amountMin ? this.formatTokenAmount(amounts.amountMin) : 'unknown';
      
      return {
        intent: `Swap ${amountIn} tokens for other tokens on ${dexName}`,
        estimatedOutcome: `You will receive at least ${minAmountOut} tokens`,
        confidence: 'high',
        details: [
          `DEX: ${dexName}`,
          `Input amount: ${amountIn} tokens`,
          `Minimum output: ${minAmountOut} tokens`,
          `Token path: ${tokenPath.length} tokens`,
          'You are trading one token for another'
        ]
      };
    }

    // Exact ETH for tokens
    if (functionName.includes('swapExactETHForTokens')) {
      const ethAmount = amounts.amountIn ? TransactionParser.formatValue(amounts.amountIn) : 'unknown';
      const minTokens = amounts.amountMin ? this.formatTokenAmount(amounts.amountMin) : 'unknown';
      
      return {
        intent: `Swap ${ethAmount} ETH for tokens on ${dexName}`,
        estimatedOutcome: `You will receive at least ${minTokens} tokens`,
        confidence: 'high',
        details: [
          `DEX: ${dexName}`,
          `ETH amount: ${ethAmount}`,
          `Minimum tokens: ${minTokens}`,
          'You are buying tokens with ETH'
        ]
      };
    }

    // Exact tokens for ETH
    if (functionName.includes('swapExactTokensForETH')) {
      const tokenAmount = amounts.amountIn ? this.formatTokenAmount(amounts.amountIn) : 'unknown';
      const minEth = amounts.amountMin ? TransactionParser.formatValue(amounts.amountMin) : 'unknown';
      
      return {
        intent: `Swap ${tokenAmount} tokens for ETH on ${dexName}`,
        estimatedOutcome: `You will receive at least ${minEth} ETH`,
        confidence: 'high',
        details: [
          `DEX: ${dexName}`,
          `Token amount: ${tokenAmount}`,
          `Minimum ETH: ${minEth}`,
          'You are selling tokens for ETH'
        ]
      };
    }

    // Generic swap fallback
    return {
      intent: `Perform token swap on ${dexName}`,
      estimatedOutcome: `Tokens will be exchanged according to current market rates`,
      confidence: 'medium',
      details: [
        `DEX: ${dexName}`,
        `Function: ${functionName}`,
        'This is a token swap transaction'
      ]
    };
  }

  /**
   * Analyze approval transactions
   */
  private static analyzeApproval(parsedTx: ParsedTransaction): IntentAnalysis {
    const { parameters, to } = parsedTx;

    if (!parameters || parameters.length < 2) {
      return this.analyzeUnknown(parsedTx);
    }

    const amount = ethers.getBigInt(parameters[1]);
    const tokenContract = this.formatAddress(to);
    const spenderName = this.identifyContract(parameters[0]);

    // Check for unlimited approval
    const isUnlimited = amount >= ethers.getBigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');
    const amountText = isUnlimited ? 'unlimited' : this.formatTokenAmount(amount.toString());

    return {
      intent: `Allow ${spenderName} to spend ${amountText} of your tokens`,
      estimatedOutcome: `${spenderName} will be able to transfer your tokens on your behalf`,
      confidence: 'high',
      details: [
        `Token contract: ${tokenContract}`,
        `Spender: ${spenderName} (${parameters[0]})`,
        `Amount: ${amountText} tokens`,
        isUnlimited ? 'WARNING: This grants unlimited spending permission' : 'This grants limited spending permission',
        'You can revoke this permission later by setting approval to 0'
      ]
    };
  }

  /**
   * Analyze liquidity transactions
   */
  private static analyzeLiquidity(parsedTx: ParsedTransaction): IntentAnalysis {
    const { functionName, parameters, to } = parsedTx;
    const dexName = this.identifyDEX(to);

    if (!functionName || !parameters) {
      return this.analyzeUnknown(parsedTx);
    }

    if (functionName.includes('addLiquidity')) {
      if (functionName.includes('ETH')) {
        return {
          intent: `Add liquidity to ETH/Token pool on ${dexName}`,
          estimatedOutcome: `You will provide ETH and tokens to earn trading fees`,
          confidence: 'high',
          details: [
            `DEX: ${dexName}`,
            'You are becoming a liquidity provider',
            'You will receive LP tokens representing your share',
            'You will earn fees from trades in this pool'
          ]
        };
      } else {
        return {
          intent: `Add liquidity to token pair on ${dexName}`,
          estimatedOutcome: `You will provide two tokens to earn trading fees`,
          confidence: 'high',
          details: [
            `DEX: ${dexName}`,
            'You are becoming a liquidity provider',
            'You will receive LP tokens representing your share',
            'You will earn fees from trades in this pool'
          ]
        };
      }
    }

    if (functionName.includes('removeLiquidity')) {
      return {
        intent: `Remove liquidity from ${dexName} pool`,
        estimatedOutcome: `You will receive back your tokens plus earned fees`,
        confidence: 'high',
        details: [
          `DEX: ${dexName}`,
          'You are withdrawing your liquidity',
          'Your LP tokens will be burned',
          'You will receive the underlying tokens'
        ]
      };
    }

    return this.analyzeUnknown(parsedTx);
  }

  /**
   * Analyze unknown transactions
   */
  private static analyzeUnknown(parsedTx: ParsedTransaction): IntentAnalysis {
    const { to, value, functionSignature, data } = parsedTx;
    const contractName = this.identifyContract(to);
    const hasValue = value !== '0';
    const hasData = data && data !== '0x' && data.length > 2;

    let intent = 'Unknown transaction type';
    let outcome = 'The outcome of this transaction is unclear';
    const details: string[] = [];

    if (hasValue && !hasData) {
      const ethAmount = TransactionParser.formatValue(value);
      intent = `Send ${ethAmount} ETH to ${contractName}`;
      outcome = `${ethAmount} ETH will be sent to the contract`;
      details.push(`Amount: ${ethAmount} ETH`);
    } else if (hasData && hasValue) {
      const ethAmount = TransactionParser.formatValue(value);
      intent = `Send ${ethAmount} ETH to ${contractName}`;
      outcome = `${ethAmount} ETH will be sent to the contract`;
      details.push(`ETH sent: ${ethAmount}`);
      
      if (functionSignature) {
        details.push(`Function signature: 0x${functionSignature}`);
      }
    } else if (hasData) {
      // For data-only transactions, keep as "Unknown transaction type"
      intent = 'Unknown transaction type';
      outcome = 'This will execute a function on the contract';
      
      if (functionSignature) {
        details.push(`Function signature: 0x${functionSignature}`);
      }
    }

    details.push(
      `Contract: ${contractName} (${to})`,
      'CAUTION: Unknown transaction - verify carefully before proceeding'
    );

    return {
      intent,
      estimatedOutcome: outcome,
      confidence: 'low',
      details
    };
  }

  /**
   * Format address for display (show first 6 and last 4 characters)
   */
  private static formatAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format token amount for display
   */
  private static formatTokenAmount(amount: string): string {
    try {
      const bigAmount = ethers.getBigInt(amount);
      
      // For very large numbers, show in scientific notation
      if (bigAmount > ethers.getBigInt('1000000000000000000000000')) {
        return `${bigAmount.toString().slice(0, 6)}...`;
      }
      
      // Try to format as decimal (assuming 18 decimals for display)
      const formatted = ethers.formatUnits(bigAmount, 18);
      const num = parseFloat(formatted);
      
      if (num === 0) return '0';
      if (num < 0.000001) return '< 0.000001';
      if (num < 1) return num.toFixed(6);
      if (num < 1000) return num.toFixed(4);
      if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
      
      return `${(num / 1000000).toFixed(2)}M`;
    } catch (error) {
      return amount;
    }
  }

  /**
   * Identify DEX name from contract address
   */
  private static identifyDEX(address: string): string {
    const knownDEXs: { [key: string]: string } = {
      // Uniswap V2 Router
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2',
      // Uniswap V3 Router
      '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3',
      // SushiSwap Router
      '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap',
      // PancakeSwap Router (BSC)
      '0x10ed43c718714eb63d5aa57b78b54704e256024e': 'PancakeSwap',
    };

    return knownDEXs[address.toLowerCase()] || 'Unknown DEX';
  }

  /**
   * Identify contract name from address
   */
  private static identifyContract(address: string): string {
    const knownContracts: { [key: string]: string } = {
      // DEX Routers
      '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': 'Uniswap V2 Router',
      '0xe592427a0aece92de3edee1f18e0157c05861564': 'Uniswap V3 Router',
      '0xd9e1ce17f2641f24ae83637ab66a2cca9c378b9f': 'SushiSwap Router',
      
      // Common tokens
      '0xa0b86a33e6441b8c18d904c4c0b5c0c8c7c5b0c8': 'USDC',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
      
      // Well-known contracts
      '0x0000000000000000000000000000000000000000': 'Null Address',
    };

    const known = knownContracts[address.toLowerCase()];
    if (known) return known;

    // Return formatted address if not known
    return this.formatAddress(address);
  }

  /**
   * Generate a complete transaction explanation
   */
  static generateExplanation(parsedTx: ParsedTransaction): string {
    const analysis = this.analyzeIntent(parsedTx);
    
    let explanation = `${analysis.intent}\n\n`;
    explanation += `Expected outcome: ${analysis.estimatedOutcome}\n\n`;
    
    if (analysis.details.length > 0) {
      explanation += 'Details:\n';
      analysis.details.forEach(detail => {
        explanation += `• ${detail}\n`;
      });
    }

    if (analysis.confidence === 'low') {
      explanation += '\n⚠️ This transaction type is not fully recognized. Please verify the details carefully.';
    }

    return explanation;
  }
}