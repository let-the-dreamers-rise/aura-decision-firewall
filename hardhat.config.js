require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.19',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Mantle Testnet
    'mantle-testnet': {
      url: 'https://rpc.testnet.mantle.xyz',
      chainId: 5001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto',
    },
    // Mantle Mainnet (for future use)
    'mantle-mainnet': {
      url: 'https://rpc.mantle.xyz',
      chainId: 5000,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 'auto',
    },
    // Local development
    hardhat: {
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: {
      'mantle-testnet': process.env.MANTLE_API_KEY || 'placeholder',
      'mantle-mainnet': process.env.MANTLE_API_KEY || 'placeholder',
    },
    customChains: [
      {
        network: 'mantle-testnet',
        chainId: 5001,
        urls: {
          apiURL: 'https://explorer.testnet.mantle.xyz/api',
          browserURL: 'https://explorer.testnet.mantle.xyz',
        },
      },
      {
        network: 'mantle-mainnet',
        chainId: 5000,
        urls: {
          apiURL: 'https://explorer.mantle.xyz/api',
          browserURL: 'https://explorer.mantle.xyz',
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: 'USD',
  },
};