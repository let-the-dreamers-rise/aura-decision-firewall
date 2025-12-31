import { TransactionParser, TransactionRequest } from './transactionParser';
import { TransactionType } from '../types';

describe('TransactionParser', () => {
  describe('parseTransaction', () => {
    it('should parse simple ETH transfer', () => {
      const txRequest: TransactionRequest = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x16345785d8a0000', // 0.1 ETH in wei
        data: '0x'
      };

      const result = TransactionParser.parseTransaction(txRequest);

      expect(result.type).toBe(TransactionType.TRANSFER);
      expect(result.to).toBe('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
      expect(result.value).toBe('100000000000000000'); // 0.1 ETH in wei
      expect(result.data).toBe('0x');
    });

    it('should parse ERC-20 transfer', () => {
      const txRequest: TransactionRequest = {
        to: '0xA0b86a33E6441b8435b662f0E2d0B5B0B5B5B5B5',
        value: '0x0',
        data: '0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4d8b60000000000000000000000000000000000000000000000000de0b6b3a7640000'
      };

      const result = TransactionParser.parseTransaction(txRequest);

      expect(result.type).toBe(TransactionType.TRANSFER);
      expect(result.functionSignature).toBe('a9059cbb');
      expect(result.functionName).toBe('transfer(address,uint256)');
      expect(result.parameters).toHaveLength(2);
    });

    it('should parse ERC-20 approval', () => {
      const txRequest: TransactionRequest = {
        to: '0xA0b86a33E6441b8435b662f0E2d0B5B0B5B5B5B5',
        value: '0x0',
        data: '0x095ea7b3000000000000000000000000742d35cc6634c0532925a3b8d4c9db96c4b4d8b6ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
      };

      const result = TransactionParser.parseTransaction(txRequest);

      expect(result.type).toBe(TransactionType.APPROVAL);
      expect(result.functionSignature).toBe('095ea7b3');
      expect(result.functionName).toBe('approve(address,uint256)');
      expect(result.parameters).toHaveLength(2);
    });

    it('should parse Uniswap swap', () => {
      const txRequest: TransactionRequest = {
        to: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
        value: '0x0',
        data: '0x38ed1739000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
      };

      const result = TransactionParser.parseTransaction(txRequest);

      expect(result.type).toBe(TransactionType.SWAP);
      expect(result.functionSignature).toBe('38ed1739');
      expect(result.functionName).toBe('swapExactTokensForTokens(uint256,uint256,address[],address,uint256)');
    });

    it('should handle unknown function signatures', () => {
      const txRequest: TransactionRequest = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        value: '0x0',
        data: '0x12345678000000000000000000000000000000000000000000000000000000000000000'
      };

      const result = TransactionParser.parseTransaction(txRequest);

      expect(result.type).toBe(TransactionType.UNKNOWN);
      expect(result.functionSignature).toBe('12345678');
      expect(result.functionName).toBeUndefined();
    });
  });

  describe('formatValue', () => {
    it('should format wei to ether correctly', () => {
      expect(TransactionParser.formatValue('1000000000000000000')).toBe('1.0');
      expect(TransactionParser.formatValue('100000000000000000')).toBe('0.1');
      expect(TransactionParser.formatValue('0')).toBe('0');
    });

    it('should handle custom decimals', () => {
      expect(TransactionParser.formatValue('1000000', 6)).toBe('1.0'); // USDC has 6 decimals
      expect(TransactionParser.formatValue('100000000', 8)).toBe('1.0'); // WBTC has 8 decimals
    });
  });

  describe('extractTokenAddresses', () => {
    it('should extract token addresses from swap parameters', () => {
      const parameters = [
        '1000000000000000000',
        '900000000000000000',
        ['0xA0b86a33E6441b8435b662f0E2d0B5B0B5B5B5B5', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'],
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        '1640995200'
      ];

      const addresses = TransactionParser.extractTokenAddresses(parameters, 'swapExactTokensForTokens');
      
      expect(addresses).toHaveLength(2);
      expect(addresses[0]).toBe('0xA0b86a33E6441b8435b662f0E2d0B5B0B5B5B5B5');
      expect(addresses[1]).toBe('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    });

    it('should return empty array for non-swap functions', () => {
      const parameters = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '1000000000000000000'];
      const addresses = TransactionParser.extractTokenAddresses(parameters, 'transfer');
      
      expect(addresses).toHaveLength(0);
    });
  });

  describe('extractAmounts', () => {
    it('should extract amounts from swap parameters', () => {
      const parameters = ['1000000000000000000', '900000000000000000'];
      const amounts = TransactionParser.extractAmounts(parameters, 'swapExactTokensForTokens');
      
      expect(amounts.amountIn).toBe('1000000000000000000');
      expect(amounts.amountMin).toBe('900000000000000000');
    });

    it('should extract amounts from transfer parameters', () => {
      const parameters = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '1000000000000000000'];
      const amounts = TransactionParser.extractAmounts(parameters, 'transfer');
      
      expect(amounts.amountIn).toBe('1000000000000000000');
    });

    it('should extract amounts from approval parameters', () => {
      const parameters = ['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', '1000000000000000000'];
      const amounts = TransactionParser.extractAmounts(parameters, 'approve');
      
      expect(amounts.amountIn).toBe('1000000000000000000');
    });
  });
});