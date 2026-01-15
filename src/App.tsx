import { useState, useEffect } from 'react';
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

type AppMode = 'simulation' | 'live';
type ViewState = 'main' | 'demo-selector' | 'demo-review' | 'mock-review';

function App() {
  const { isConnected, address, connect } = useMetaMask();
  const { 
    pendingTransaction, 
    isIntercepting, 
    isAnalyzing, 
    approveTransaction, 
    rejectTransaction 
  } = useTransactionInterceptor();
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast();
  
  // App mode: simulation (default) or live (wallet connected)
  const [appMode, setAppMode] = useState<AppMode>('simulation');
  const [currentView, setCurrentView] = useState<ViewState>('main');
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<DemoScenario | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<TransactionContext | null>(null);
  const [isAnalyzingMock, setIsAnalyzingMock] = useState(false);
  const [isTestingTransaction, setIsTestingTransaction] = useState(false);

  // Auto-switch to live mode when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setAppMode('live');
      showInfo('Switched to Live Mode - wallet connected');
    }
  }, [isConnected, address]);

  // Handle switching to live mode
  const handleSwitchToLive = async () => {
    try {
      await connect();
    } catch (error) {
      showError('Failed to connect wallet');
    }
  };

  // Handle switching back to simulation mode
  const handleSwitchToSimulation = () => {
    setAppMode('simulation');
    setCurrentView('main');
    showInfo('Switched to Simulation Mode');
  };

  // Handle demo scenario selection
  const handleSelectDemoScenario = (scenario: DemoScenario) => {
    setSelectedDemoScenario(scenario);
    setCurrentView('demo-review');
  };

  // MOCK TRANSACTION HANDLERS - Works in both modes
  const handleLoadMockTransaction = async (mockTx: MockTransaction) => {
    setIsAnalyzingMock(true);
    
    try {
      console.log('🧪 Loading mock transaction:', mockTx.name);
      
      const parsedTx = TransactionParser.parseTransaction({
        to: mockTx.to,
        value: mockTx.value,
        data: mockTx.data,
        from: mockTx.from,
        gas: mockTx.gas,
        gasPrice: mockTx.gasPrice
      });
      
      const intent = IntentAnalyzer.analyzeIntent(parsedTx);
      const valueInWei = BigInt(parsedTx.value || '0');
      const valueInEth = (Number(valueInWei) / 1e18).toString();
      
      // Use mock risk indicators in simulation mode (no RPC calls)
      const riskIndicators = appMode === 'simulation' 
        ? getMockRiskIndicators(mockTx)
        : await analyzeRiskIndicators(mockTx.to, undefined, valueInEth, mockTx.data);
      
      const transactionContext: TransactionContext = {
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
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
      
    } catch (error) {
      console.error('❌ Mock transaction analysis failed:', error);
      showError('Failed to analyze transaction');
    } finally {
      setIsAnalyzingMock(false);
    }
  };

  // Mock risk indicators for simulation mode (no RPC dependency)
  const getMockRiskIndicators = (mockTx: MockTransaction) => {
    const indicators: any[] = [];
    
    // Check for high value
    const valueInWei = BigInt(mockTx.value || '0');
    const valueInEth = Number(valueInWei) / 1e18;
    if (valueInEth > 1) {
      indicators.push({
        type: 'high_value',
        severity: valueInEth > 10 ? 'warning' : 'info',
        message: `High value transaction: ${valueInEth.toFixed(2)} ETH`,
        source: 'Value Analysis'
      });
    }
    
    // Check for unknown contract
    if (mockTx.id === 'unknown-contract') {
      indicators.push({
        type: 'unverified_contract',
        severity: 'warning',
        message: 'Contract is not verified',
        source: 'Simulation'
      });
    }
    
    // Check for approval
    if (mockTx.data.startsWith('0x095ea7b3')) {
      indicators.push({
        type: 'approval',
        severity: 'info',
        message: 'Token approval request',
        source: 'Transaction Analysis'
      });
    }
    
    return indicators;
  };

  const handleMockApprove = async () => {
    if (currentTransaction) {
      console.log('✅ Transaction approved:', currentTransaction.hash);
      
      if (appMode === 'live' && address) {
        try {
          await decisionLogger.logDecision({
            transactionHash: currentTransaction.hash,
            userChoice: 'approved',
            riskLevel: currentTransaction.riskIndicators.some(r => r.severity === 'warning') ? 'medium' : 'low',
            userAddress: address,
            isDemo: true,
          });
          showSuccess('Transaction approved and logged to Mantle L2!');
        } catch (error) {
          showSuccess('Transaction approved! (Logged locally)');
        }
      } else {
        showSuccess('Transaction approved! (Simulation Mode)');
      }
      
      setCurrentView('main');
      setCurrentTransaction(null);
    }
  };

  const handleMockReject = async () => {
    if (currentTransaction) {
      console.log('❌ Transaction rejected:', currentTransaction.hash);
      
      if (appMode === 'live' && address) {
        try {
          await decisionLogger.logDecision({
            transactionHash: currentTransaction.hash,
            userChoice: 'rejected',
            riskLevel: currentTransaction.riskIndicators.some(r => r.severity === 'warning') ? 'high' : 'medium',
            userAddress: address,
            isDemo: true,
          });
          showWarning('Transaction cancelled and logged to Mantle L2!');
        } catch (error) {
          showWarning('Transaction cancelled! (Logged locally)');
        }
      } else {
        showWarning('Transaction cancelled! (Simulation Mode)');
      }
      
      setCurrentView('main');
      setCurrentTransaction(null);
    }
  };

  const handleDemoApprove = async () => {
    if (selectedDemoScenario) {
      console.log(`Demo scenario "${selectedDemoScenario.name}" approved`);
      
      if (appMode === 'live' && address) {
        try {
          await decisionLogger.logDecision({
            transactionHash: selectedDemoScenario.transaction.hash,
            userChoice: 'approved',
            riskLevel: selectedDemoScenario.category === 'risky' ? 'high' : selectedDemoScenario.category === 'complex' ? 'medium' : 'low',
            userAddress: address,
            isDemo: true,
          });
          showSuccess(`"${selectedDemoScenario.name}" approved and logged!`);
        } catch (error) {
          showSuccess(`"${selectedDemoScenario.name}" approved!`);
        }
      } else {
        showSuccess(`"${selectedDemoScenario.name}" approved! (Simulation)`);
      }
      
      setTimeout(() => setCurrentView('demo-selector'), 1500);
    }
  };

  const handleDemoReject = async () => {
    if (selectedDemoScenario) {
      console.log(`Demo scenario "${selectedDemoScenario.name}" rejected`);
      
      if (appMode === 'live' && address) {
        try {
          await decisionLogger.logDecision({
            transactionHash: selectedDemoScenario.transaction.hash,
            userChoice: 'rejected',
            riskLevel: selectedDemoScenario.category === 'risky' ? 'high' : selectedDemoScenario.category === 'complex' ? 'medium' : 'low',
            userAddress: address,
            isDemo: true,
          });
          showWarning(`"${selectedDemoScenario.name}" cancelled and logged!`);
        } catch (error) {
          showWarning(`"${selectedDemoScenario.name}" cancelled!`);
        }
      } else {
        showWarning(`"${selectedDemoScenario.name}" cancelled! (Simulation)`);
      }
      
      setTimeout(() => setCurrentView('demo-selector'), 1500);
    }
  };

  // Handle real transaction interception (Live Mode only)
  const handleRealApprove = async () => {
    try {
      await approveTransaction();
      showSuccess('Transaction approved and logged to Mantle L2');
    } catch (error) {
      showError('Failed to approve transaction');
    }
  };

  const handleRealReject = async () => {
    try {
      await rejectTransaction();
      showWarning('Transaction cancelled and logged to Mantle L2');
    } catch (error) {
      showError('Failed to cancel transaction');
    }
  };

  // Mode Badge Component
  const ModeBadge = () => (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      appMode === 'simulation' 
        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
        : 'bg-green-100 text-green-800 border border-green-200'
    }`}>
      <span className={`w-2 h-2 rounded-full mr-2 ${
        appMode === 'simulation' ? 'bg-purple-500' : 'bg-green-500'
      }`}></span>
      {appMode === 'simulation' ? '🎮 Simulation Mode' : '🔗 Live Wallet Mode'}
    </div>
  );

  // Show transaction interception screen (Live Mode only)
  if (appMode === 'live' && isIntercepting && pendingTransaction) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-100 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <ModeBadge />
              <div className="mt-4 inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
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
        <div className="min-h-screen bg-gray-100">
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <ModeBadge />
            {appMode === 'simulation' && (
              <button
                onClick={handleSwitchToLive}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Connect Wallet →
              </button>
            )}
          </div>
          <DemoScenarioSelector
            onSelectScenario={handleSelectDemoScenario}
            onBack={() => setCurrentView('main')}
          />
        </div>
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
            <div className="mb-6 flex items-center justify-between">
              <ModeBadge />
              <LoadingButton
                isLoading={false}
                onClick={() => setCurrentView('main')}
                variant="secondary"
                size="md"
              >
                ← Back
              </LoadingButton>
            </div>
            
            <TransactionReview
              transaction={currentTransaction}
              onApprove={handleMockApprove}
              onReject={handleMockReject}
              isProcessing={isAnalyzingMock}
            />

            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                {appMode === 'simulation' ? '🎮 Simulation Mode' : '🧪 Demo Transaction'}
              </h3>
              <p className="text-sm text-purple-700">
                {appMode === 'simulation' 
                  ? 'This is a simulated transaction for evaluation. No wallet connection or blockchain interaction required.'
                  : 'This demo transaction uses the same analysis pipeline as real transactions.'}
              </p>
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
            <div className="mb-6 flex items-center justify-between">
              <ModeBadge />
              <LoadingButton
                isLoading={false}
                onClick={() => setCurrentView('demo-selector')}
                variant="secondary"
                size="md"
              >
                ← Back to Scenarios
              </LoadingButton>
            </div>
            
            <div className="mb-4 text-center">
              <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
                📋 {selectedDemoScenario.name}
              </span>
            </div>
            
            <TransactionReview
              transaction={selectedDemoScenario.transaction}
              onApprove={handleDemoApprove}
              onReject={handleDemoReject}
              isProcessing={false}
            />

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📝 Demo Notes</h3>
              <ul className="space-y-2">
                {selectedDemoScenario.demoNotes.map((note, index) => (
                  <li key={index} className="flex items-start text-blue-800">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-sm">{note}</span>
                  </li>
                ))}
              </ul>
              {selectedDemoScenario.expectedUserAction && (
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">Expected Action: </span>
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

  // Main view
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          {/* Main Card */}
          <div className="bg-white p-8 rounded-lg shadow-md">
            {/* Mode Badge */}
            <div className="flex items-center justify-between mb-6">
              <ModeBadge />
              {appMode === 'live' && (
                <button
                  onClick={handleSwitchToSimulation}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Switch to Simulation
                </button>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🛡️ AURA AI Decision Firewall
            </h1>
            <p className="text-gray-600 mb-6">
              Transaction transparency through AI-powered intent explanation
            </p>
            
            {/* Simulation Mode - No wallet required */}
            {appMode === 'simulation' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <p className="text-purple-800 text-sm">
                    <strong>🎮 Simulation Mode:</strong> Explore AURA's capabilities without connecting a wallet. 
                    All features work with simulated data.
                  </p>
                </div>

                <LoadingButton
                  isLoading={false}
                  onClick={() => setCurrentView('demo-selector')}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  🎯 Explore Demo Scenarios
                </LoadingButton>

                {/* Quick Demo Transactions */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-center text-sm text-gray-600 mb-3">
                    Quick Transaction Simulations
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[0])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      ETH Transfer
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[1])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      Token Approval
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[3])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      DEX Swap
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[4])}
                      variant="warning"
                      size="md"
                      className="text-sm"
                    >
                      ⚠️ High Value
                    </LoadingButton>
                  </div>
                </div>

                {/* Connect Wallet CTA */}
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={handleSwitchToLive}
                    className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    🔗 Connect Wallet for Live Mode
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Live Mode enables real transaction interception and Mantle L2 logging
                  </p>
                </div>
              </div>
            )}

            {/* Live Mode - Wallet connected */}
            {appMode === 'live' && (
              <div className="space-y-4">
                <WalletConnection className="mb-4" />
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm">
                    <strong>🔗 Live Mode:</strong> Wallet connected! Real transactions will be intercepted 
                    and decisions logged to Mantle L2.
                  </p>
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

                {/* Mock Transaction Buttons */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-center text-sm text-gray-600 mb-3">
                    Test Transactions
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[0])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      ETH Transfer
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[1])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      Token Approval
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[3])}
                      variant="secondary"
                      size="md"
                      className="text-sm"
                    >
                      DEX Swap
                    </LoadingButton>
                    <LoadingButton
                      isLoading={isAnalyzingMock}
                      onClick={() => handleLoadMockTransaction(MOCK_TRANSACTIONS[4])}
                      variant="warning"
                      size="md"
                      className="text-sm"
                    >
                      ⚠️ High Value
                    </LoadingButton>
                  </div>
                </div>

                <LoadingButton
                  isLoading={isTestingTransaction}
                  onClick={async () => {
                    setIsTestingTransaction(true);
                    try {
                      const accounts = await window.ethereum?.request({ method: 'eth_accounts' });
                      await window.ethereum?.request({
                        method: 'eth_sendTransaction',
                        params: [{
                          from: accounts?.[0],
                          to: '0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6',
                          value: '0x16345785D8A0000',
                          data: '0x'
                        }]
                      });
                    } catch (error: any) {
                      if (error.code === 4001) {
                        showWarning('Transaction cancelled by user');
                      } else {
                        showError('Transaction failed');
                      }
                    } finally {
                      setIsTestingTransaction(false);
                    }
                  }}
                  variant="success"
                  size="lg"
                  className="w-full"
                >
                  🔥 Test Real Transaction Interception
                </LoadingButton>
              </div>
            )}
          </div>

          {/* Decision History - Only in Live Mode */}
          {appMode === 'live' && isConnected && <DecisionHistory />}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ErrorBoundary>
  );
}

export default App;
