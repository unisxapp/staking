async function deploy() {
    const UNISX_Supply = 10n ** (18n /*decimals*/ + 6n /* 1 million */)
    const REWARD_RATE = 
        1000n * // 1000 tokens to distribute per year
        (10n ** 18n) // decimals
        / 365n / 24n / 3600n // seconds per year
  
    const UNISXStakingRewardsContract = await ethers.getContractFactory("UNISXStakingRewards");
    const UNISXContract = await ethers.getContractFactory("UNISX");
  
    UNISX = await UNISXContract.deploy(UNISX_Supply)
    await UNISX.deployed()
    console.log("UNISX deployed to:", UNISX.address);
  
    StakingRewards = await UNISXStakingRewardsContract.deploy(
      UNISX.address,
      "0xafa5f381c5bf59cf9b4ec21691f7a1bca2f18f15",
      REWARD_RATE,
    )
    await StakingRewards.deployed()
    console.log("StakingRewards deployed to:", StakingRewards.address);
  
    const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory")
    const LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy()
    await LPStakingRewardsFactory.deployed()
    console.log('LPStakingRewardsFactory address:', LPStakingRewardsFactory.address)
}
  
deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
