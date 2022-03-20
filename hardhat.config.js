require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

const deploy = require('./scripts/deploy.js')

const { 
  infura_project_id,
  rinkeby_mnemonic,
  etherscan_api_key
} = require('./secrets.json');

module.exports = {
  solidity: "0.8.4",
  networks: {
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

task("deploy", "Deploys contracts")
  .setAction(deploy);
