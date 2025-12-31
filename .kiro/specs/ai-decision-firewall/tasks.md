# Implementation Plan: AURA AI Decision Firewall

## Overview

Build a clean, single-page web application that intercepts MetaMask transactions, explains them in plain English, shows three basic risk indicators, and logs user decisions to Mantle L2. Focus on flawless demo execution and professional UX.

## Tasks

### Setup & Foundation
- [x] 1. Initialize project structure
  - Create React + TypeScript + Vite project
  - Install ethers.js and Tailwind CSS
  - Set up basic folder structure (components, hooks, utils)
  - _Requirements: 1.1_

- [x] 2. Configure MetaMask connection
  - Add wallet connection button and state management
  - Handle connection errors and network switching
  - Display connected wallet address
  - _Requirements: 1.1_

### Core Transaction Logic
- [x] 3. Build transaction parser
  - Parse transaction data (to, value, data fields)
  - Extract function signatures and parameters
  - Handle basic transaction types (transfer, swap, approval)
  - _Requirements: 1.2, 2.1_

- [x] 4. Create intent analyzer
  - Map common function signatures to plain English descriptions
  - Generate simple explanations: "Send 100 USDC to 0x123..."
  - Handle unknown transactions with fallback message
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Implement risk indicators
  - Check contract verification status via Etherscan API
  - Determine token age from creation block
  - Verify DEX pool presence on Uniswap
  - _Requirements: 3.1, 3.2_

### User Interface
- [x] 6. Design main transaction review screen
  - Clean layout with transaction details at top
  - Risk indicators section with clear labels
  - Cancel/Proceed buttons at bottom
  - _Requirements: 1.2, 1.3, 3.3_

- [x] 7. Style risk indicator display
  - Use simple icons and colors (red/yellow/green)
  - Clear text labels: "Verified Contract", "New Token", etc.
  - Avoid security guarantee language
  - _Requirements: 3.3, 3.4_

- [x] 8. Add transaction interception flow
  - Hook into MetaMask transaction requests
  - Show AURA review screen before MetaMask popup
  - Handle user cancel/proceed decisions
  - _Requirements: 1.1, 1.3, 1.4_

### Mantle L2 Integration
- [x] 9. Write Mantle L2 smart contract
  - Simple contract with logDecision function
  - Store: txHash, decision (approve/reject), timestamp
  - Deploy to Mantle testnet
  - _Requirements: 4.1, 5.1_

- [x] 10. Build decision logger
  - Connect to Mantle L2 contract
  - Log user decisions after they choose
  - Handle network errors with local fallback
  - _Requirements: 4.1, 4.2, 5.4_

- [x] 11. Add decision history display
  - Query logged decisions from Mantle L2
  - Show simple counts: "X approved, Y rejected"
  - Display on main screen
  - _Requirements: 4.4, 5.3_

### Polish & Demo Prep
- [x] 12. Improve error handling
  - Handle API failures gracefully
  - Show clear error messages to users
  - Ensure app doesn't crash on edge cases
  - _Requirements: 5.4_

- [x] 13. Add loading states
  - Show spinners during API calls
  - Disable buttons during processing
  - Provide feedback for all user actions

- [x] 14. Create demo scenarios
  - Prepare 2-3 example transactions for live demo
  - Test with different transaction types
  - Ensure reliable demo flow

- [x] 15. Final testing and cleanup
  - Test complete user flow end-to-end
  - Fix any remaining UI issues
  - Verify Mantle L2 logging works consistently