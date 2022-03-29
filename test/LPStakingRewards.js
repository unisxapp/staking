const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPStakingRewards", function () {
  const REWARD_RATE = 2;

  let admin, staker;
  let signers;
  let UNISX, USDC, LPStakingRewards;
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
    const USDCContract = await ethers.getContractFactory("MockUSDC");
    const UNISXContract = await ethers.getContractFactory("MockUNISX");

    USDC = await USDCContract.deploy(46n * (10n ** (9n + 6n))); // 46 billion max supply
    await USDC.deployed();
    UNISX = await UNISXContract.deploy(10n ** (6n + 18n)); // 1 million max supply
    await UNISX.deployed();

    periodFinish = (await ethers.provider.getBlock('latest')).timestamp + 2000;

    LPStakingRewards = await LPStakingRewardsContract.deploy(
      USDC.address,
      UNISX.address,
      REWARD_RATE,
      periodFinish,
    );
    await LPStakingRewards.deployed();
  });

  it("Should give reward to staker", async function () {
    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 500_000n * (10n ** 18n)) // 500,000 UNISX

    /* Stake */
    const STAKE_VALUE = 100_000000n // 100 USDC

    await USDC.transfer(staker, STAKE_VALUE);
    await USDC.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
    await (await LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).wait();

    expect((await USDC.balanceOf(staker)).toString()).to.equal('0');

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
    expect((await USDC.balanceOf(staker)).toString()).to.equal(STAKE_VALUE.toString());
  });

  it("Should not give reward after periodFinish", async () => {
    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 500_000n * (10n ** 18n)) // 500,000 UNISX

    /* Give balance and approve */
    const STAKE_VALUE = 100_000000n // 100 USDC
    await USDC.transfer(staker, STAKE_VALUE);
    await USDC.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);

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

  it('Owner should be able to change reward', async () => {
    const NEW_REWARD_RATE = 3;
    await (await LPStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();
    expect((await LPStakingRewards.rewardRate()).toString()).to.equal(NEW_REWARD_RATE.toString());
  });

  it('Non-owner should not be able to change reward', async () => {
    const NEW_REWARD_RATE = 3;
    expect(LPStakingRewards.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should not allow to stake if USDC balance is not sufficient', async () => {
    const STAKE_VALUE = 1;
    await USDC.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
    expect(LPStakingRewards.connect(signers.staker).stake(STAKE_VALUE)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it('Rewards must change after setRewardRate', async () => {
    /* Give reward token to LPStakingRewards contract */
    await UNISX.transfer(LPStakingRewards.address, 500_000n * (10n ** 18n)) // 500,000 UNISX

    /* Stake */
    const STAKE_VALUE = 100_000000n; // 100 USDC

    await USDC.transfer(staker, STAKE_VALUE);
    await USDC.connect(signers.staker).approve(LPStakingRewards.address, STAKE_VALUE);
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
