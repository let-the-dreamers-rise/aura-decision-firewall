import React from 'react';
import { TransactionContext, RiskIndicator, IndicatorType } from '../types';
import { LoadingButton } from './LoadingSpinner';

interface TransactionReviewProps {
  transaction: TransactionContext;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export const TransactionReview: React.FC<TransactionReviewProps> = ({
  transaction,
  onApprove,
  onReject,
  isProcessing = false
}) => {
  // Format value for display (value is in wei)
  const formatValue = (value: string) => {
    try {
      const valueInWei = BigInt(value);
      if (valueInWei === 0n) return '0 ETH';
      
      // Convert wei to ETH (divide by 10^18)
      const ethValue = Number(valueInWei) / 1e18;
      
      if (ethValue < 0.0001) return '<0.0001 ETH';
      if (ethValue < 1) return `${ethValue.toFixed(4)} ETH`;
      return `${ethValue.toFixed(4)} ETH`;
    } catch {
      // Fallback: assume value is already in ETH format
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue === 0) return '0 ETH';
      if (numValue < 0.001) return '<0.001 ETH';
      return `${numValue.toFixed(4)} ETH`;
    }
  };

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get transaction type display name
  const getTransactionTypeDisplay = (type: string) => {
    switch (type) {
      case 'transfer':
        return 'Token Transfer';
      case 'swap':
        return 'Token Swap';
      case 'approval':
        return 'Token Approval';
      case 'liquidity':
        return 'Liquidity Operation';
      default:
        return 'Unknown Transaction';
    }
  };

  // Get risk indicator icon and color based on type and severity
  const getRiskIndicatorStyle = (indicator: RiskIndicator) => {
    const baseClasses = "flex items-center p-3 rounded-lg border";
    
    // Determine color scheme based on indicator type and severity
    const getColorScheme = () => {
      // For contract verification - green for verified/safe, red for unverified/warning
      if (indicator.type === IndicatorType.UNVERIFIED_CONTRACT) {
        // Check if this is a positive/safe message (must NOT contain "not verified")
        const isNotVerified = indicator.message.toLowerCase().includes('not verified') || 
          indicator.message.toLowerCase().includes('unable to verify') ||
          indicator.message.toLowerCase().includes('unverified');
        
        const isSafe = !isNotVerified && (
          indicator.severity === 'info' || 
          indicator.message.includes('verified') ||
          indicator.message.includes('Simple ETH transfer') ||
          indicator.message.includes('well-established') ||
          indicator.message.includes('audited') ||
          indicator.message.includes('Known Protocol')
        );
        
        if (isSafe) {
          return {
            container: `${baseClasses} bg-green-50 border-green-200`,
            icon: "text-green-600",
            text: "text-green-800"
          };
        } else {
          return {
            container: `${baseClasses} bg-red-50 border-red-200`,
            icon: "text-red-600",
            text: "text-red-800"
          };
        }
      }
      
      // For other indicators, use severity-based coloring
      if (indicator.severity === 'warning') {
        return {
          container: `${baseClasses} bg-yellow-50 border-yellow-200`,
          icon: "text-yellow-600",
          text: "text-yellow-800"
        };
      } else {
        return {
          container: `${baseClasses} bg-blue-50 border-blue-200`,
          icon: "text-blue-600",
          text: "text-blue-800"
        };
      }
    };

    const colorScheme = getColorScheme();
    
    // Get appropriate icon based on indicator type
    const getIcon = () => {
      switch (indicator.type) {
        case IndicatorType.UNVERIFIED_CONTRACT:
          // Check if this is a positive/safe message (must NOT contain "not verified")
          const isNotVerifiedIcon = indicator.message.toLowerCase().includes('not verified') || 
            indicator.message.toLowerCase().includes('unable to verify') ||
            indicator.message.toLowerCase().includes('unverified');
          
          const isSafeContract = !isNotVerifiedIcon && (
            indicator.severity === 'info' || 
            indicator.message.includes('verified') ||
            indicator.message.includes('Simple ETH transfer') ||
            indicator.message.includes('well-established') ||
            indicator.message.includes('audited') ||
            indicator.message.includes('Known Protocol')
          );
          
          if (isSafeContract) {
            // Shield check icon for verified/safe contracts
            return (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            );
          } else {
            // Shield exclamation icon for unverified contracts
            return (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
            );
          }
        case IndicatorType.NEW_TOKEN:
          // Clock icon for new tokens
          return (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          );
        case IndicatorType.NO_DEX_POOL:
          if (indicator.message.includes('trading activity')) {
            // Check circle icon for DEX activity found
            return (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            );
          } else {
            // X circle icon for no DEX activity
            return (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            );
          }
        case IndicatorType.HIGH_VALUE:
          // Currency dollar icon for high value transactions
          return (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          );
        default:
          // Default warning triangle icon
          return (
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          );
      }
    };

    return {
      containerClass: colorScheme.container,
      iconClass: colorScheme.icon,
      textClass: colorScheme.text,
      icon: getIcon()
    };
  };

