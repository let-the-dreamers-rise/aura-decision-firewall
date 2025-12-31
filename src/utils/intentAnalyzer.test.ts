import { describe, it, expect } from 'vitest';
import { IntentAnalyzer } from './intentAnalyzer';
import { TransactionType } from '../types';
import { ParsedTransaction } from './transactionParser';

describe('IntentAnalyzer', () => {
  describe('analyzeIntent', () => {
    it('should analyze simple ETH transfer', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
        value: '1000000000000000000', // 1 ETH in wei
        data: '0x',
        type: TransactionType.TRANSFER
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Send 1.0 ETH to');
      expect(analysis.confidence).toBe('high');
      expect(analysis.estimatedOutcome).toContain('1.0 ETH will be transferred');
    });

    it('should analyze ERC-20 token transfer', () => {
      const parsedTx: ParsedTransaction = {
        to: '0xA0b86a33E6441b8c18d904c4c0b5c0c8c7c5b0c8',
        value: '0',
        data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4c4c4c40000000000000000000000000000000000000000000000000de0b6b3a7640000',
        functionSignature: 'a9059cbb',
        functionName: 'transfer(address,uint256)',
        parameters: ['0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4', '1000000000000000000'],
        type: TransactionType.TRANSFER
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Send tokens to');
      expect(analysis.confidence).toBe('high');
      expect(analysis.details).toContain('This transfers tokens you own to another address');
    });

    it('should analyze token approval', () => {
      const parsedTx: ParsedTransaction = {
        to: '0xA0b86a33E6441b8c18d904c4c0b5c0c8c7c5b0c8',
        value: '0',
        data: '0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4c4c4c40000000000000000000000000000000000000000000000000de0b6b3a7640000',
        functionSignature: '095ea7b3',
        functionName: 'approve(address,uint256)',
        parameters: ['0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4', '1000000000000000000'],
        type: TransactionType.APPROVAL
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Allow');
      expect(analysis.intent).toContain('to spend');
      expect(analysis.confidence).toBe('high');
      expect(analysis.estimatedOutcome).toContain('will be able to transfer your tokens');
    });

    it('should analyze unlimited token approval', () => {
      const parsedTx: ParsedTransaction = {
        to: '0xA0b86a33E6441b8c18d904c4c0b5c0c8c7c5b0c8',
        value: '0',
        data: '0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4c4c4c4ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        functionSignature: '095ea7b3',
        functionName: 'approve(address,uint256)',
        parameters: ['0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4', '115792089237316195423570985008687907853269984665640564039457584007913129639935'],
        type: TransactionType.APPROVAL
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('unlimited');
      expect(analysis.details.some(detail => detail.includes('WARNING: This grants unlimited spending permission'))).toBe(true);
    });

    it('should analyze Uniswap swap', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        value: '0',
        data: '0x38ed1739',
        functionSignature: '38ed1739',
        functionName: 'swapExactTokensForTokens(uint256,uint256,address[],address,uint256)',
        parameters: [
          '1000000000000000000', // 1 token
          '900000000000000000',  // 0.9 token minimum
          ['0xA0b86a33E6441b8c18d904c4c0b5c0c8c7c5b0c8', '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4'],
          '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
          '1640995200'
        ],
        type: TransactionType.SWAP
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Swap');
      expect(analysis.intent).toContain('tokens for other tokens');
      expect(analysis.intent).toContain('Uniswap V2');
      expect(analysis.confidence).toBe('high');
    });

    it('should analyze ETH to token swap', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: '1000000000000000000', // 1 ETH
        data: '0x7ff36ab5',
        functionSignature: '7ff36ab5',
        functionName: 'swapExactETHForTokens(uint256,address[],address,uint256)',
        parameters: [
          '900000000000000000',
          ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xA0b86a33E6441b8c18d904c4c0b5c0c8c7c5b0c8'],
          '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
          '1640995200'
        ],
        type: TransactionType.SWAP
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Swap');
      expect(analysis.intent).toContain('ETH for tokens');
      expect(analysis.estimatedOutcome).toContain('You will receive at least');
    });

    it('should analyze liquidity addition', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        value: '0',
        data: '0xe8e33700',
        functionSignature: 'e8e33700',
        functionName: 'addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)',
        parameters: [],
        type: TransactionType.LIQUIDITY
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Add liquidity');
      expect(analysis.estimatedOutcome).toContain('earn trading fees');
      expect(analysis.details.some(detail => detail.includes('You will receive LP tokens'))).toBe(true);
    });

    it('should handle unknown transactions with fallback message', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
        value: '0',
        data: '0x12345678',
        functionSignature: '12345678',
        type: TransactionType.UNKNOWN
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Unknown transaction type');
      expect(analysis.confidence).toBe('low');
      expect(analysis.details.some(detail => detail.includes('CAUTION: Unknown transaction'))).toBe(true);
    });

    it('should handle contract interaction with ETH value', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
        value: '1000000000000000000', // 1 ETH
        data: '0x12345678',
        functionSignature: '12345678',
        type: TransactionType.UNKNOWN
      };

      const analysis = IntentAnalyzer.analyzeIntent(parsedTx);

      expect(analysis.intent).toContain('Send 1.0 ETH to');
      expect(analysis.estimatedOutcome).toContain('1.0 ETH will be sent to the contract');
    });
  });

  describe('generateExplanation', () => {
    it('should generate complete explanation for transfer', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
        value: '1000000000000000000',
        data: '0x',
        type: TransactionType.TRANSFER
      };

      const explanation = IntentAnalyzer.generateExplanation(parsedTx);

      expect(explanation).toContain('Send 1.0 ETH to');
      expect(explanation).toContain('Expected outcome:');
      expect(explanation).toContain('Details:');
      expect(explanation).toContain('This is a simple ETH transfer');
    });

    it('should include warning for unknown transactions', () => {
      const parsedTx: ParsedTransaction = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4C4c4c4',
        value: '0',
        data: '0x12345678',
        type: TransactionType.UNKNOWN
      };

      const explanation = IntentAnalyzer.generateExplanation(parsedTx);

      expect(explanation).toContain('⚠️ This transaction type is not fully recognized');
    });
  });
});