const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UNISXStakingRewards", function () {
  const REWARD_RATE = 2n;

  let staker;
  let signers;
  let UNISX, xUNISX, TokenManager, UNISXStakingRewards;

  beforeEach(async () => {
    /* Setup roles */
    [admin, staker] = await ethers.provider.listAccounts();
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    };

    /* Deploy contracts */
    UNISX = await (await ethers.getContractFactory("MockUNISX")).deploy(10n ** (18n + 6n)); // 1 million
    await UNISX.deployed();
    TokenManager = await (await ethers.getContractFactory("MockTokenManager")).deploy();
    await TokenManager.deployed();
    xUNISX = await ethers.getContractAt('MockXUNISX', await TokenManager.xUNISX());
    UNISXStakingRewards = await (
      await ethers.getContractFactory("UNISXStakingRewards")
    ).deploy(UNISX.address, TokenManager.address, REWARD_RATE);

    /* Give mint and burn permissions to staking contract */
    const MINTER_ROLE = await TokenManager.MINTER_ROLE();
    const BURNER_ROLE = await TokenManager.BURNER_ROLE();
    await TokenManager.grantRole(MINTER_ROLE, UNISXStakingRewards.address);
    await TokenManager.grantRole(BURNER_ROLE, UNISXStakingRewards.address);
  });

  it("Should give reward to staker", async function () {
    /* Give reward token to xUNISX contract */
    await UNISX.transfer(UNISXStakingRewards.address, 500_000n * (10n ** 18n)); // 500,000 UNISX

    /* Stake */
    const STAKE_VALUE = 100n * (10n ** 18n); // 100 UNISX

    await UNISX.transfer(staker, STAKE_VALUE);
    await UNISX.connect(signers.staker).approve(
      UNISXStakingRewards.address,
      STAKE_VALUE
    );
    await (
      await UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).wait();

    expect((await UNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal(
      STAKE_VALUE.toString()
    );

    const stakeStartTime = (await ethers.provider.getBlock("latest")).timestamp;

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [600]);
    await ethers.provider.send("evm_mine");

    const stakeEndTime = (await ethers.provider.getBlock("latest")).timestamp;
    
    /* Get reward */
    await (
      await UNISXStakingRewards.connect(signers.staker).getReward()
    ).wait();

    const rewardReceived = await UNISX.balanceOf(staker);
    expect(rewardReceived.toString()).to.equal(
      (Number(REWARD_RATE) * (stakeEndTime - stakeStartTime)).toString()
    );

    /* Withdraw */
    await (
      await UNISXStakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)
    ).wait();
    expect((await UNISX.balanceOf(staker)).toString()).to.equal(
      (STAKE_VALUE + BigInt(rewardReceived.toNumber())).toString()
    );
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUNISX.totalSupply()).toString()).to.equal("0");
  });

  it("Owner should be able to change reward", async () => {
    const NEW_REWARD_RATE = 3;
    await (await UNISXStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();
    expect((await UNISXStakingRewards.rewardRate()).toString()).to.equal(
      NEW_REWARD_RATE.toString()
    );
  });

  it("Non-owner should not be able to change reward", async () => {
    const NEW_REWARD_RATE = 3;
    expect(
      UNISXStakingRewards.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should not allow to stake if UNISX balance is not sufficient", async () => {
    const STAKE_VALUE = 1;
    await UNISX.connect(signers.staker).approve(xUNISX.address, STAKE_VALUE);
    expect(
      UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Rewards must change after setRewardRate", async () => {
    /* Give reward token to UNISXStakingRewards contract */
    await UNISX.transfer(UNISXStakingRewards.address, 500_000n * (10n ** 18n)); // 500,000 UNISX

    /* Stake */
    const STAKE_VALUE = 100n * (10n ** 18n); // 100 UNISX
    const TIME = 600n;

    await UNISX.transfer(staker, STAKE_VALUE);
    await UNISX.connect(signers.staker).approve(
      UNISXStakingRewards.address,
      STAKE_VALUE
    );
    await (
      await UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
      ).wait();

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [Number(TIME)]);
    await ethers.provider.send("evm_mine");

    /* Set new reward rate */
    const NEW_REWARD_RATE = 3n;
    await (await UNISXStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();

    /* Increase time */
    await ethers.provider.send("evm_increaseTime", [Number(TIME)]);
    await ethers.provider.send("evm_mine");
    
    /* Get reward */
    await (
      await UNISXStakingRewards.connect(signers.staker).getReward()
    ).wait();

    const rewardReceived = await UNISX.balanceOf(staker);

    expect(rewardReceived.toString()).to.equal(
      (
        REWARD_RATE * TIME +
        NEW_REWARD_RATE * TIME
      ).toString()
    );
  });

  it("Should not allow reward claim when there are no rewards on the contract", async () => {
    /* Stake */
    const STAKE_VALUE = 10_000000000000000000n;

    await UNISX.transfer(staker, STAKE_VALUE);
    await UNISX.connect(signers.staker).approve(
      UNISXStakingRewards.address,
      STAKE_VALUE
    );
    await (
      await UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).wait();

    expect((await UNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal(
      STAKE_VALUE.toString()
    );

    /* Increase time */
    const TIME = 600n;
    await ethers.provider.send("evm_increaseTime", [Number(TIME)]);
    await ethers.provider.send("evm_mine");

    /* View earned */
    expect((await UNISXStakingRewards.earned(staker)).toString()).to.equal(
      (REWARD_RATE * TIME).toString()
    );

    /* Fail to get reward */
    await expect(
      UNISXStakingRewards.connect(signers.staker).getReward()
    ).to.be.revertedWith("out of reward");

    /* Give reward token to UNISXStakingRewards contract */
    await UNISX.transfer(UNISXStakingRewards.address, 2_000_000n);

    /* Succeed to get reward */
    await (
      await UNISXStakingRewards.connect(signers.staker).getReward()
    ).wait();
    expect((await UNISX.balanceOf(staker)).toString()).to.equal(
      (REWARD_RATE * TIME).toString()
    );

    /* Withdraw */
    await (
      await UNISXStakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)
    ).wait();
    expect((await UNISX.balanceOf(staker)).toString()).to.equal(
      (STAKE_VALUE + REWARD_RATE * TIME).toString()
    );
    expect((await xUNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUNISX.totalSupply()).toString()).to.equal("0");
  });
});
