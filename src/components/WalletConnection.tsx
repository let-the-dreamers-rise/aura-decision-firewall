import React from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { LoadingButton } from './LoadingSpinner';

interface WalletConnectionProps {
  className?: string;
}

export const WalletConnection: React.FC<WalletConnectionProps> = ({ className = '' }) => {
  const {
    isConnected,
    address,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    isMetaMaskInstalled,
  } = useMetaMask();

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get network name
  const getNetworkName = (id: number) => {
    switch (id) {
      case 1:
        return 'Ethereum Mainnet';
      case 5:
        return 'Goerli Testnet';
      case 11155111:
        return 'Sepolia Testnet';
      case 5000:
        return 'Mantle Mainnet';
      case 5001:
        return 'Mantle Testnet';
      default:
        return `Chain ID: ${id}`;
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              MetaMask Required
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Please install MetaMask to use AURA.{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline text-yellow-700 hover:text-yellow-600"
                >
                  Download MetaMask
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={`space-y-4 ${className}`}>
        <LoadingButton
          isLoading={isConnecting}
          onClick={connect}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
        </LoadingButton>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Connection Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Wallet Connected
            </h3>
            <div className="mt-1 text-sm text-green-700">
              <p className="font-mono">{address && formatAddress(address)}</p>
              {chainId && (
                <p className="text-xs mt-1">{getNetworkName(chainId)}</p>
              )}
            </div>
          </div>
        </div>
        <LoadingButton
          isLoading={false}
          onClick={disconnect}
          variant="secondary"
          size="sm"
        >
          Disconnect
        </LoadingButton>
      </div>
      
      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded-md p-2">
          <div className="text-sm text-red-700">
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};