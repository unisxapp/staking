const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("xUNISX", function () {

  const UNISX_Supply = 10n ** (18n /*decimals*/ + 6n /* 1 million */)
  const REWARD_RATE = 2

  let admin, staker
  let signers
  let UNISX, xUNISX

  beforeEach(async () => {

    /* Setup roles */
    [admin, staker] = await ethers.provider.listAccounts()
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    }

    /* Deploy contracts */

    const xUNISXContract = await ethers.getContractFactory("xUNISX")
    const UNISXContract = await ethers.getContractFactory("UNISX")

    UNISX = await UNISXContract.deploy(UNISX_Supply)
    await UNISX.deployed()

    xUNISX = await xUNISXContract.deploy(
      UNISX.address,
      REWARD_RATE,
    )
    await xUNISX.deployed()
  });

  it("Should give reward to staker", async function () {
    /* Give reward token to xUNISX contract */
    await UNISX.transfer(xUNISX.address, 2_000_000n)

    /* Stake */

    const STAKE_VALUE = 1000

    await UNISX.transfer(staker, STAKE_VALUE)
    await UNISX.connect(signers.staker).approve(xUNISX.address, STAKE_VALUE)
    await (await xUNISX.connect(signers.staker).stake(STAKE_VALUE)).wait()

    expect((await UNISX.balanceOf(staker)).toString()).to.equal('0')
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal(STAKE_VALUE.toString())

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    /* Get reward */
    await (await xUNISX.connect(signers.staker).getReward()).wait()

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp
    const rewardReceived = await UNISX.balanceOf(staker)
    expect(rewardReceived.toString()).to.equal(
      (REWARD_RATE * (stakeEndTime - stakeStartTime)).toString()
    )

    /* Withdraw */
    
    // First allow xUNISX to spend
    await (await xUNISX.connect(signers.staker).withdraw(STAKE_VALUE)).wait()
    expect((await UNISX.balanceOf(staker)).toString()).to.equal(
      (STAKE_VALUE + rewardReceived.toNumber()).toString()
    )
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal('0')
    expect((await xUNISX.totalSupply()).toString()).to.equal('0')

  });

  it('Owner should be able to change reward', async () => {
    const NEW_REWARD_RATE = 3
    await (await xUNISX.setRewardRate(NEW_REWARD_RATE)).wait()
    expect((await xUNISX.rewardRate()).toString()).to.equal(NEW_REWARD_RATE.toString())
  });

  it('Non-owner should not be able to change reward', async () => {
    const NEW_REWARD_RATE = 3
    expect(xUNISX.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should not allow to stake if UNISX balance is not sufficient', async () => {
    const STAKE_VALUE = 1
    await UNISX.connect(signers.staker).approve(xUNISX.address, STAKE_VALUE)
    expect(xUNISX.connect(signers.staker).stake(STAKE_VALUE)).to.be.revertedWith('ERC20: transfer amount exceeds balance')
  });

  it('Rewards must change after setRewardRate', async () => {
    /* Give reward token to xUNISX contract */
    await UNISX.transfer(xUNISX.address, 2_000_000n)

    /* Stake */

    const STAKE_VALUE = 1000

    await UNISX.transfer(staker, STAKE_VALUE)
    await UNISX.connect(signers.staker).approve(xUNISX.address, STAKE_VALUE)
    await (await xUNISX.connect(signers.staker).stake(STAKE_VALUE)).wait()

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    /* Set new reward rate */
    const NEW_REWARD_RATE = 3
    await (await xUNISX.setRewardRate(NEW_REWARD_RATE)).wait()
    const rewardUpdateTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    /* Get reward */
    await (await xUNISX.connect(signers.staker).getReward()).wait()

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
