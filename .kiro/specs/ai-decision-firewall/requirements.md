# AURA MVP Requirements - Mantle Global Hackathon

## Scope Statement

AURA is a transaction decision-support tool that intercepts MetaMask transactions, explains transaction intent in plain English using AI, displays basic risk indicators from simple data sources, and logs user decisions to Mantle L2. This is an educational MVP demonstrating transaction transparency, NOT a security system.

## Glossary

- **AURA_Interface**: Web application that intercepts and analyzes transactions
- **Intent_Analyzer**: AI component that explains transaction purpose in plain English
- **Risk_Indicator**: Simple data checks (token age, liquidity, contract verification)
- **Decision_Logger**: Component that records user choices to Mantle L2
- **Transaction_Context**: Parsed transaction data with human-readable explanations

## Core MVP Requirements

### Requirement 1: Transaction Interception

**User Story:** As a Web3 user, I want to see what my transaction actually does before signing, so that I understand my actions.

#### Acceptance Criteria

1. WHEN a user initiates a MetaMask transaction, THE AURA_Interface SHALL observe and analyze transaction requests before user confirmation
2. WHEN displaying transaction details, THE AURA_Interface SHALL show recipient, value, and function being called
3. THE AURA_Interface SHALL allow users to proceed or cancel the transaction
4. WHEN users cancel, THE AURA_Interface SHALL allow the user to cancel before confirming the MetaMask signing prompt

### Requirement 2: Intent Explanation

**User Story:** As a Web3 user, I want to understand what my transaction will do in simple terms, so that I can make informed decisions.

#### Acceptance Criteria

1. WHEN analyzing a transaction, THE Intent_Analyzer SHALL identify the transaction type (swap, transfer, approval, etc.)
2. WHEN explaining intent, THE Intent_Analyzer SHALL use plain English without technical jargon
3. THE Intent_Analyzer SHALL display estimated outcomes (tokens received, fees paid, permissions granted)
4. WHEN intent cannot be determined, THE Intent_Analyzer SHALL clearly state "Unknown transaction type"

### Requirement 3: Basic Risk Indicators

**User Story:** As a Web3 user, I want to see simple warning signs about transactions, so that I can spot obviously risky situations.

#### Acceptance Criteria

1. WHEN checking tokens, THE Risk_Indicator SHALL display token age and DEX pool presence or absence
2. WHEN checking contracts, THE Risk_Indicator SHALL show verification status on Etherscan
3. WHEN displaying warnings, THE Risk_Indicator SHALL use clear labels like "New Token" or "Unverified Contract"
4. THE Risk_Indicator SHALL NOT claim to detect exploits or guarantee safety

### Requirement 4: Decision Logging

**User Story:** As a researcher, I want transaction decisions recorded transparently, so that decision patterns can be analyzed.

#### Acceptance Criteria

1. WHEN a user approves or rejects a transaction, THE Decision_Logger SHALL record the choice on Mantle L2
2. WHEN logging decisions, THE Decision_Logger SHALL include transaction hash, user choice, and timestamp
3. THE Decision_Logger SHALL use privacy-preserving techniques (hashed addresses, no personal data)
4. WHEN querying logs, THE AURA_Interface SHALL display simple aggregate counts (number of approvals vs rejections) without individual user data

### Requirement 5: Mantle L2 Integration

**User Story:** As a hackathon participant, I want to demonstrate Mantle L2 usage, so that I show meaningful blockchain integration.

#### Acceptance Criteria

1. THE Decision_Logger SHALL deploy a simple smart contract on Mantle L2 testnet
2. WHEN recording decisions, THE Decision_Logger SHALL use individual decision logging optimized for low gas usage
3. THE AURA_Interface SHALL display simple aggregate counts from Mantle L2 data
4. WHEN Mantle L2 is unavailable, THE AURA_Interface SHALL continue functioning with local logging

## Explicit Non-Goals (What We Are NOT Building)

- **Security guarantees**: AURA does not prevent exploits, MEV, or rug pulls
- **Automated blocking**: AURA never automatically blocks transactions
- **Production reliability**: No uptime SLAs, enterprise features, or 24/7 support
- **Multi-wallet support**: Only MetaMask integration for MVP
- **Advanced AI**: No machine learning training, just rule-based intent parsing
- **Real-time oracles**: Using cached/mocked data where needed, clearly disclosed
- **Mobile apps**: Web-only interface
- **User accounts**: No registration, authentication, or user profiles

## Mantle Integration Summary

AURA uses Mantle L2 for lightweight, immutable decision logging through a simple smart contract. This demonstrates Mantle's low-cost transaction recording while providing transparency into user decision patterns. The integration showcases Mantle's developer experience and cost efficiency for data availability use cases.

## Why This MVP Is Judge-Strong

1. **Realistic scope**: Achievable by solo developer in 6 days
2. **Clear value**: Addresses real user pain point (transaction opacity)
3. **Honest limitations**: No false security claims that judges will question
4. **Meaningful Mantle usage**: Shows understanding of L2 benefits beyond "cheaper gas"
5. **Demo-friendly**: Easy to show working transaction interception and explanation
6. **Extensible foundation**: Clear path to production features without overengineering MVP