import { useState, useEffect, useCallback } from 'react';
import { TransactionContext } from '../types';
import { TransactionParser } from '../utils/transactionParser';
import { IntentAnalyzer } from '../utils/intentAnalyzer';
import { analyzeRiskIndicators } from '../utils/riskIndicators';
import { decisionLogger } from '../utils/decisionLogger';

interface PendingTransaction {
  id: string;
  rawTransaction: any;
  context: TransactionContext;
  resolve: (approved: boolean) => void;
  reject: (error: Error) => void;
}

interface TransactionInterceptorState {
  pendingTransaction: PendingTransaction | null;
  isIntercepting: boolean;
  isAnalyzing: boolean;
}

export const useTransactionInterceptor = () => {
  const [state, setState] = useState<TransactionInterceptorState>({
    pendingTransaction: null,
    isIntercepting: false,
    isAnalyzing: false,
  });

  // Helper function to determine overall risk level
  const determineRiskLevel = useCallback((riskIndicators: any[]): 'low' | 'medium' | 'high' => {
    if (!riskIndicators || riskIndicators.length === 0) {
      return 'low';
    }

    const hasWarning = riskIndicators.some(indicator => indicator.severity === 'warning');
    const warningCount = riskIndicators.filter(indicator => indicator.severity === 'warning').length;

    if (warningCount >= 2) {
      return 'high';
    } else if (hasWarning) {
      return 'medium';
    } else {
      return 'low';
    }
  }, []);

  // Analyze a raw transaction and create context
  const analyzeTransaction = useCallback(async (rawTransaction: any): Promise<TransactionContext> => {
    setState(prev => ({ ...prev, isAnalyzing: true }));

    try {
      // Parse the transaction
      const parsedTx = TransactionParser.parseTransaction(rawTransaction);
      
      // Analyze intent
      const intentAnalysis = IntentAnalyzer.analyzeIntent(parsedTx);
      
      // Analyze risk indicators
      const riskIndicators = await analyzeRiskIndicators(
        rawTransaction.to || '',
        undefined, // tokenAddress - would need to extract from transaction data
        rawTransaction.value ? (parseInt(rawTransaction.value, 16) / 1e18).toString() : '0',
        rawTransaction.data || '0x'
      );

      const context: TransactionContext = {
        hash: rawTransaction.hash || `pending_${Date.now()}`,
        type: parsedTx.type,
        recipient: rawTransaction.to || '',
        value: rawTransaction.value ? (parseInt(rawTransaction.value, 16) / 1e18).toString() : '0',
        intent: intentAnalysis.intent,
        estimatedOutcome: intentAnalysis.estimatedOutcome,
        riskIndicators,
        timestamp: Date.now(),
      };

      return context;
    } finally {
      setState(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  // Intercept a transaction request
  const interceptTransaction = useCallback(async (rawTransaction: any): Promise<boolean> => {
    return new Promise(async (resolve, reject) => {
      try {
        const context = await analyzeTransaction(rawTransaction);
        
        const pendingTx: PendingTransaction = {
          id: `tx_${Date.now()}`,
          rawTransaction,
          context,
          resolve,
          reject,
        };

        setState(prev => ({
          ...prev,
          pendingTransaction: pendingTx,
          isIntercepting: true,
        }));
      } catch (error) {
        reject(error as Error);
      }
    });
  }, [analyzeTransaction]);

  // User approves the transaction
  const approveTransaction = useCallback(async () => {
    if (state.pendingTransaction) {
      // Log the decision
      try {
        const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
        const userAddress = accounts?.[0] || '';
        await decisionLogger.logDecision({
          transactionHash: state.pendingTransaction.context.hash,
          userChoice: 'approved',
          riskLevel: determineRiskLevel(state.pendingTransaction.context.riskIndicators),
          userAddress,
        });
      } catch (error) {
        console.error('Failed to log approval decision:', error);
      }

      state.pendingTransaction.resolve(true);
      setState(prev => ({
        ...prev,
        pendingTransaction: null,
        isIntercepting: false,
      }));
    }
  }, [state.pendingTransaction]);

  // User rejects the transaction
  const rejectTransaction = useCallback(async () => {
    if (state.pendingTransaction) {
      // Log the decision
      try {
        const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
        const userAddress = accounts?.[0] || '';
        await decisionLogger.logDecision({
          transactionHash: state.pendingTransaction.context.hash,
          userChoice: 'rejected',
          riskLevel: determineRiskLevel(state.pendingTransaction.context.riskIndicators),
          userAddress,
        });
      } catch (error) {
        console.error('Failed to log rejection decision:', error);
      }

      state.pendingTransaction.resolve(false);
      setState(prev => ({
        ...prev,
        pendingTransaction: null,
        isIntercepting: false,
      }));
    }
  }, [state.pendingTransaction]);

  // Set up MetaMask transaction interception
  useEffect(() => {
    // Initialize decision logger
    decisionLogger.initialize();

    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const originalRequest = window.ethereum.request;

    // Override the request method to intercept transactions
    window.ethereum.request = async (args: { method: string; params?: any[] }) => {
      // Intercept transaction sending methods
      if (args.method === 'eth_sendTransaction' && args.params && args.params.length > 0) {
        const transaction = args.params[0];
        
        try {
          // Show AURA review screen and wait for user decision
          const approved = await interceptTransaction(transaction);
          
          if (approved) {
            // User approved, proceed with original request
            return originalRequest.call(window.ethereum, args);
          } else {
            // User rejected, throw error to cancel transaction
            throw new Error('Transaction cancelled by user');
          }
        } catch (error) {
          // If analysis fails, fall back to original behavior
          console.error('Transaction analysis failed:', error);
          return originalRequest.call(window.ethereum, args);
        }
      }

      // For all other methods, use original request
      return originalRequest.call(window.ethereum, args);
    };

    // Cleanup function to restore original request method
    return () => {
      if (window.ethereum) {
        window.ethereum.request = originalRequest;
      }
    };
  }, [interceptTransaction]);

  return {
    ...state,
    approveTransaction,
    rejectTransaction,
  };
};