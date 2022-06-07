const { ethers } = require('hardhat');
require("dotenv").config();

async function deploy() {
  if (ethers.utils.isAddress(process.env.TREASURY) === false) throw new Error('invalid TREASURY!');
  if (ethers.utils.isAddress(process.env.UNISX_TOKEN) === false) throw new Error('invalid UNISX_TOKEN!');
  if (ethers.utils.isAddress(process.env.XUSX_MANAGER) === false) throw new Error('invalid XUSX_MANAGER!');
  if (isNaN(Number(process.env.GAS_PRICE_GWEI)) === true) throw new Error('invalid GAS_PRICE_GWEI!');
  if (Number(process.env.GAS_PRICE_GWEI) < 1 || Number(process.env.GAS_PRICE_GWEI) > 1000) throw new Error('GAS_PRICE_GWEI must be between 1 and 1000!');
  if (typeof process.env.REWARD_RATE !== "string") throw new Error('REWARD_RATE must be a string!');
  if (isNaN(Number(process.env.REWARD_RATE)) === true) throw new Error('REWARD_RATE must convert to a real number!');
  
  const UNISXStakingRewardsContract = await ethers.getContractFactory("UNISXStakingRewards");
  const UNISXStakingRewards = await UNISXStakingRewardsContract.deploy(
    process.env.TREASURY,
    process.env.UNISX_TOKEN,
    process.env.XUSX_MANAGER,
    process.env.REWARD_RATE,
    {
      gasPrice: BigInt(process.env.GAS_PRICE_GWEI) * (10n ** 9n),
    },
  );
  await UNISXStakingRewards.deployed();
  console.log("UNISXStakingRewards successfully deployed at", UNISXStakingRewards.address, "with tx", UNISXStakingRewards.deployTransaction.hash);

  const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory")
  const LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy({
    gasPrice: BigInt(process.env.GAS_PRICE_GWEI) * (10n ** 9n),
  });
  await LPStakingRewardsFactory.deployed()
  console.log('LPStakingRewardsFactory address deployed at', LPStakingRewardsFactory.address, 'with tx', LPStakingRewardsFactory.deployTransaction.hash);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
      console.error(error);
      process.exit(1);
  });
