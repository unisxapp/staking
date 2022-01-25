const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPStakingRewards", function () {

  const UNISX_Supply = 10n ** (18n /*decimals*/ + 6n /* 1 million */)
  const REWARD_RATE = 2

  let admin, staker
  let signers
  let UNISX, LPTest, LPStakingRewards
  let periodFinish

  beforeEach(async () => {

    /* Setup roles */
    [admin, staker] = await ethers.provider.listAccounts()
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    }

    /* Deploy contracts */

    const LPStakingRewardsContract = await ethers.getContractFactory("LPStakingRewards")
    const UNISXContract = await ethers.getContractFactory("UNISX")
    const LPTestContract = await ethers.getContractFactory("LPTest")

    UNISX = await UNISXContract.deploy(UNISX_Supply)
    await UNISX.deployed()

    LPTest = await LPTestContract.deploy(1000)
    await LPTest.deployed()

    periodFinish = (await ethers.provider.getBlock('latest')).timestamp + 2000

    LPStakingRewards = await LPStakingRewardsContract.deploy(
      LPTest.address,
      UNISX.address,
      REWARD_RATE,
      periodFinish,
    )
    await LPStakingRewards.deployed()
  });

  it("Should give reward to staker", async function () {

    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 2_000_000n)

    /* Stake */

    const STAKE_VALUE = 1000

    await LPTest.transfer(staker, STAKE_VALUE)
    await LPTest.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE)
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait()

    expect((await LPTest.balanceOf(staker)).toString()).to.equal('0')

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")


    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait()

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp
    const rewardReceived = await UNISX.balanceOf(staker)
    expect(rewardReceived.toString()).to.equal(
      (REWARD_RATE * (stakeEndTime - stakeStartTime)).toString()
    )

    /* Withdraw */
    
    await (await LPStakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)).wait()
    expect((await LPTest.balanceOf(staker)).toString()).to.equal(STAKE_VALUE.toString())

  });

  it("Should not give reward after periodFinish", async () => {
    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 2_000_000n)


    /* Give balance and approve */
    const STAKE_VALUE = 1000
    await LPTest.transfer(staker, STAKE_VALUE)
    await LPTest.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE)

    const current = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time to periodFinish */
    await ethers.provider.send("evm_increaseTime", [periodFinish - current])
    await ethers.provider.send("evm_mine")

    // Stake
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait()

    // Increase time to get reward
    await ethers.provider.send("evm_increaseTime", [1000])
    await ethers.provider.send("evm_mine")

    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait()

    const rewardReceived = await UNISX.balanceOf(staker)
    expect(rewardReceived.toString()).to.equal('0')
  });

  it('Owner should be able to change reward', async () => {
    const NEW_REWARD_RATE = 3
    await (await LPStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait()
    expect((await LPStakingRewards.rewardRate()).toString()).to.equal(NEW_REWARD_RATE.toString())
  });

  it('Non-owner should not be able to change reward', async () => {
    const NEW_REWARD_RATE = 3
    expect(LPStakingRewards.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should not allow to stake if LPTest balance is not sufficient', async () => {
    const STAKE_VALUE = 1
    await LPTest.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE)
    expect(LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).to.be.revertedWith('ERC20: transfer amount exceeds balance')
  });

  it('Rewards must change after setRewardRate', async () => {
    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 2_000_000n)

    /* Stake */

    const STAKE_VALUE = 1000

    await LPTest.transfer(staker, STAKE_VALUE)
    await LPTest.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE)
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait()

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    /* Set new reward rate */
    const NEW_REWARD_RATE = 3
    await (await LPStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait()
    const rewardUpdateTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait()

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp

    const rewardReceived = await UNISX.balanceOf(staker)
    expect(rewardReceived.toString()).to.equal(
      (
        REWARD_RATE * (rewardUpdateTime - stakeStartTime)
        +
        NEW_REWARD_RATE * (stakeEndTime - rewardUpdateTime)
      ).toString()
    )
  });

});
