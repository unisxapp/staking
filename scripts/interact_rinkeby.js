const { ethers } = require("hardhat");

const account = '0x187e11BFcD3998150487444dA5B736F1DF133154';
const UNISX = '0x0eA474A543ADa0fd7Ef04cd5a7583414AA7B3D85';
const StakingRewards = '0xdae1ead229313dc73d46B3b496f8eB84aD20232A';
const LPStakingRewardsFactory = '0xff2bF3e9136577A28E00d2dd44430Fb7fF4489fC';
const TokenManager = '0xafa5f381c5bf59cf9b4ec21691f7a1bca2f18f15';

async function main() {
    console.log(UNISX, StakingRewards, LPStakingRewardsFactory, TokenManager)
    const UNISXContract = await ethers.getContractAt('UNISX', UNISX);
    const StakingRewardsContract = await ethers.getContractAt('UNISXStakingRewards', StakingRewards);
    const name = await UNISXContract.name();
    console.log(name);
    let balance = await UNISXContract.balanceOf(account);
    console.log(balance);
    const reward = await StakingRewardsContract.rewardPerToken();
    console.log(reward);

    // const approve = await UNISXContract.approve(StakingRewardsContract.address, '115792089237316195423570985008687907853269984665640564039457584007913129639935');
    // console.log(approve);

    // const allowance = await UNISXContract.allowance(account, StakingRewardsContract.address);
    // console.log(allowance);

    // const tx = await StakingRewardsContract.stake(10_000000000000000000n);
    // const tx = await StakingRewardsContract.withdraw(100_000000000000000000n);
    // await StakingRewardsContract.getReward();

    // await StakingRewardsContract.withdraw(1_000000000000000000n);

    balance = await UNISXContract.balanceOf(account);
    console.log(balance);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
