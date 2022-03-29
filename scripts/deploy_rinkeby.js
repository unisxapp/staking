const { ethers } = require('hardhat');

async function deploy() {
    // const UNISX_Supply = 10n ** (18n /*decimals*/ + 6n /* 1 million */)
    const REWARD_RATE = 
        1000n * // 1000 tokens to distribute per year
        (10n ** 18n) // decimals
        / 365n / 24n / 3600n // seconds per year
  
    const UNISXStakingRewardsContract = await ethers.getContractFactory("UNISXStakingRewards");
    // const UNISXContract = await ethers.getContractFactory("UNISX");
  
    // UNISX = await UNISXContract.deploy(UNISX_Supply)
    // await UNISX.deployed()
    // console.log("UNISX deployed to:", UNISX.address);
  
    const StakingRewards = await UNISXStakingRewardsContract.deploy(
      "0x0eA474A543ADa0fd7Ef04cd5a7583414AA7B3D85",
      "0xafa5f381c5bf59cf9b4ec21691f7a1bca2f18f15",
      REWARD_RATE,
      {
        gasPrice: ethers.utils.parseUnits('25', 'gwei'),
      }
    )
    await StakingRewards.deployed()
    console.log("StakingRewards deployed to:", StakingRewards.address, 'with tx:', StakingRewards.deployTransaction.hash);
  
    const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory");
    const LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy({
        gasPrice: ethers.utils.parseUnits('25', 'gwei'),
    });
    await LPStakingRewardsFactory.deployed();
    console.log('LPStakingRewardsFactory address:', LPStakingRewardsFactory.address, 'with tx:', LPStakingRewardsFactory.deployTransaction.hash);
}
  
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
