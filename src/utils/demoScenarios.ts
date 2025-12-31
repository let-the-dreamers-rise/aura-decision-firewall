import { TransactionContext, TransactionType, IndicatorType } from '../types';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  category: 'safe' | 'risky' | 'complex';
  transaction: TransactionContext;
  expectedUserAction?: 'approve' | 'reject';
  demoNotes: string[];
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'safe-usdc-transfer',
    name: 'Safe USDC Transfer',
    description: 'A straightforward transfer of USDC to a verified address',
    category: 'safe',
    expectedUserAction: 'approve',
    transaction: {
      hash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      type: TransactionType.TRANSFER,
      recipient: '0xA0b86a33E6441e8e5c3F27d9C387b8B2C4b5D6E7',
      value: '0',
      intent: 'Transfer 100 USDC to a verified recipient address. This is a standard token transfer with no additional permissions or complex interactions.',
      estimatedOutcome: 'The recipient will receive exactly 100 USDC tokens. Gas fee: approximately $2-5 depending on network congestion.',
      riskIndicators: [
        {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'info',
          message: 'USDC contract is verified and well-established',
          source: 'Etherscan API'
        }
      ],
      timestamp: Date.now()
    },
    demoNotes: [
      'This represents a low-risk, everyday transaction',
      'USDC is a well-known stablecoin with high liquidity',
      'The recipient address has been used in previous transactions',
      'No complex smart contract interactions involved'
    ]
  },
  {
    id: 'risky-new-token-swap',
    name: 'Risky New Token Swap',
    description: 'Swapping ETH for a newly launched, unverified token',
    category: 'risky',
    expectedUserAction: 'reject',
    transaction: {
      hash: '0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678',
      type: TransactionType.SWAP,
      recipient: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      value: '2.5',
      intent: 'Swap 2.5 ETH for MOONSHOT tokens using Uniswap V2. This involves exchanging a significant amount of ETH for a recently launched token with limited trading history.',
      estimatedOutcome: 'You will receive approximately 1,000,000 MOONSHOT tokens. Warning: Token value is highly volatile and may lose value rapidly.',
      riskIndicators: [
        {
          type: IndicatorType.HIGH_VALUE,
          severity: 'warning',
          message: 'High value transaction: 2.5 ETH (~$4,000)',
          source: 'Value Analysis'
        },
        {
          type: IndicatorType.NEW_TOKEN,
          severity: 'warning',
          message: 'MOONSHOT token is very new (3 days old)',
          source: 'Etherscan API'
        },
        {
          type: IndicatorType.NO_DEX_POOL,
          severity: 'warning',
          message: 'Limited liquidity pool - only $50K total value locked',
          source: 'Uniswap API'
        }
      ],
      timestamp: Date.now()
    },
    demoNotes: [
      'Multiple red flags indicate high risk',
      'New token with limited trading history',
      'High value transaction with potential for total loss',
      'Low liquidity could make it difficult to sell tokens later',
      'Perfect example of when AURA helps users avoid costly mistakes'
    ]
  },
  {
    id: 'complex-defi-interaction',
    name: 'Complex DeFi Interaction',
    description: 'Multi-step DeFi operation involving lending and yield farming',
    category: 'complex',
    expectedUserAction: 'approve',
    transaction: {
      hash: '0xc3d4e5f6789012345678901234567890abcdef1234567890abcdef123456789a',
      type: TransactionType.LIQUIDITY,
      recipient: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
      value: '1.0',
      intent: 'Deposit 1 ETH and 2,000 USDC into Uniswap V3 liquidity pool, then stake the LP tokens in a yield farming contract to earn additional rewards.',
      estimatedOutcome: 'You will provide liquidity to the ETH/USDC pool and earn trading fees plus additional token rewards. Estimated APY: 15-25%.',
      riskIndicators: [
        {
          type: IndicatorType.HIGH_VALUE,
          severity: 'info',
          message: 'Medium value transaction: 1 ETH + 2,000 USDC (~$3,000)',
          source: 'Value Analysis'
        },
        {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'info',
          message: 'Uniswap V3 contract is verified and audited',
          source: 'Etherscan API'
        }
      ],
      timestamp: Date.now()
    },
    demoNotes: [
      'Complex but legitimate DeFi operation',
      'Involves multiple smart contract interactions',
      'Requires understanding of impermanent loss risks',
      'Shows how AURA can explain complex transactions clearly',
      'Demonstrates educational value for DeFi newcomers'
    ]
  },
  {
    id: 'suspicious-approval',
    name: 'Suspicious Token Approval',
    description: 'Unlimited token approval to an unverified contract',
    category: 'risky',
    expectedUserAction: 'reject',
    transaction: {
      hash: '0xd4e5f6789012345678901234567890abcdef1234567890abcdef123456789ab2',
      type: TransactionType.APPROVAL,
      recipient: '0x1234567890123456789012345678901234567890',
      value: '0',
      intent: 'Grant unlimited spending permission for all your USDC tokens to an unverified smart contract. This allows the contract to transfer any amount of your USDC at any time.',
      estimatedOutcome: 'The contract will be able to spend unlimited USDC from your wallet without further approval. This permission remains until manually revoked.',
      riskIndicators: [
        {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'warning',
          message: 'Contract is not verified on Etherscan',
          source: 'Etherscan API'
        },
        {
          type: IndicatorType.NEW_TOKEN,
          severity: 'warning',
          message: 'Contract was deployed recently (1 day ago)',
          source: 'Etherscan API'
        }
      ],
      timestamp: Date.now()
    },
    demoNotes: [
      'Classic example of a potentially malicious approval',
      'Unlimited approvals are extremely dangerous',
      'Unverified contract adds significant risk',
      'Shows importance of understanding token permissions',
      'Demonstrates AURA\'s value in preventing token draining attacks'
    ]
  },
  {
    id: 'nft-purchase',
    name: 'NFT Purchase',
    description: 'Purchasing an NFT from a popular marketplace',
    category: 'safe',
    expectedUserAction: 'approve',
    transaction: {
      hash: '0xe5f6789012345678901234567890abcdef1234567890abcdef123456789abc3',
      type: TransactionType.TRANSFER,
      recipient: '0x00000000006c3852cbEf3e08E8dF289169EdE581',
      value: '0.5',
      intent: 'Purchase "Cool Cat #1234" NFT from OpenSea marketplace for 0.5 ETH. This transaction will transfer the NFT to your wallet and send payment to the seller.',
      estimatedOutcome: 'You will receive the Cool Cat #1234 NFT in your wallet. The seller will receive 0.5 ETH minus marketplace fees (~2.5%).',
      riskIndicators: [
        {
          type: IndicatorType.UNVERIFIED_CONTRACT,
          severity: 'info',
          message: 'OpenSea Seaport contract is verified and audited',
          source: 'Etherscan API'
        }
      ],
      timestamp: Date.now()
    },
    demoNotes: [
      'Legitimate NFT marketplace transaction',
      'OpenSea is a well-established platform',
      'Shows how AURA handles NFT transactions',
      'Demonstrates clear explanation of marketplace mechanics',
      'Good example of medium-value transaction with clear outcome'
    ]
  }
];

export const getDemoScenarioById = (id: string): DemoScenario | undefined => {
  return demoScenarios.find(scenario => scenario.id === id);
};

export const getDemoScenariosByCategory = (category: 'safe' | 'risky' | 'complex'): DemoScenario[] => {
  return demoScenarios.filter(scenario => scenario.category === category);
};

export const getRandomDemoScenario = (): DemoScenario => {
  const randomIndex = Math.floor(Math.random() * demoScenarios.length);
  return demoScenarios[randomIndex];
};

export const getDemoScenarioForPresentation = (): DemoScenario[] => {
  // Return a curated set of scenarios that work well for live demos
  return [
    getDemoScenarioById('safe-usdc-transfer')!,
    getDemoScenarioById('risky-new-token-swap')!,
    getDemoScenarioById('complex-defi-interaction')!
  ];
};