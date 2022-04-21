require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

const { 
  MAINNET_URL,
  RINKEBY_URL,
  PK,
  ETHERSCAN_API,
} = process.env;

module.exports = {
  solidity: {
    version: '0.8.9',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: false,
        },
      },
    },
  },
  networks: {
    mainnet: {
      chainId: 1,
      url: MAINNET_URL,
      accounts: [PK],
    },
    rinkeby: {
      url: RINKEBY_URL,
      accounts: [PK],
    },
    hardhat: {
      forking: {
        chainId: 1,
        url: MAINNET_URL,
        timeout: 0,
      },
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API,
  }
};
