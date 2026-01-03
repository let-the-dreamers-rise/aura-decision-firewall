# 🛡️ AURA - AI Decision Firewall

<div align="center">

![AURA Banner](https://img.shields.io/badge/AURA-AI%20Decision%20Firewall-6366f1?style=for-the-badge&logo=ethereum&logoColor=white)

**Protecting Web3 Users Through AI-Powered Transaction Intelligence**

[![Mantle Network](https://img.shields.io/badge/Built%20on-Mantle%20L2-00D395?style=flat-square&logo=ethereum)](https://mantle.xyz)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Demo](#-demo) • [One-Pager](#-one-pager-pitch) • [Features](#-features)  • [Quick Start](#-quick-start) • [Smart Contract](#-smart-contract)

</div>

---

## 🎯 The Problem

**Every day, Web3 users lose millions to:**
- 🎭 Phishing attacks disguised as legitimate transactions
- 📜 Malicious smart contract approvals
- 🔄 Confusing transaction data they can't understand
- ⚠️ Hidden risks in DeFi interactions

**The average user sees this when signing a transaction:**
```
0xa9059cbb000000000000000000000000742d35cc6634c0532925a3b844...
```

**They have no idea what they're actually approving.**

---

## 💡 The Solution

**AURA** acts as an intelligent firewall between users and their transactions, providing:

1. **Plain English Explanations** - Transforms cryptic hex data into human-readable descriptions
2. **Real-Time Risk Analysis** - Identifies potential threats before you sign
3. **Transparent Decision Logging** - Records all decisions on Mantle L2 for accountability
4. **Privacy-First Design** - Uses address hashing to protect user identity

---
## 📄 One-Pager Pitch

### Problem
Web3 users routinely sign blockchain transactions they do not fully understand.
Wallets expose raw hexadecimal data, obscure permissions, and complex contract
interactions, leading to phishing losses, malicious approvals, and irreversible
mistakes.

Despite growing adoption, transaction comprehension remains one of the largest
unsolved UX and safety problems in Web3.

---

### Solution
**AURA** is an AI-powered decision firewall that sits between users and their
transactions.

Before a transaction is signed, AURA:
- Explains the transaction intent in plain English
- Highlights basic but critical risk indicators
- Allows users to consciously approve or reject actions
- Records decisions transparently for accountability

AURA does not block users or claim perfect security — it empowers informed
decision-making.

---

### Why Mantle
AURA uses **Mantle L2** as a low-cost, high-throughput decision logging layer.

Recording user approve/reject decisions would be prohibitively expensive on L1.
Mantle enables frequent, immutable logging without harming user experience,
making it ideal for transparency and auditability at scale.

---

### Business Model
- **B2B Wallet Integrations** (embedded safety layer for wallets)
- **Enterprise Compliance & Audit Tooling**
- **Premium Analytics** for institutions and power users

---

### Roadmap
**Phase 1:** Wallet-side transaction intelligence (current MVP)  
**Phase 2:** Advanced risk simulation and pattern analysis  
**Phase 3:** Enterprise compliance dashboards and multi-wallet support

## ✨ Features

### 🔍 Transaction Intelligence
- **Intent Analysis**: Automatically detects transaction types (transfers, swaps, approvals, etc.)
- **Parameter Extraction**: Parses and displays all transaction parameters in readable format
- **Contract Recognition**: Identifies known protocols and contract patterns

### ⚠️ Risk Assessment
| Indicator | Description |
|-----------|-------------|
| 🔴 Unverified Contract | Target contract not verified on block explorer |
| 🟡 New Token | Token created less than 30 days ago |
| 🟠 High Value | Transaction exceeds safety thresholds |
| 🟢 DEX Liquidity | Token has verified liquidity pools |

### 📊 Mantle L2 Integration
- **On-Chain Decision Logging**: Every approve/reject decision recorded immutably
- **Privacy-Preserving**: User addresses hashed before storage
- **Aggregate Statistics**: View community decision patterns
- **Gas Efficient**: Leveraging Mantle's low-cost L2 transactions

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AURA Frontend                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Wallet    │  │ Transaction │  │    Risk Indicator       │ │
│  │ Connection  │──│   Parser    │──│      Engine             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│         │                │                      │               │
│         ▼                ▼                      ▼               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Intent Analyzer (AI Engine)                    ││
│  │  • Transaction Type Detection                               ││
│  │  • Plain English Generation                                 ││
│  │  • Risk Level Assessment                                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mantle L2 Network                            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           AuraDecisionLogger Smart Contract                 ││
│  │  • logDecision(txHash, userHash, approved, riskLevel)      ││
│  │  • getStats() → (total, approvals, rejections)             ││
│  │  • Events: DecisionLogged, StatsUpdated                    ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Mantle Testnet configured in MetaMask

### Installation

```bash
# Clone the repository
git clone https://github.com/let-the-dreamers-rise/aura-decision-firewall.git
cd aura-decision-firewall

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Configure your environment variables
VITE_MANTLE_RPC_URL=https://rpc.testnet.mantle.xyz
VITE_CONTRACT_ADDRESS=0x742d35Cc6634C0532925a3b8D4C9db996C4b4d8b6
```

### Build for Production

```bash
npm run build
npm run preview
```

---
## 📜 Smart Contract

### Deployed on Mantle Sepolia Testnet

A minimal on-chain contract has been deployed to the Mantle Sepolia testnet to
prove ecosystem integration during the hackathon.

**Contract Address:**  
`0x5f3B054c884CeEF157B92Ba6960A1Da70F3306ae`

**Network:** Mantle Sepolia  
**Purpose:** Deployment proof for Mantle ecosystem compliance

This contract serves as a lightweight on-chain anchor for AURA.
Core transaction analysis and decision logic currently lives in the frontend,
with Mantle L2 used for verifiable deployment and future expansion of
decision-logging functionality.

### Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuraProof {
    string public constant name = "AURA Mantle Proof";
}

The following contract represents the planned production interface for
on-chain decision logging. It is included for architectural clarity and
future expansion, but is not deployed as part of the current MVP.

### Planned Contract Interface (Future Expansion)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AuraDecisionLogger {
    event DecisionLogged(
        bytes32 indexed transactionHash,
        bytes32 indexed userAddressHash,
        bool approved,
        uint256 timestamp,
        string riskLevel
    );

    function logDecision(
        bytes32 _transactionHash,
        bytes32 _userAddressHash,
        bool _approved,
        string memory _riskLevel
    ) external;

    function getStats() external view returns (
        uint256 totalDecisions,
        uint256 totalApprovals,
        uint256 totalRejections,
        uint256 lastUpdated
    );
}
```

### Deploy Your Own

```bash
# Configure Hardhat for Mantle
npx hardhat run scripts/deploy.js --network mantle-testnet
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- --grep "TransactionParser"
```

### Test Coverage
- ✅ Transaction Parser (12 tests)
- ✅ Intent Analyzer (11 tests)
- ✅ Risk Indicators (12 tests)
- ✅ UI Components (7 tests)

---

## 🎮 Demo Scenarios

AURA includes built-in demo scenarios to showcase functionality:

| Scenario | Type | Risk Level |
|----------|------|------------|
| Safe ETH Transfer | Native Transfer | 🟢 Low |
| Token Swap | DEX Interaction | 🟡 Medium |
| Suspicious Approval | Unlimited Approval | 🔴 High |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **Build** | Vite, ESBuild |
| **Blockchain** | ethers.js v6, Mantle L2 |
| **Smart Contracts** | Solidity 0.8.19, Hardhat |
| **Testing** | Vitest, React Testing Library |

---

## 📁 Project Structure

```
aura-decision-firewall/
├── contracts/              # Solidity smart contracts
│   └── AuraDecisionLogger.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── src/
│   ├── components/         # React UI components
│   │   ├── TransactionReview.tsx
│   │   ├── WalletConnection.tsx
│   │   ├── DecisionHistory.tsx
│   │   └── DemoScenarioSelector.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useMetaMask.ts
│   │   └── useTransactionInterceptor.ts
│   ├── utils/              # Core logic
│   │   ├── transactionParser.ts
│   │   ├── intentAnalyzer.ts
│   │   ├── riskIndicators.ts
│   │   └── decisionLogger.ts
│   └── types/              # TypeScript definitions
├── test/                   # Contract tests
└── package.json
```

---

## 🔮 Future Roadmap

- [ ] **Multi-Wallet Support** - WalletConnect, Coinbase Wallet
- [ ] **ML-Powered Risk Detection** - Advanced pattern recognition
- [ ] **Browser Extension** - Seamless MetaMask integration
- [ ] **DAO Governance** - Community-driven risk parameters
- [ ] **Cross-Chain Support** - Expand beyond Mantle

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Mantle Network** - For providing a scalable L2 solution
- **Mantle Global Hackathon** - For the opportunity to build
- **The Web3 Community** - For inspiring safer blockchain interactions

---

<div align="center">

**Built with 💜 for the Mantle Global Hackathon**


</div>
