require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { 
  infura_project_id,
  rinkeby_mnemonic,
  kovan_mnemonic,
  etherscan_api_key
} = require('./secrets.json');

module.exports = {
  solidity: "0.8.4",
  networks: {
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/' + infura_project_id,
      accounts: {mnemonic: rinkeby_mnemonic},
    },
    kovan: {
      url: 'https://kovan.infura.io/v3/' + infura_project_id,
      accounts: {mnemonic: kovan_mnemonic},
    },
  },
  etherscan: {
    apiKey: etherscan_api_key,
  }
};
