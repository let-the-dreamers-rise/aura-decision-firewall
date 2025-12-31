import { useState } from 'react';
import { WalletConnection, TransactionReview, DecisionHistory, ErrorBoundary, ToastContainer, LoadingButton, DemoScenarioSelector } from './components';
import { DemoScenario } from './utils/demoScenarios';
import { useMetaMask } from './hooks/useMetaMask';
import { useTransactionInterceptor } from './hooks/useTransactionInterceptor';
import { useToast } from './hooks/useToast';
import { TransactionParser } from './utils/transactionParser';
import { IntentAnalyzer } from './utils/intentAnalyzer';
import { analyzeRiskIndicators } from './utils/riskIndicators';
import { decisionLogger } from './utils/decisionLogger';
import { TransactionContext } from './types';
import { MOCK_TRANSACTIONS, MockTransaction } from './mocks/mockTransactions';

function App() {
  const { isConnected, address } = useMetaMask();
  const { 
    pendingTransaction, 
    isIntercepting, 
    isAnalyzing, 
    approveTransaction, 
    rejectTransaction 
  } = useTransactionInterceptor();
  const { toasts, removeToast, showSuccess, showError, showWarning } = useToast();
  const [currentView, setCurrentView] = useState<'main' | 'demo-selector' | 'demo-review' | 'mock-review'>('main');
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<DemoScenario | null>(null);
  const [isTestingTransaction, setIsTestingTransaction] = useState(false);
  
  // MOCK TRANSACTION STATE - For development and demo
  const [currentTransaction, setCurrentTransaction] = useState<TransactionContext | null>(null);
  const [isAnalyzingMock, setIsAnalyzingMock] = useState(false);

  // Handle demo scenario selection
  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setSelectedDemoScenario(scenario);
    setCurrentView('demo-review');
  };

  // MOCK TRANSACTION HANDLERS - For development and demo
  const handleLoadMockTransaction = async (mockTx: MockTransaction) => {
    setIsAnalyzingMock(true);
    
    try {
      console.log('🧪 Loading mock transaction:', mockTx.name);
      
      // Step 1: Parse the mock transaction using the same pipeline as real transactions
      const parsedTx = TransactionParser.parseTransaction({
        to: mockTx.to,
        value: mockTx.value,
        data: mockTx.data,
        from: mockTx.from,
        gas: mockTx.gas,
        gasPrice: mockTx.gasPrice
      });
      
      // Step 2: Analyze intent using the same logic
      const intent = IntentAnalyzer.analyzeIntent(parsedTx);
      
      // Step 3: Convert value from wei to ETH for risk analysis
      const valueInWei = BigInt(parsedTx.value || '0');
      const valueInEth = (Number(valueInWei) / 1e18).toString();
      
      // Step 4: Analyze risk indicators
      // Pass transaction data to properly determine if this is a contract interaction
      const riskIndicators = await analyzeRiskIndicators(
        mockTx.to,
        undefined, // tokenAddress
        valueInEth, // Now properly in ETH
        mockTx.data // transaction data
      );
      
      // Step 5: Create transaction context
      const transactionContext: TransactionContext = {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`, // Generate fake hash for demo
        type: parsedTx.type,
        recipient: parsedTx.to,
        value: parsedTx.value || '0',
        intent: intent.intent,
        estimatedOutcome: intent.estimatedOutcome || 'Transaction will be processed',
        riskIndicators: riskIndicators,
        timestamp: Date.now()
      };
      
      setCurrentTransaction(transactionContext);
      setCurrentView('mock-review');
      
      console.log('✅ Mock transaction analysis complete:', transactionContext);
      
    } catch (error) {
      console.error('❌ Mock transaction analysis failed:', error);
      showError('Failed to analyze mock transaction');
    } finally {
      setIsAnalyzingMock(false);
    }
  };

  const handleMockApprove = async () => {
    if (currentTransaction && address) {
      console.log('✅ Mock transaction approved:', currentTransaction.hash);
      
      // Log to Mantle L2 with isDemo flag
      try {
        await decisionLogger.logDecision({
          transactionHash: currentTransaction.hash,
          userChoice: 'approved',
          riskLevel: currentTransaction.riskIndicators.some(r => r.severity === 'warning') ? 'medium' : 'low',
          userAddress: address,
          isDemo: true,
        });
        showSuccess('Mock transaction approved and logged to Mantle L2!');
      } catch (error) {
        console.error('Failed to log to Mantle:', error);
        showSuccess('Mock transaction approved! (Logged locally)');
      }
      
      setCurrentView('main');
      setCurrentTransaction(null);
    }
  };

  const handleMockReject = async () => {
    if (currentTransaction && address) {
      console.log('❌ Mock transaction rejected:', currentTransaction.hash);
      
      // Log to Mantle L2 with isDemo flag
      try {
        await decisionLogger.logDecision({
          transactionHash: currentTransaction.hash,
          userChoice: 'rejected',
          riskLevel: currentTransaction.riskIndicators.some(r => r.severity === 'warning') ? 'high' : 'medium',
          userAddress: address,
          isDemo: true,
        });
        showWarning('Mock transaction cancelled and logged to Mantle L2!');
      } catch (error) {
        console.error('Failed to log to Mantle:', error);
        showWarning('Mock transaction cancelled! (Logged locally)');
      }
      
      setCurrentView('main');
      setCurrentTransaction(null);
    }
  };

  const handleDemoApprove = async () => {
    if (selectedDemoScenario && address) {
      console.log(`Demo scenario "${selectedDemoScenario.name}" approved`);
      
      // Log to Mantle L2 with isDemo flag
      try {
        await decisionLogger.logDecision({
          transactionHash: selectedDemoScenario.transaction.hash,
          userChoice: 'approved',
          riskLevel: selectedDemoScenario.category === 'risky' ? 'high' : selectedDemoScenario.category === 'complex' ? 'medium' : 'low',
          userAddress: address,
          isDemo: true,
        });
        showSuccess(`Demo transaction "${selectedDemoScenario.name}" approved and logged!`);
      } catch (error) {
        console.error('Failed to log to Mantle:', error);
        showSuccess(`Demo transaction "${selectedDemoScenario.name}" approved!`);
      }
      
      // Return to scenario selector
      setTimeout(() => setCurrentView('demo-selector'), 2000);
    }
  };

  const handleDemoReject = async () => {
    if (selectedDemoScenario && address) {
      console.log(`Demo scenario "${selectedDemoScenario.name}" rejected`);
      
      // Log to Mantle L2 with isDemo flag
      try {
        await decisionLogger.logDecision({
          transactionHash: selectedDemoScenario.transaction.hash,
          userChoice: 'rejected',
          riskLevel: selectedDemoScenario.category === 'risky' ? 'high' : selectedDemoScenario.category === 'complex' ? 'medium' : 'low',
          userAddress: address,
          isDemo: true,
        });
        showWarning(`Demo transaction "${selectedDemoScenario.name}" cancelled and logged!`);
      } catch (error) {
        console.error('Failed to log to Mantle:', error);
        showWarning(`Demo transaction "${selectedDemoScenario.name}" cancelled!`);
      }
      
      // Return to scenario selector
      setTimeout(() => setCurrentView('demo-selector'), 2000);
    }
  };

  // Handle real transaction interception
  const handleRealApprove = async () => {
    try {
      console.log('Real transaction approved');
      await approveTransaction();
      showSuccess('Transaction approved and logged to Mantle L2');
    } catch (error) {
      console.error('Error approving transaction:', error);
      showError('Failed to approve transaction. Please try again.');
    }
  };

  const handleRealReject = async () => {
    try {
      console.log('Real transaction rejected');
      await rejectTransaction();
      showWarning('Transaction cancelled and logged to Mantle L2');
    } catch (error) {
      console.error('Error rejecting transaction:', error);
      showError('Failed to cancel transaction. Please try again.');
    }
  };

  // Show transaction interception screen if we have a pending transaction
  if (isIntercepting && pendingTransaction) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AURA Transaction Analysis
              </div>
            </div>
            
            <TransactionReview
              transaction={pendingTransaction.context}
              onApprove={handleRealApprove}
              onReject={handleRealReject}
              isProcessing={isAnalyzing}
            />
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </ErrorBoundary>
    );
  }

  // Show demo scenario selector
  if (currentView === 'demo-selector') {
    return (
      <ErrorBoundary>
        <DemoScenarioSelector
          onSelectScenario={handleSelectDemoScenario}
          onBack={() => setCurrentView('main')}
        />
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </ErrorBoundary>
    );
  }

  // Show mock transaction review
  if (currentView === 'mock-review' && currentTransaction) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg mb-4">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                🧪 Mock Transaction Analysis (Development Mode)
              </div>
              <LoadingButton
                isLoading={false}
                onClick={() => setCurrentView('main')}
                variant="secondary"
                size="md"
              >
                ← Back to Main
              </LoadingButton>
            </div>
            
            <TransactionReview
              transaction={currentTransaction}
              onApprove={handleMockApprove}
              onReject={handleMockReject}
              isProcessing={isAnalyzingMock}
            />

            {/* Development Notes */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                🔧 Development Notes
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• This transaction was processed through the same parsing + intent pipeline as real transactions</li>
                <li>• No blockchain calls were made - all analysis is local</li>
                <li>• Risk indicators use cached/mocked data for development speed</li>
                <li>• Approving/rejecting will not execute any real transaction</li>
              </ul>
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </ErrorBoundary>
    );
  }

  // Show demo transaction review
  if (currentView === 'demo-review' && selectedDemoScenario) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg mb-4">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Demo Scenario: {selectedDemoScenario.name}
              </div>
              <LoadingButton
                isLoading={false}
                onClick={() => setCurrentView('demo-selector')}
                variant="secondary"
                size="md"
              >
                ← Back to Scenarios
              </LoadingButton>
            </div>
            
            <TransactionReview
              transaction={selectedDemoScenario.transaction}
              onApprove={handleDemoApprove}
              onReject={handleDemoReject}
              isProcessing={false}
            />

            {/* Demo Notes */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">
                📝 Demo Notes
              </h3>
              <ul className="space-y-2">
                {selectedDemoScenario.demoNotes.map((note, index) => (
                  <li key={index} className="flex items-start text-blue-800">
                    <span className="text-blue-500 mr-2 mt-1">•</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
              {selectedDemoScenario.expectedUserAction && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    Expected Action: 
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    selectedDemoScenario.expectedUserAction === 'approve' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedDemoScenario.expectedUserAction.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          {/* Main Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              AURA AI Decision Firewall
            </h1>
            <p className="text-gray-600 mb-6">
              Transaction transparency through AI-powered intent explanation
            </p>
            
            <WalletConnection className="mb-6" />
            
            {isConnected ? (
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-500 mb-4">
                  Wallet connected! Ready to analyze transactions.
                </div>
                
                <LoadingButton
                  isLoading={false}
                  onClick={() => setCurrentView('demo-selector')}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  View Demo Scenarios
                </LoadingButton>

                {/* MOCK TRANSACTION BUTTONS - For Development */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-center text-sm text-gray-600 mb-3">
                    🧪 Development Mode - Mock Transactions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[0])} // ETH Transfer
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      ETH Transfer
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[1])} // USDC Approval
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      USDC Approval
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[3])} // Uniswap Swap
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      Uniswap Swap
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[4])} // High Value
                      variant="warning"
                      size="md"
                      className="text-sm"
                    >
                      High Value (50 ETH)
                    </LoadingButton>
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    These mock transactions flow through the same analysis pipeline as real ones
                  </div>
                </div>

                <LoadingButton
                  isLoading={isTestingTransaction}
                  onClick={async () => {
                    setIsTestingTransaction(true);
                    try {
                      // Trigger a test transaction to demonstrate interception
                      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
                      await window.ethereum?.request({
                        method: 'eth_sendTransaction',
                        params: [{
                          from: accounts?.[0],
                          to: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6',
                          value: '0x16345785D8A0000', // 0.1 ETH in hex
                          data: '0x'
                        }]
                      });
                    } catch (error: any) {
                      console.log('Transaction cancelled or failed:', error);
                      if (error.code === 4001) {
                        showWarning('Transaction cancelled by user');
                      } else if (error.message?.includes('cancelled')) {
                        showWarning('Transaction cancelled by AURA analysis');
                      } else {
                        showError('Transaction failed: ' + (error.message || 'Unknown error'));
                      }
                    } finally {
                      setIsTestingTransaction(false);
                    }
                  }}
                  variant="success"
                  size="lg"
                  className="w-full"
                >
                  Test Transaction Interception
                </LoadingButton>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">
                Connect your wallet to start analyzing transactions
              </div>
            )}
          </div>

          {/* Decision History Card */}
          {isConnected && <DecisionHistory />}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ErrorBoundary>
  );
}

export default App;