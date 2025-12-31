import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkContractVerification,
  checkTokenAge,
  checkDEXPoolPresence,
  checkTransactionValue,
  analyzeRiskIndicators
} from './riskIndicators';
import { IndicatorType } from '../types';

// Mock fetch globally
global.fetch = vi.fn();

describe('Risk Indicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkContractVerification', () => {
    it('should return verified indicator for verified contract', async () => {
      const mockResponse = {
        status: '1',
        message: 'OK',
        result: [{
          SourceCode: 'contract MyContract { ... }',
          ABI: '[...]',
          ContractName: 'MyContract',
          CompilerVersion: 'v0.8.0',
          OptimizationUsed: '1',
          Runs: '200',
          ConstructorArguments: '',
          EVMVersion: 'Default',
          Library: '',
          LicenseType: 'MIT',
          Proxy: '0',
          Implementation: '',
          SwarmSource: ''
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await checkContractVerification('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.UNVERIFIED_CONTRACT);
      expect(result?.severity).toBe('info');
      expect(result?.message).toContain('verified');
    });

    it('should return unverified indicator for unverified contract', async () => {
      const mockResponse = {
        status: '1',
        message: 'OK',
        result: [{
          SourceCode: '',
          ABI: 'Contract source code not verified',
          ContractName: '',
          CompilerVersion: '',
          OptimizationUsed: '',
          Runs: '',
          ConstructorArguments: '',
          EVMVersion: '',
          Library: '',
          LicenseType: '',
          Proxy: '0',
          Implementation: '',
          SwarmSource: ''
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await checkContractVerification('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.UNVERIFIED_CONTRACT);
      expect(result?.severity).toBe('warning');
      expect(result?.message).toContain('not verified');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkContractVerification('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.UNVERIFIED_CONTRACT);
      expect(result?.severity).toBe('warning');
      expect(result?.message).toContain('Unable to verify');
    });
  });

  describe('checkTokenAge', () => {
    it('should return new token indicator for very new tokens', async () => {
      const currentBlockResponse = {
        status: '1',
        result: '0x1234567' // Mock current block in hex
      };

      const txListResponse = {
        status: '1',
        result: [{
          blockNumber: '19000000' // Recent block number
        }]
      };

      (fetch as any)
        .mockResolvedValueOnce({
          json: () => Promise.resolve(currentBlockResponse)
        })
        .mockResolvedValueOnce({
          json: () => Promise.resolve(txListResponse)
        });

      const result = await checkTokenAge('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.NEW_TOKEN);
      expect(result?.message).toContain('days old');
    });

    it('should handle API errors gracefully', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkTokenAge('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.NEW_TOKEN);
      expect(result?.severity).toBe('warning');
      expect(result?.message).toContain('Unable to determine');
    });
  });

  describe('checkDEXPoolPresence', () => {
    it('should return positive indicator when Uniswap activity found', async () => {
      const mockResponse = {
        status: '1',
        result: [{
          to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
          from: '0x1234567890123456789012345678901234567890',
          hash: '0xabcdef'
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await checkDEXPoolPresence('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.NO_DEX_POOL);
      expect(result?.severity).toBe('info');
      expect(result?.message).toContain('Uniswap trading activity');
    });

    it('should return warning when no DEX activity found', async () => {
      const mockResponse = {
        status: '1',
        result: [{
          to: '0x9999999999999999999999999999999999999999', // Random address
          from: '0x1234567890123456789012345678901234567890',
          hash: '0xabcdef'
        }]
      };

      (fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve(mockResponse)
      });

      const result = await checkDEXPoolPresence('0x1234567890123456789012345678901234567890');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.NO_DEX_POOL);
      expect(result?.severity).toBe('warning');
      expect(result?.message).toContain('No major DEX');
    });
  });

  describe('checkTransactionValue', () => {
    it('should return high value warning for large transactions', () => {
      const result = checkTransactionValue('15.5');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.HIGH_VALUE);
      expect(result?.severity).toBe('warning');
      expect(result?.message).toContain('High value');
    });

    it('should return medium value info for moderate transactions', () => {
      const result = checkTransactionValue('5.2');
      
      expect(result).toBeDefined();
      expect(result?.type).toBe(IndicatorType.HIGH_VALUE);
      expect(result?.severity).toBe('info');
      expect(result?.message).toContain('Medium value');
    });

    it('should return null for small transactions', () => {
      const result = checkTransactionValue('0.5');
      
      expect(result).toBeNull();
    });
  });

  describe('analyzeRiskIndicators', () => {
    it('should combine multiple risk indicators', async () => {
      // Mock isContract check to return true (this is a contract)
      const codeResponse = { result: '0x608060405234801561001057600080fd5b50' }; // Non-empty code
      
      // Mock contract verification response
      const contractResponse = {
        status: '1',
        result: [{ SourceCode: 'contract code...' }]
      };

      // Mock token age responses
      const currentBlockResponse = {
        status: '1',
        result: '0x1234567'
      };

      const txListResponse = {
        status: '1',
        result: [{ blockNumber: '19000000' }]
      };

      // Mock DEX pool response
      const dexResponse = {
        status: '1',
        result: [{
          to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
        }]
      };

      (fetch as any)
        .mockResolvedValueOnce({ json: () => Promise.resolve(codeResponse) }) // isContract check
        .mockResolvedValueOnce({ json: () => Promise.resolve(contractResponse) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(currentBlockResponse) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(txListResponse) })
        .mockResolvedValueOnce({ json: () => Promise.resolve(dexResponse) });

      const result = await analyzeRiskIndicators(
        '0x1234567890123456789012345678901234567890',
        '0x0987654321098765432109876543210987654321',
        '15.5',
        '0xa9059cbb' // Contract call data
      );

      expect(result).toHaveLength(4); // Contract verification, token age, DEX pool, high value
      expect(result.some(r => r.type === IndicatorType.UNVERIFIED_CONTRACT)).toBe(true);
      expect(result.some(r => r.type === IndicatorType.NEW_TOKEN)).toBe(true);
      expect(result.some(r => r.type === IndicatorType.NO_DEX_POOL)).toBe(true);
      expect(result.some(r => r.type === IndicatorType.HIGH_VALUE)).toBe(true);
    });

    it('should handle simple ETH transfers without contract checks', async () => {
      // Mock isContract check to return false (EOA)
      const codeResponse = { result: '0x' }; // Empty code = EOA
      
      (fetch as any)
        .mockResolvedValueOnce({ json: () => Promise.resolve(codeResponse) });

      const result = await analyzeRiskIndicators(
        '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6', // Regular wallet address
        undefined,
        '0.1',
        '0x' // No transaction data = simple ETH transfer
      );

      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('Simple ETH transfer to wallet address');
      expect(result[0].severity).toBe('info');
    });

    it('should detect transaction data sent to non-contract address', async () => {
      // Mock isContract check to return false (EOA)
      const codeResponse = { result: '0x' }; // Empty code = EOA
      
      (fetch as any)
        .mockResolvedValueOnce({ json: () => Promise.resolve(codeResponse) });

      const result = await analyzeRiskIndicators(
        '0x1234567890123456789012345678901234567890',
        undefined,
        undefined,
        '0xa9059cbb' // Contract call data sent to EOA - suspicious!
      );

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(IndicatorType.UNVERIFIED_CONTRACT);
      expect(result[0].message).toContain('Transaction data sent to non-contract address');
      expect(result[0].severity).toBe('warning');
    });
  });
});