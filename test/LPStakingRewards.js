const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPStakingRewards", function () {
  const REWARD_RATE = 2;

  let staker;
  let signers;
  let UNISX, UNISXLP, LPStakingRewards, Treasury;
  let periodFinish;

  beforeEach(async () => {
    /* Setup roles */
    [admin, staker] = await ethers.provider.listAccounts();
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    };

    /* Deploy contracts */
    const LPStakingRewardsContract = await ethers.getContractFactory("LPStakingRewards")
    const UNISXLPContract = await ethers.getContractFactory("TestLP");
    const UNISXContract = await ethers.getContractFactory("TestUNISX");
    const TestTreasuryContract = await ethers.getContractFactory("TestTreasury");

    UNISXLP = await UNISXLPContract.deploy(46n * (10n ** (9n + 6n))); // 46 billion max supply
    await UNISXLP.deployed();
    UNISX = await UNISXContract.deploy(10n ** (7n + 18n)); // 10 million max supply
    await UNISX.deployed();
    Treasury = await TestTreasuryContract.deploy();
    await Treasury.deployed();

    periodFinish = (await ethers.provider.getBlock('latest')).timestamp + 2000;

    LPStakingRewards = await LPStakingRewardsContract.deploy(
      Treasury.address,
      UNISXLP.address,
      UNISX.address,
      REWARD_RATE,
      periodFinish,
    );
    await LPStakingRewards.deployed();

    /* Give reward token to treasury contract */
    await UNISX.transfer(Treasury.address, 1_000_000n * (10n ** 18n)); // 1,000,000 UNISX
  });

  it("Gives reward to staker", async function () {
    /* Stake */
    const STAKE_VALUE = 100_000000n // 100 UNISXLP

    await UNISXLP.transfer(staker, STAKE_VALUE);
    await UNISXLP.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait();

    expect((await UNISXLP.balanceOf(staker)).toString()).to.equal('0');

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp;

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait();

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp;
    const rewardReceived = await UNISX.balanceOf(staker);
    expect(rewardReceived.toString()).to.equal(
      (REWARD_RATE * (stakeEndTime - stakeStartTime)).toString()
    );

    /* Withdraw */
    await (await LPStakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)).wait();
    expect((await UNISXLP.balanceOf(staker)).toString()).to.equal(STAKE_VALUE.toString());
  });

  it("Doesn't give reward after periodFinish", async () => {
    /* Give balance and approve */
    const STAKE_VALUE = 100_000000n // 100 UNISXLP
    await UNISXLP.transfer(staker, STAKE_VALUE);
    await UNISXLP.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);

    const current = (await ethers.provider.getBlock('latest')).timestamp;

    /* Increase time to periodFinish */
    await ethers.provider.send("evm_increaseTime", [periodFinish - current]);
    await ethers.provider.send("evm_mine");

    // Stake
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait();

    // Increase time to get reward
    await ethers.provider.send("evm_increaseTime", [1000]);
    await ethers.provider.send("evm_mine");

    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait();

    const rewardReceived = await UNISX.balanceOf(staker);
    expect(rewardReceived.toString()).to.equal('0');
  });

  it("Lets owner to change reward", async () => {
    const NEW_REWARD_RATE = 3;
    await (await LPStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();
    expect((await LPStakingRewards.rewardRate()).toString()).to.equal(NEW_REWARD_RATE.toString());
  });

  it("Doesn't let non-owner to change reward", async () => {
    const NEW_REWARD_RATE = 3;
    expect(LPStakingRewards.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Doesn't allow to stake if balance is not sufficient", async () => {
    const STAKE_VALUE = 1;
    await UNISXLP.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
    expect(LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it("Correctly changes rate on setRewardRate", async () => {
    /* Stake */
    const STAKE_VALUE = 100_000000n; // 100 UNISXLP

    await UNISXLP.transfer(staker, STAKE_VALUE);
    await UNISXLP.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait();

    const stakeStartTime = (await ethers.provider.getBlock('latest')).timestamp;

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    /* Set new reward rate */
    const NEW_REWARD_RATE = 3;
    await (await LPStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();
    const rewardUpdateTime = (await ethers.provider.getBlock('latest')).timestamp;

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    /* Get reward */
    await (await LPStakingRewards.connect(signers.staker).getReward()).wait();

    const stakeEndTime = (await ethers.provider.getBlock('latest')).timestamp;

    const rewardReceived = await UNISX.balanceOf(staker);
    expect(rewardReceived.toString()).to.equal(
      (
        REWARD_RATE * (rewardUpdateTime - stakeStartTime)
        +
        NEW_REWARD_RATE * (stakeEndTime - rewardUpdateTime)
      ).toString()
    );
  });
});
