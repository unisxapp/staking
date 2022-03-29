require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

const { 
  infura_project_id,
  mainnet_pk,
  rinkeby_mnemonic,
  etherscan_api_key
} = require('./secrets.json');

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
      url: 'https://mainnet.infura.io/v3/' + infura_project_id,
      accounts: [mainnet_pk],
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + infura_project_id,
      accounts: [rinkeby_mnemonic],
    },
    hardhat: {
      forking: {
        chainId: 1,
        url: 'https://mainnet.infura.io/v3/' + infura_project_id,
        timeout: 0,
      },
    },
  },
  etherscan: {
    apiKey: etherscan_api_key,
  }
};
