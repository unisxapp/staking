const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingRewards", function () {

  it("Should give reward to staker", async function () {

    /* Setup roles */
    const [admin, staker] = await ethers.provider.listAccounts()
    const signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    }


    const REWARD_RATE = 2


    /* Deploy contracts */

    const StakingRewardsContract = await ethers.getContractFactory("StakingRewards")
    const UNISXContract = await ethers.getContractFactory("TestUNISX")
    const xUNISXContract = await ethers.getContractFactory("xUNISX")

    const UNISX = await UNISXContract.deploy()
    await UNISX.deployed()

    const xUNISX = await xUNISXContract.deploy()
    await xUNISX.deployed()

    const StakingRewards = await StakingRewardsContract.deploy(
      UNISX.address,
      UNISX.address,
      xUNISX.address,
      REWARD_RATE,
    )
    await StakingRewards.deployed()


    /* Give reward token to StakingRewards contract */

    await UNISX.mint(2_000_000n)
    await UNISX.transfer(StakingRewards.address, 2_000_000n)

    /* Allow reward contract to mint xUNISX */

    const MINTER_ROLE = await xUNISX.MINTER_ROLE();
    await xUNISX.grantRole(MINTER_ROLE, StakingRewards.address);

    /* Stake */

    const STAKE_VALUE = 1000

    await UNISX.connect(signers.staker).mint(STAKE_VALUE)
    await UNISX.connect(signers.staker).approve(StakingRewards.address, STAKE_VALUE)
    await (await StakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait()

    expect((await UNISX.balanceOf(staker)).toString()).to.equal('0')
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal(STAKE_VALUE.toString())

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")


    /* Get reward */
    await (await StakingRewards.connect(signers.staker).getReward()).wait()

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp
    const rewardReceived = await UNISX.balanceOf(staker)
    expect(rewardReceived.toString()).to.equal(
      (REWARD_RATE * (stakeEndTime - stakeStartTime)).toString()
    )

    /* Withdraw */
    
    // First allow StakingRewards to spend xUNISX
    await xUNISX.connect(signers.staker).approve(StakingRewards.address, STAKE_VALUE)

    await (await StakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)).wait()
    expect((await UNISX.balanceOf(staker)).toString()).to.equal(
      (STAKE_VALUE + rewardReceived.toNumber()).toString()
    )
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal('0')
    expect((await xUNISX.totalSupply()).toString()).to.equal('0')

  });

});
