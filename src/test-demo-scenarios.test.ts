import { describe, it, expect, beforeEach, vi } from 'vitest';
import { demoScenarios, getDemoScenarioById, getDemoScenariosByCategory } from './utils/demoScenarios';
import { MOCK_TRANSACTIONS, getMockTransaction, getAllMockTransactions } from './mocks/mockTransactions';
import { TransactionParser } from './utils/transactionParser';
import { IntentAnalyzer } from './utils/intentAnalyzer';
import { analyzeRiskIndicators } from './utils/riskIndicators';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('Demo Scenarios and Mock Transactions Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API responses
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('eth_getCode')) {
        // Mock contract code check - return empty for EOAs, non-empty for contracts
        if (url.includes('0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6') || 
            url.includes('0xA0b86a33E6441e6e80D0c4C96C5C2e5c5e5c5e5c')) {
          return Promise.resolve({ json: () => Promise.resolve({ result: '0x' }) }); // EOA
        } else {
          return Promise.resolve({ json: () => Promise.resolve({ result: '0x608060405234801561001057600080fd5b50' }) }); // Contract
        }
      }
      
      if (url.includes('getsourcecode')) {
        // Mock contract verification
        return Promise.resolve({
          json: () => Promise.resolve({
            status: '1',
            result: [{
              SourceCode: 'contract verified',
              ABI: '[]',
              ContractName: 'TestContract'
            }]
          })
        });
      }
      
      // Default mock response
      return Promise.resolve({
        json: () => Promise.resolve({ status: '1', result: [] })
      });
    });
  });

  describe('Demo Scenarios Functionality', () => {
    it('should have all expected demo scenarios', () => {
      expect(demoScenarios).toHaveLength(5);
      
      const scenarioIds = demoScenarios.map(s => s.id);
      expect(scenarioIds).toContain('safe-usdc-transfer');
      expect(scenarioIds).toContain('risky-new-token-swap');
      expect(scenarioIds).toContain('complex-defi-interaction');
      expect(scenarioIds).toContain('suspicious-approval');
      expect(scenarioIds).toContain('nft-purchase');
    });

    it('should retrieve scenarios by ID', () => {
      const safeScenario = getDemoScenarioById('safe-usdc-transfer');
      expect(safeScenario).toBeDefined();
      expect(safeScenario?.name).toBe('Safe USDC Transfer');
      expect(safeScenario?.category).toBe('safe');
    });

    it('should filter scenarios by category', () => {
      const safeScenarios = getDemoScenariosByCategory('safe');
      const riskyScenarios = getDemoScenariosByCategory('risky');
      const complexScenarios = getDemoScenariosByCategory('complex');

      expect(safeScenarios).toHaveLength(2); // safe-usdc-transfer, nft-purchase
      expect(riskyScenarios).toHaveLength(2); // risky-new-token-swap, suspicious-approval
      expect(complexScenarios).toHaveLength(1); // complex-defi-interaction
    });

    it('should have properly formatted transaction contexts', () => {
      demoScenarios.forEach(scenario => {
        const tx = scenario.transaction;
        
        // Check required fields
        expect(tx.hash).toBeDefined();
        expect(tx.type).toBeDefined();
        expect(tx.recipient).toBeDefined();
        expect(tx.intent).toBeDefined();
        expect(tx.estimatedOutcome).toBeDefined();
        expect(tx.riskIndicators).toBeDefined();
        expect(Array.isArray(tx.riskIndicators)).toBe(true);
        expect(tx.timestamp).toBeDefined();

        // Check risk indicators format
        tx.riskIndicators.forEach(indicator => {
          expect(indicator.type).toBeDefined();
          expect(indicator.severity).toMatch(/^(info|warning)$/);
          expect(indicator.message).toBeDefined();
          expect(indicator.source).toBeDefined();
        });
      });
    });
  });

  describe('Mock Transactions Functionality', () => {
    it('should have all expected mock transactions', () => {
      expect(MOCK_TRANSACTIONS).toHaveLength(6);
      
      const transactionIds = MOCK_TRANSACTIONS.map(tx => tx.id);
      expect(transactionIds).toContain('eth-transfer');
      expect(transactionIds).toContain('erc20-approve');
      expect(transactionIds).toContain('erc20-transfer');
      expect(transactionIds).toContain('uniswap-swap');
      expect(transactionIds).toContain('high-value-transfer');
      expect(transactionIds).toContain('unknown-contract');
    });

    it('should retrieve mock transactions by ID', () => {
      const ethTransfer = getMockTransaction('eth-transfer');
      expect(ethTransfer).toBeDefined();
      expect(ethTransfer?.name).toBe('ETH Transfer');
      expect(ethTransfer?.to).toBe('0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6');
    });

    it('should have properly formatted transaction objects', () => {
      getAllMockTransactions().forEach(tx => {
        // Check required fields
        expect(tx.id).toBeDefined();
        expect(tx.name).toBeDefined();
        expect(tx.description).toBeDefined();
        expect(tx.to).toBeDefined();
        expect(tx.value).toBeDefined();
        expect(tx.data).toBeDefined();
        expect(tx.from).toBeDefined();
        expect(tx.gas).toBeDefined();
        expect(tx.gasPrice).toBeDefined();

        // Check hex format
        expect(tx.value).toMatch(/^0x[0-9a-fA-F]*$/);
        expect(tx.data).toMatch(/^0x[0-9a-fA-F]*$/);
        expect(tx.gas).toMatch(/^0x[0-9a-fA-F]+$/);
        expect(tx.gasPrice).toMatch(/^0x[0-9a-fA-F]+$/);
      });
    });
  });

  describe('Mock Transaction Analysis Pipeline', () => {
    it('should correctly analyze ETH transfer mock transaction', async () => {
      const ethTransfer = getMockTransaction('eth-transfer')!;
      
      // Parse transaction
      const parsedTx = TransactionParser.parseTransaction(ethTransfer);
      expect(parsedTx.type).toBe('transfer');
      
      // Analyze intent
      const intent = IntentAnalyzer.analyzeIntent(parsedTx);
      expect(intent.intent).toContain('Send');
      expect(intent.intent).toContain('ETH');
      
      // Analyze risk indicators with new logic
      const riskIndicators = await analyzeRiskIndicators(
        ethTransfer.to,
        undefined,
        (parseInt(ethTransfer.value, 16) / 1e18).toString(),
        ethTransfer.data
      );
      
      expect(riskIndicators).toBeDefined();
      expect(Array.isArray(riskIndicators)).toBe(true);
      
      // Should show "Simple ETH transfer" for basic ETH transfer
      const simpleTransferIndicator = riskIndicators.find(r => 
        r.message.includes('Simple ETH transfer')
      );
      expect(simpleTransferIndicator).toBeDefined();
      expect(simpleTransferIndicator?.severity).toBe('info');
    });

    it('should correctly analyze ERC-20 approval mock transaction', async () => {
      const approval = getMockTransaction('erc20-approve')!;
      
      // Parse transaction
      const parsedTx = TransactionParser.parseTransaction(approval);
      expect(parsedTx.type).toBe('approval');
      
      // Analyze intent
      const intent = IntentAnalyzer.analyzeIntent(parsedTx);
      expect(intent.intent).toContain('approval');
      
      // Analyze risk indicators
      const riskIndicators = await analyzeRiskIndicators(
        approval.to,
        undefined,
        (parseInt(approval.value, 16) / 1e18).toString(),
        approval.data
      );
      
      expect(riskIndicators).toBeDefined();
      // Should check contract verification since there's transaction data
      const contractIndicator = riskIndicators.find(r => 
        r.type === 'unverified_contract'
      );
      expect(contractIndicator).toBeDefined();
    });

    it('should correctly analyze high-value transfer mock transaction', async () => {
      const highValueTx = getMockTransaction('high-value-transfer')!;
      
      // Parse transaction
      const parsedTx = TransactionParser.parseTransaction(highValueTx);
      expect(parsedTx.type).toBe('transfer');
      
      // Analyze risk indicators
      const riskIndicators = await analyzeRiskIndicators(
        highValueTx.to,
        undefined,
        (parseInt(highValueTx.value, 16) / 1e18).toString(),
        highValueTx.data
      );
      
      // Should have high value warning
      const highValueIndicator = riskIndicators.find(r => 
        r.type === 'high_value'
      );
      expect(highValueIndicator).toBeDefined();
      expect(highValueIndicator?.severity).toBe('warning');
      expect(highValueIndicator?.message).toContain('50');
    });

    it('should correctly analyze unknown contract mock transaction', async () => {
      const unknownContract = getMockTransaction('unknown-contract')!;
      
      // Parse transaction
      const parsedTx = TransactionParser.parseTransaction(unknownContract);
      expect(parsedTx.type).toBe('unknown');
      
      // Analyze risk indicators
      const riskIndicators = await analyzeRiskIndicators(
        unknownContract.to,
        undefined,
        (parseInt(unknownContract.value, 16) / 1e18).toString(),
        unknownContract.data
      );
      
      // Should check contract verification since there's transaction data
      const contractIndicator = riskIndicators.find(r => 
        r.type === 'unverified_contract'
      );
      expect(contractIndicator).toBeDefined();
    });
  });

  describe('Integration with Updated Risk Logic', () => {
    it('should not show contract warnings for simple ETH transfers', async () => {
      const ethTransfer = getMockTransaction('eth-transfer')!;
      
      const riskIndicators = await analyzeRiskIndicators(
        ethTransfer.to,
        undefined,
        (parseInt(ethTransfer.value, 16) / 1e18).toString(),
        ethTransfer.data // '0x' - no transaction data
      );
      
      // Should NOT have contract verification warnings
      const contractWarnings = riskIndicators.filter(r => 
        r.message.includes('Unable to verify') || 
        r.message.includes('Contract Status Unknown')
      );
      expect(contractWarnings).toHaveLength(0);
      
      // Should have positive indicator for simple transfer
      const positiveIndicator = riskIndicators.find(r => 
        r.message.includes('Simple ETH transfer')
      );
      expect(positiveIndicator).toBeDefined();
    });

    it('should show contract warnings for contract interactions', async () => {
      const contractTx = getMockTransaction('erc20-approve')!;
      
      const riskIndicators = await analyzeRiskIndicators(
        contractTx.to,
        undefined,
        (parseInt(contractTx.value, 16) / 1e18).toString(),
        contractTx.data // Has transaction data - contract interaction
      );
      
      // Should have contract verification check
      const contractIndicator = riskIndicators.find(r => 
        r.type === 'unverified_contract'
      );
      expect(contractIndicator).toBeDefined();
    });

    it('should detect suspicious transaction data to non-contract', async () => {
      // Create a scenario where transaction data is sent to an EOA
      const suspiciousTx = {
        to: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6', // EOA
        value: '0x0',
        data: '0xa9059cbb', // Contract call data
        from: '0x8ba1f109551bD432803012645Hac136c30C6A0',
        gas: '0x5208',
        gasPrice: '0x9184e72a000'
      };
      
      const riskIndicators = await analyzeRiskIndicators(
        suspiciousTx.to,
        undefined,
        (parseInt(suspiciousTx.value, 16) / 1e18).toString(),
        suspiciousTx.data
      );
      
      // Should detect suspicious pattern
      const suspiciousIndicator = riskIndicators.find(r => 
        r.message.includes('Transaction data sent to non-contract address')
      );
      expect(suspiciousIndicator).toBeDefined();
      expect(suspiciousIndicator?.severity).toBe('warning');
    });
  });

  describe('Demo Scenarios Risk Indicator Validation', () => {
    it('should validate safe USDC transfer scenario', () => {
      const scenario = getDemoScenarioById('safe-usdc-transfer')!;
      
      expect(scenario.category).toBe('safe');
      expect(scenario.expectedUserAction).toBe('approve');
      
      // Should have appropriate risk indicators
      const indicators = scenario.transaction.riskIndicators;
      expect(indicators.some(r => r.severity === 'info')).toBe(true);
      expect(indicators.some(r => r.severity === 'warning')).toBe(false);
    });

    it('should validate risky new token swap scenario', () => {
      const scenario = getDemoScenarioById('risky-new-token-swap')!;
      
      expect(scenario.category).toBe('risky');
      expect(scenario.expectedUserAction).toBe('reject');
      
      // Should have multiple warning indicators
      const indicators = scenario.transaction.riskIndicators;
      const warnings = indicators.filter(r => r.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(1);
      
      // Should have high value, new token, and liquidity warnings
      expect(indicators.some(r => r.type === 'high_value')).toBe(true);
      expect(indicators.some(r => r.type === 'new_token')).toBe(true);
      expect(indicators.some(r => r.type === 'no_dex_pool')).toBe(true);
    });

    it('should validate suspicious approval scenario', () => {
      const scenario = getDemoScenarioById('suspicious-approval')!;
      
      expect(scenario.category).toBe('risky');
      expect(scenario.expectedUserAction).toBe('reject');
      expect(scenario.transaction.type).toBe('approval');
      
      // Should have contract and timing warnings
      const indicators = scenario.transaction.riskIndicators;
      expect(indicators.some(r => r.type === 'unverified_contract')).toBe(true);
      expect(indicators.some(r => r.type === 'new_token')).toBe(true);
    });
  });
});