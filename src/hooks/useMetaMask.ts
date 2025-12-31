import { useState, useEffect, useCallback } from 'react';
import { WalletState, EthereumProvider, MetaMaskError } from '../types';

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const initialWalletState: WalletState = {
  isConnected: false,
  address: null,
  chainId: null,
  isConnecting: false,
  error: null,
};

export const useMetaMask = () => {
  const [walletState, setWalletState] = useState<WalletState>(initialWalletState);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = useCallback(() => {
    return typeof window !== 'undefined' && 
           typeof window.ethereum !== 'undefined' && 
           window.ethereum.isMetaMask;
  }, []);

  // Connect to MetaMask
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setWalletState(prev => ({
        ...prev,
        error: 'MetaMask is not installed. Please install MetaMask to continue.',
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });

      const chainId = await window.ethereum!.request({
        method: 'eth_chainId',
      });

      if (accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          chainId: parseInt(chainId, 16),
          isConnecting: false,
          error: null,
        });
      }
    } catch (error) {
      const metamaskError = error as MetaMaskError;
      let errorMessage = 'Failed to connect to MetaMask';
      
      if (metamaskError.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (metamaskError.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (metamaskError.message) {
        errorMessage = metamaskError.message;
      }

      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }));
    }
  }, [isMetaMaskInstalled]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState(initialWalletState);
  }, []);

  // Switch network
  const switchNetwork = useCallback(async (chainId: number) => {
    if (!isMetaMaskInstalled() || !walletState.isConnected) {
      return;
    }

    try {
      await window.ethereum!.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error) {
      const metamaskError = error as MetaMaskError;
      setWalletState(prev => ({
        ...prev,
        error: `Failed to switch network: ${metamaskError.message}`,
      }));
    }
  }, [isMetaMaskInstalled, walletState.isConnected]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setWalletState(initialWalletState);
    } else {
      setWalletState(prev => ({
        ...prev,
        address: accounts[0],
        error: null,
      }));
    }
  }, []);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    setWalletState(prev => ({
      ...prev,
      chainId: parseInt(chainId, 16),
      error: null,
    }));
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) {
      return;
    }

    const ethereum = window.ethereum!;

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected
    const checkConnection = async () => {
      try {
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await ethereum.request({ method: 'eth_chainId' });
          setWalletState({
            isConnected: true,
            address: accounts[0],
            chainId: parseInt(chainId, 16),
            isConnecting: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();

    // Cleanup event listeners
    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [isMetaMaskInstalled, handleAccountsChanged, handleChainChanged]);

  return {
    ...walletState,
    connect,
    disconnect,
    switchNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
};