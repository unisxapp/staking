const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UNISXStakingRewards", function () {
  const REWARD_RATE = 2n;

  let staker;
  let treasury;
  let signers;
  let UNISX, xUSX, TokenManager, UNISXStakingRewards;

  beforeEach(async () => {
    /* Setup roles */
    [admin, staker, treasury] = await ethers.provider.listAccounts();
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
      treasury: ethers.provider.getSigner(2),
    };

    /* Deploy contracts */
    UNISX = await (await ethers.getContractFactory("TestUNISX")).deploy(10n ** (18n + 7n)); // 10 million
    await UNISX.deployed();
    TokenManager = await (await ethers.getContractFactory("TestTokenManager")).deploy();
    await TokenManager.deployed();
    xUSX = await ethers.getContractAt("TestXUSX", await TokenManager.xUSX());
    UNISXStakingRewards = await (
      await ethers.getContractFactory("UNISXStakingRewards")
    ).deploy(
      treasury,
      UNISX.address, 
      TokenManager.address, 
      REWARD_RATE
    );

    /* Give mint and burn permissions to staking contract */
    const MINTER_ROLE = await TokenManager.MINTER_ROLE();
    const BURNER_ROLE = await TokenManager.BURNER_ROLE();
    await TokenManager.grantRole(MINTER_ROLE, UNISXStakingRewards.address);
    await TokenManager.grantRole(BURNER_ROLE, UNISXStakingRewards.address);

    /* Give reward token to treasury contract */
    await UNISX.transfer(treasury, 1_000_000n * (10n ** 18n)); // 1,000,000 UNISX

    /* Give full allowance to staking contract */
    await UNISX.connect(signers.treasury).approve(UNISXStakingRewards.address, ethers.constants.MaxUint256);
  });

  it("Gives reward to staker", async function () {
    /* Stake */
    const STAKE_VALUE = 100n * (10n ** 18n); // 100 UNISX

    await UNISX.transfer(staker, STAKE_VALUE);
    await UNISX.connect(signers.staker).approve(
      UNISXStakingRewards.address,
      ethers.constants.MaxUint256,
    );
    await (
      await UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).wait();

    expect((await UNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUSX.balanceOf(staker)).toString()).to.equal(
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
    expect((await xUSX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUSX.totalSupply()).toString()).to.equal("0");
  });

  it("Lets owner change the reward rate", async () => {
    const NEW_REWARD_RATE = 3;
    await (await UNISXStakingRewards.setRewardRate(NEW_REWARD_RATE)).wait();
    expect((await UNISXStakingRewards.rewardRate()).toString()).to.equal(
      NEW_REWARD_RATE.toString()
    );
  });

  it("Doesn't let non-owner to change the reward rate", async () => {
    const NEW_REWARD_RATE = 3;
    expect(
      UNISXStakingRewards.connect(signers.staker).setRewardRate(NEW_REWARD_RATE)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Doesn't allow to stake if UNISX balance is not sufficient", async () => {
    const STAKE_VALUE = 1;
    await UNISX.connect(signers.staker).approve(xUSX.address, STAKE_VALUE);
    expect(
      UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Makes rewards change after setRewardRate", async () => {
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

  it("Doesn't not allow reward claim when there are no rewards in the treasury", async () => {
    const treasuryBalance = await UNISX.balanceOf(treasury);
    await UNISX.connect(signers.treasury).transfer(admin, treasuryBalance);

    /* Stake */
    const STAKE_VALUE = 10n * 18n;

    await UNISX.transfer(staker, STAKE_VALUE);
    await UNISX.connect(signers.staker).approve(
      UNISXStakingRewards.address,
      STAKE_VALUE
    );
    await (
      await UNISXStakingRewards.connect(signers.staker).stake(STAKE_VALUE)
    ).wait();

    expect((await UNISX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUSX.balanceOf(staker)).toString()).to.equal(
      STAKE_VALUE.toString()
    );

    /* Increase time */
    const TIME = 600n;
    await ethers.provider.send("evm_increaseTime", [Number(TIME)]);
    await ethers.provider.send("evm_mine");

    /* Fail to get reward */
    await expect(
      UNISXStakingRewards.connect(signers.staker).getReward()
    ).to.be.reverted;

    /* Give reward token to UNISXStakingRewards contract */
    await UNISX.transfer(treasury, 1_000_000n);

    /* Succeed to get reward */
    await (
      await UNISXStakingRewards.connect(signers.staker).getReward()
    ).wait();
    expect(Number((await UNISX.balanceOf(staker)).toString())).to.greaterThanOrEqual(
      Number((REWARD_RATE * TIME).toString())
    );

    /* Withdraw */
    await (
      await UNISXStakingRewards.connect(signers.staker).withdraw(STAKE_VALUE)
    ).wait();
    expect(Number((await UNISX.balanceOf(staker)).toString())).to.greaterThanOrEqual(
      Number((STAKE_VALUE + REWARD_RATE * TIME).toString())
    );
    expect((await xUSX.balanceOf(staker)).toString()).to.equal("0");
    expect((await xUSX.totalSupply()).toString()).to.equal("0");
  });
});
