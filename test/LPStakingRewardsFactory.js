const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LPStakingRewardsFactory", function () {
  let admin;
  let signers;
  let UNISX, UNISXLP, LPStakingRewardsFactory;

  beforeEach(async () => {
    /* Setup roles */
    [admin, staker] = await ethers.provider.listAccounts()
    signers = {
      admin: ethers.provider.getSigner(0),
      staker: ethers.provider.getSigner(1),
    }

    /* Deploy contracts */
    const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory")
    const UNISXLPContract = await ethers.getContractFactory("TestLP");
    const UNISXContract = await ethers.getContractFactory("TestUNISX");

    UNISXLP = await UNISXLPContract.deploy(1000)
    await UNISXLP.deployed()
    UNISX = await UNISXContract.deploy(1000)
    await UNISX.deployed()

    LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy()
    await LPStakingRewardsFactory.deployed()
  });

  it("Successfully executes createLPStakingRewards", async function () {
    await (await LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1,
      Math.round(new Date().getTime() / 1000),
    )).wait();

    expect(await LPStakingRewardsFactory.stakingRewards(UNISXLP.address)).to.not.equal(
      '0x0000000000000000000000000000000000000000'
    );
  });

  it("Transfers ownership to creator", async function () {
    await (await LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1,
      Math.round(new Date().getTime() / 1000),
    )).wait();

    const stakingRewardsAddress = await LPStakingRewardsFactory.stakingRewards(UNISXLP.address);
    const LPStakingRewards = await ethers.getContractFactory("LPStakingRewards");
    const stakingRewards = LPStakingRewards.attach(stakingRewardsAddress);
    expect(await stakingRewards.owner()).to.equal(admin);
    await stakingRewards.setRewardRate(0);
  });

  it("Doesn't allow to createLPStakingRewards if not an owner", async function () {
    expect(LPStakingRewardsFactory.connect(signers.staker).createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1,
      Math.round(new Date().getTime() / 1000),
    )).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Allows to create a new LPStakingRewards contract after periodFinish has passed", async () => {
    const currentTimestamp = BigInt((await ethers.provider.getBlock("latest")).timestamp);
    const TIME0 = 500n;
    const TIME1 = 500n;

    const initialStakingRewards = await LPStakingRewardsFactory.stakingRewards(UNISXLP.address);
    expect(initialStakingRewards).to.equal(
      '0x0000000000000000000000000000000000000000'
    );

    await (await LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1n,
      currentTimestamp + TIME0 + TIME1,
    )).wait()
    
    const currentStakingRewards = await LPStakingRewardsFactory.stakingRewards(UNISXLP.address);
    expect(currentStakingRewards).to.not.equal(
      '0x0000000000000000000000000000000000000000'
    );

    const StakingRewards = await ethers.getContractAt('LPStakingRewards', currentStakingRewards);
    const periodFinish = await StakingRewards.periodFinish();
    expect(periodFinish).to.equal((currentTimestamp + TIME0 + TIME1).toString());

    await expect(LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1n,
      1000000000000000n,
    )).to.be.revertedWith("already exists");

    await ethers.provider.send("evm_increaseTime", [Number(TIME0)]);
    await ethers.provider.send("evm_mine");
    await expect(LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address, 
      UNISX.address, 
      1n,
      1000000000000000n
    )).to.be.revertedWith("already exists");
    await ethers.provider.send("evm_increaseTime", [Number(TIME1)]);
    await ethers.provider.send("evm_mine");
    await (await LPStakingRewardsFactory.createLPStakingRewards(
      UNISXLP.address,
      UNISX.address,
      1,
      1000000000000000,
    )).wait()

    const newStakingRewards = await LPStakingRewardsFactory.stakingRewards(UNISXLP.address);
    expect(newStakingRewards).to.not.equal(currentStakingRewards);
  })
});
