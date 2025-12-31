import { ethers } from 'ethers';
import { DecisionRecord } from '../types';
import deploymentInfo from '../contracts/deployment.json';

// Mantle L2 network configuration
const MANTLE_TESTNET_CONFIG = {
  chainId: 5001,
  name: 'Mantle Testnet',
  rpcUrl: 'https://rpc.testnet.mantle.xyz',
  blockExplorerUrl: 'https://explorer.testnet.mantle.xyz',
};

interface LogDecisionParams {
  transactionHash: string;
  userChoice: 'approved' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high';
  userAddress: string;
  isDemo?: boolean; // true for demo/mock transactions, false for real (default)
}

interface DecisionStats {
  totalDecisions: number;
  totalApprovals: number;
  totalRejections: number;
  lastUpdated: Date;
}

export class DecisionLogger {
  private contract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Signer | null = null;
  private localDecisions: DecisionRecord[] = [];

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize the provider and contract connection
   */
  private async initializeProvider() {
    try {
      // Initialize provider for Mantle L2
      this.provider = new ethers.JsonRpcProvider(MANTLE_TESTNET_CONFIG.rpcUrl);
      
      // Check if MetaMask is available and connected
      if (typeof window !== 'undefined' && window.ethereum) {
        // Create a Web3Provider using MetaMask
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if we're on the correct network
        const network = await web3Provider.getNetwork();
        if (Number(network.chainId) === MANTLE_TESTNET_CONFIG.chainId) {
          this.signer = await web3Provider.getSigner();
          this.contract = new ethers.Contract(
            deploymentInfo.contractAddress,
            deploymentInfo.abi,
            this.signer
          );
        } else {
          console.warn('Not connected to Mantle L2. Using read-only provider.');
          this.contract = new ethers.Contract(
            deploymentInfo.contractAddress,
            deploymentInfo.abi,
            this.provider
          );
        }
      } else {
        // Fallback to read-only provider
        this.contract = new ethers.Contract(
          deploymentInfo.contractAddress,
          deploymentInfo.abi,
          this.provider
        );
      }
    } catch (error) {
      console.error('Failed to initialize decision logger:', error);
    }
  }

  /**
   * Switch to Mantle L2 network
   */
  async switchToMantleL2(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.ethereum) {
      console.error('MetaMask not available');
      return false;
    }

