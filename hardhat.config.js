require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

const deploy = require("./scripts/deploy.js");

const { infura_project_id } = require("./secrets.json");

module.exports = {
  solidity: "0.8.4",
  networks: {
    // rinkeby: {
    //   url: 'https://rinkeby.infura.io/v3/' + infura_project_id,
    //   accounts: {mnemonic: rinkeby_mnemonic},
    // },
    // kovan: {
    //   url: 'https://kovan.infura.io/v3/' + infura_project_id,
    //   accounts: {mnemonic: kovan_mnemonic},
    // },
    hardhat: {
      forking: {
        url: infura_project_id,
        timeout: 0,
      },
      accounts: { mnemonic: process.env.MNEMONIC },
    },
  },
  // etherscan: {
  //   apiKey: etherscan_api_key,
  // }
};

task("deploy", "Deploys contracts").setAction(deploy);
