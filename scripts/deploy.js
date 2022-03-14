async function deploy() {

  const UNISX_Supply = 10n ** (18n /*decimals*/ + 6n /* 1 million */)
  const REWARD_RATE = 
      1000n * // 1000 tokens to distribute per year
      (10n ** 18n) // decimals
      / 365n / 24n / 3600n // seconds per year

  const UNISXStakingRewardsContract = await ethers.getContractFactory("UNISXStakingRewards")
  const UNISXContract = await ethers.getContractFactory("UNISX")
  const xUNISXContract = await ethers.getContractFactory("xUNISX")

  UNISX = await UNISXContract.deploy(UNISX_Supply)
  await UNISX.deployed()
  console.log("UNISX deployed to:", UNISX.address);

  xUNISX = await xUNISXContract.deploy()
  await xUNISX.deployed()
  console.log("xUNISX deployed to:", xUNISX.address);

  StakingRewards = await UNISXStakingRewardsContract.deploy(
    UNISX.address,
    UNISX.address,
    xUNISX.address,
    REWARD_RATE,
  )
  await StakingRewards.deployed()

  console.log("StakingRewards deployed to:", StakingRewards.address);

  /* Allow reward contract to mint xUNISX */
  console.log('Granting xUNISX MINTER permission to StakingRewards')
  const MINTER_ROLE = await xUNISX.MINTER_ROLE();
  (await xUNISX.grantRole(MINTER_ROLE, StakingRewards.address)).wait()
  console.log('xUNISX MINTER permission granted')


  const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory")
  const LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy()
  await LPStakingRewardsFactory.deployed()
  console.log('LPStakingRewardsFactory address:', LPStakingRewardsFactory.address)
}

module.exports = deploy
