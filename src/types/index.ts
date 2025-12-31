// Core type definitions for AURA AI Decision Firewall

export enum TransactionType {
  TRANSFER = "transfer",
  SWAP = "swap", 
  APPROVAL = "approval",
  LIQUIDITY = "liquidity",
  UNKNOWN = "unknown"
}

export enum IndicatorType {
  NEW_TOKEN = "new_token",
  UNVERIFIED_CONTRACT = "unverified_contract", 
  NO_DEX_POOL = "no_dex_pool",
  HIGH_VALUE = "high_value"
}

export interface RiskIndicator {
  type: IndicatorType;
  severity: "info" | "warning";
  message: string;
  source: string;
}

export interface TransactionContext {
  hash: string;
  type: TransactionType;
  recipient: string;
  value: string;
  intent: string;
  estimatedOutcome: string;
  riskIndicators: RiskIndicator[];
  timestamp: number;
}

export interface IntentAnalysis {
  intent: string;
  estimatedOutcome: string;
  confidence: 'high' | 'medium' | 'low';
  details: string[];
}

export interface DecisionRecord {
  transactionHash: string;
  userChoice: "approved" | "rejected";
  riskLevel: "low" | "medium" | "high";
  timestamp: number;
  addressHash: string; // Privacy-preserving hash
  isDemo: boolean; // true for demo/mock transactions, false for real
}

// Wallet connection types
export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export interface MetaMaskError {
  code: number;
  message: string;
}

// Ethereum provider interface
export interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}