    try {
      // Try to switch to Mantle L2
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MANTLE_TESTNET_CONFIG.chainId.toString(16)}` }],
      });
      
      // Reinitialize after network switch
      await this.initializeProvider();
      return true;
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${MANTLE_TESTNET_CONFIG.chainId.toString(16)}`,
                chainName: MANTLE_TESTNET_CONFIG.name,
                rpcUrls: [MANTLE_TESTNET_CONFIG.rpcUrl],
                blockExplorerUrls: [MANTLE_TESTNET_CONFIG.blockExplorerUrl],
                nativeCurrency: {
                  name: 'MNT',
                  symbol: 'MNT',
                  decimals: 18,
                },
              },
            ],
          });
          
          // Reinitialize after adding network
          await this.initializeProvider();
          return true;
        } catch (addError) {
          console.error('Failed to add Mantle L2 network:', addError);
          return false;
        }
      } else {
        console.error('Failed to switch to Mantle L2:', switchError);
        return false;
      }
    }
  }

  /**
   * Create a privacy-preserving hash of the user address
   */
  private createUserAddressHash(userAddress: string): string {
    const salt = 'aura-decision-firewall-v1'; // Static salt for consistency
    return ethers.keccak256(ethers.toUtf8Bytes(userAddress.toLowerCase() + salt));
  }

  /**
   * Log a user decision to Mantle L2
   */
  async logDecision(params: LogDecisionParams): Promise<boolean> {
    const { transactionHash, userChoice, riskLevel, userAddress, isDemo = false } = params;

    try {
      // Validate inputs
      if (!transactionHash || !userAddress) {
        throw new Error('Transaction hash and user address are required');
      }

      if (!['approved', 'rejected'].includes(userChoice)) {
        throw new Error('User choice must be "approved" or "rejected"');
      }

      if (!['low', 'medium', 'high'].includes(riskLevel)) {
        throw new Error('Risk level must be "low", "medium", or "high"');
      }

      // Create privacy-preserving hash
      const userAddressHash = this.createUserAddressHash(userAddress);
      const txHashBytes = ethers.keccak256(ethers.toUtf8Bytes(transactionHash));
      const approved = userChoice === 'approved';

      // Create local record first
      const localRecord: DecisionRecord = {
        transactionHash,
        userChoice,
        riskLevel,
        timestamp: Date.now(),
        addressHash: userAddressHash,
        isDemo,
      };

      // Always store locally as backup
      this.localDecisions.push(localRecord);
      this.saveLocalDecisions();

      // Try to log to Mantle L2
      if (this.contract && this.signer) {
        try {
          const tx = await this.contract.logDecision(
            txHashBytes,
            userAddressHash,
            approved,
            riskLevel,
            isDemo
          );

          console.log(`Decision logged to Mantle L2 (${isDemo ? 'Demo' : 'Live'}):`, tx.hash);
          await tx.wait(); // Wait for confirmation
          
          return true;
        } catch (contractError: any) {
          console.error('Failed to log to Mantle L2 contract:', contractError);
          
          // If we're not on the right network, try to switch
          if (contractError.code === 'NETWORK_ERROR' || 
              contractError.code === 'UNSUPPORTED_OPERATION' ||
              contractError.message?.includes('network')) {
            const switched = await this.switchToMantleL2();
            if (switched) {
              // Retry after switching networks
              try {
                const retryTx = await this.contract.logDecision(
                  txHashBytes,
                  userAddressHash,
                  approved,
                  riskLevel,
                  isDemo
                );
                await retryTx.wait();
                return true;
              } catch (retryError) {
                console.error('Retry failed after network switch:', retryError);
                throw new Error('Failed to log decision after network switch');
              }
            }
          }
          
          // Re-throw the error for the caller to handle
          throw new Error(`Mantle L2 logging failed: ${contractError.message || 'Unknown error'}`);
        }
      } else {
        console.log('No contract connection, decision saved locally');
        throw new Error('Not connected to Mantle L2. Decision saved locally only.');
      }
    } catch (error: any) {
      console.error('Error logging decision:', error);
      
      // Ensure we always have a local backup
      if (!this.localDecisions.some(d => d.transactionHash === transactionHash && d.timestamp === Date.now())) {
        const fallbackRecord: DecisionRecord = {
          transactionHash,
          userChoice,
          riskLevel,
          timestamp: Date.now(),
          addressHash: this.createUserAddressHash(userAddress),
          isDemo,
        };
        this.localDecisions.push(fallbackRecord);
        this.saveLocalDecisions();
      }
      
      throw error; // Re-throw for caller to handle
    }
  }

  /**
   * Get decision statistics from Mantle L2
   */
  async getDecisionStats(): Promise<DecisionStats | null> {
    try {
      if (this.contract) {
        const stats = await this.contract.getStats();
        return {
          totalDecisions: Number(stats.totalDecisions),
          totalApprovals: Number(stats.totalApprovals),
          totalRejections: Number(stats.totalRejections),
          lastUpdated: new Date(Number(stats.lastUpdated) * 1000),
        };
      }
    } catch (error) {
      console.error('Error fetching stats from Mantle L2:', error);
    }

    // Fallback to local stats
    return this.getLocalStats();
  }

  /**
   * Get local decision statistics as fallback
   */
  private getLocalStats(): DecisionStats {
    const approvals = this.localDecisions.filter(d => d.userChoice === 'approved').length;
    const rejections = this.localDecisions.filter(d => d.userChoice === 'rejected').length;
    const lastDecision = this.localDecisions[this.localDecisions.length - 1];

    return {
      totalDecisions: this.localDecisions.length,
      totalApprovals: approvals,
      totalRejections: rejections,
      lastUpdated: lastDecision ? new Date(lastDecision.timestamp) : new Date(),
    };
  }

  /**
   * Save decisions to local storage
   */
  private saveLocalDecisions() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('aura-decisions', JSON.stringify(this.localDecisions));
      } catch (error) {
        console.error('Failed to save decisions to local storage:', error);
      }
    }
  }

  /**
   * Load decisions from local storage
   */
  private loadLocalDecisions() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('aura-decisions');
        if (stored) {
          this.localDecisions = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Failed to load decisions from local storage:', error);
        this.localDecisions = [];
      }
    }
  }

  /**
   * Initialize the decision logger
   */
  async initialize() {
    this.loadLocalDecisions();
    await this.initializeProvider();
  }

  /**
   * Check if connected to Mantle L2
   */
  isConnectedToMantleL2(): boolean {
    return this.contract !== null && this.signer !== null;
  }

  /**
   * Get the contract address
   */
  getContractAddress(): string {
    return deploymentInfo.contractAddress;
  }

  /**
   * Get local decisions count
   */
  getLocalDecisionsCount(): number {
    return this.localDecisions.length;
  }

  /**
   * Get local decisions for display
   */
  getLocalDecisions(): DecisionRecord[] {
    return [...this.localDecisions].reverse(); // Most recent first
  }
}

// Export singleton instance
export const decisionLogger = new DecisionLogger();