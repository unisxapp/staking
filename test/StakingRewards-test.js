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

    const StakingRewards = await StakingRewardsContract.deploy(UNISX.address, UNISX.address, REWARD_RATE)
    await StakingRewards.deployed()

    /* Give reward token to StakingRewards contract */

    await UNISX.mint(2_000_000n)
    await UNISX.transfer(StakingRewards.address, 2_000_000n)

    /* Allow reward contract to mint xUNISX */

    /* Stake */

    const STAKE_VALUE = 1000n

    await UNISX.connect(signers.staker).mint(STAKE_VALUE)
    await UNISX.connect(signers.staker).approve(StakingRewards.address, STAKE_VALUE)
    await (await StakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait()

    const ts1 = (await ethers.provider.getBlock('latest')).timestamp

    expect((await UNISX.balanceOf(staker)).toString()).to.equal('0')
    console.log('staking rew balance', (await UNISX.balanceOf(StakingRewards.address)).toString())


    await ethers.provider.send("evm_increaseTime", [600])
    await ethers.provider.send("evm_mine")

    const ts2 = (await ethers.provider.getBlock('latest')).timestamp

    console.log(ts1, ts2, ts2 - ts1)

    await (await StakingRewards.connect(signers.staker).stake(0)).wait()

    await (await StakingRewards.connect(signers.staker).getReward()).wait()

    console.log('new balance', (await UNISX.balanceOf(staker)).toString())


    /*
    const store = await StakingRewards.deploy()
    await store.deployed()

    expect(await store.CID()).to.equal("test1")

    const setCIDTx = await store.setCID("test2")

    // wait until the transaction is mined
    await setCIDTx.wait()

    expect(await store.CID()).to.equal("test2")
    */
  });

  /*
  it("Should fail to change CID if not an owner", async function () {
    const CIDStore = await ethers.getContractFactory("CIDStore");
    const store = await CIDStore.deploy("test1");
    await store.deployed();

    expect(await store.CID()).to.equal("test1");

    const user = ethers.provider.getSigner(1);

    let message;
    try {
      const setCIDTx = await store.connect(user).setCID("test2");
    } catch(e) {
      message = e.message
    }

    if (message == null || message.indexOf('caller is not the owner') == -1) {
      throw new Error('Revert expected')
    }

    expect(await store.CID()).to.equal("test1");
  });
  */

});