  // Get clear, non-security-guarantee risk indicator labels
  const getRiskIndicatorLabel = (type: IndicatorType, message: string) => {
    switch (type) {
      case IndicatorType.NEW_TOKEN:
        if (message.includes('very new')) {
          return 'Very New Token';
        } else if (message.includes('relatively new')) {
          return 'New Token';
        } else if (message.includes('days')) {
          return 'Token Age';
        } else {
          return 'Token Age Unknown';
        }
      case IndicatorType.UNVERIFIED_CONTRACT:
        // Check for negative messages first (must check before positive)
        const isNotVerifiedLabel = message.toLowerCase().includes('not verified') ||
          message.toLowerCase().includes('unable to verify') ||
          message.toLowerCase().includes('unverified');
        
        if (isNotVerifiedLabel) {
          if (message.includes('not verified')) {
            return 'Unverified Contract';
          } else if (message.includes('Unable to verify')) {
            return 'Contract Status Unknown';
          } else {
            return 'Contract Warning';
          }
        }
        
        // Check if this is a positive/safe message
        const isSafeLabelCheck = message.includes('verified') ||
          message.includes('Simple ETH transfer') ||
          message.includes('well-established') ||
          message.includes('audited') ||
          message.includes('Known Protocol');
        
        if (isSafeLabelCheck) {
          if (message.includes('Simple ETH transfer')) {
            return 'Simple Transfer';
          }
          return 'Verified Contract';
        }
        
        return 'Contract Warning';
      case IndicatorType.NO_DEX_POOL:
        if (message.includes('trading activity')) {
          return 'DEX Trading Found';
        } else if (message.includes('No major DEX')) {
          return 'Limited DEX Activity';
        } else {
          return 'DEX Status Unknown';
        }
      case IndicatorType.HIGH_VALUE:
        if (message.includes('High value')) {
          return 'High Value Transaction';
        } else if (message.includes('Medium value')) {
          return 'Medium Value Transaction';
        } else {
          return 'Value Analysis';
        }
      default:
        return 'Risk Indicator';
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <h2 className="text-xl font-semibold text-white">Transaction Review</h2>
        <p className="text-blue-100 text-sm mt-1">
          Review the details below before proceeding
        </p>
      </div>

      {/* Transaction Details Section */}
      <div className="px-6 py-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
        
        <div className="space-y-4">
          {/* Transaction Type */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Type:</span>
            <span className="text-sm text-gray-900 font-medium">
              {getTransactionTypeDisplay(transaction.type)}
            </span>
          </div>

          {/* Recipient */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">To:</span>
            <span className="text-sm text-gray-900 font-mono">
              {formatAddress(transaction.recipient)}
            </span>
          </div>

          {/* Value */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">Value:</span>
            <span className="text-sm text-gray-900 font-medium">
              {formatValue(transaction.value)}
            </span>
          </div>

          {/* Intent Explanation */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">What this transaction does:</h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {transaction.intent}
            </p>
            {transaction.estimatedOutcome && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Estimated Outcome:
                </h5>
                <p className="text-sm text-gray-600">
                  {transaction.estimatedOutcome}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Risk Indicators Section */}
      <div className="px-6 py-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Indicators</h3>
        
        {transaction.riskIndicators.length > 0 ? (
          <div className="space-y-3">
            {transaction.riskIndicators.map((indicator, index) => {
              const style = getRiskIndicatorStyle(indicator);
              return (
                <div key={index} className={style.containerClass}>
                  <div className={`flex-shrink-0 ${style.iconClass}`}>
                    {style.icon}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className={`text-sm font-medium ${style.textClass}`}>
                      {getRiskIndicatorLabel(indicator.type, indicator.message)}
                    </div>
                    <div className={`text-sm ${style.textClass} opacity-90 mt-1`}>
                      {indicator.message}
                    </div>
                    {indicator.source && (
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {indicator.source}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-green-800">
                  No Risk Indicators Detected
                </div>
                <div className="text-sm text-green-700 mt-1">
                  This transaction appears to have standard characteristics based on available data.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Important:</strong> These indicators are basic data checks and do not provide security guarantees. 
            AURA does not detect exploits or malicious activity. Always research transactions independently before proceeding.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-6 bg-gray-50">
        <div className="flex space-x-4">
          <LoadingButton
            isLoading={isProcessing}
            onClick={onReject}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            Cancel Transaction
          </LoadingButton>
          
          <LoadingButton
            isLoading={isProcessing}
            onClick={onApprove}
            variant="primary"
            size="lg"
            className="flex-1"
          >
            Proceed with Transaction
          </LoadingButton>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Proceeding will open MetaMask for final confirmation
          </p>
        </div>
      </div>
    </div>
  );
};