const { ethers, run } = require('hardhat');

async function deploy() {
  
  const UNISX = '0xDD641511cE248fF136095aa49A02FeF18CBbfc2A';
  const xUNISXTokenManager = '0xed8bc3d36dd8758aecf279a98f503df929796bb8';
  const REWARD_RATE = 
      80_000_000n * // 1000 tokens to distribute per year
      (10n ** 18n) // decimals
      / 365n / 24n / 3600n / 3n; // seconds per year
  
  console.log(0);
  await run('verify:verify', {
    address: '0x84b55204DD018Df703765A1005Dd3A5223aFFFcb',
    constructorArguments: [
      UNISX,
      xUNISXTokenManager,
      REWARD_RATE
    ]
  });
  console.log(0);
  await run('verify:verify', {
    address: '0xea337f6d78eD90d8488c18b641dbDA1d5675Ef40',
    constructorArguments: []
  });
  console.log(0);

  // console.log('Deploying with reward rate:', REWARD_RATE);

  // const UNISXStakingRewardsContract = await ethers.getContractFactory("UNISXStakingRewards");
  // const UNISXStakingRewards = await UNISXStakingRewardsContract.deploy(
  //   UNISX,
  //   xUNISXTokenManager,
  //   REWARD_RATE,
  //   {
  //     gasPrice: ethers.utils.parseUnits('25', 'gwei')
  //   }
  // );
  // await UNISXStakingRewards.deployed();
  // console.log("StakingRewards deployed to:", UNISXStakingRewards.address, 'with tx', UNISXStakingRewards.deployTransaction.hash);

  // const LPStakingRewardsFactoryContract = await ethers.getContractFactory("LPStakingRewardsFactory")
  // const LPStakingRewardsFactory = await LPStakingRewardsFactoryContract.deploy({
  //   gasPrice: ethers.utils.parseUnits('25', 'gwei')
  // });
  // await LPStakingRewardsFactory.deployed()
  // console.log('LPStakingRewardsFactory address:', LPStakingRewardsFactory.address, 'with tx:', LPStakingRewardsFactory.deployTransaction.hash);
}

deploy()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

/**
 * Live deployments:
 * 
 * UNISXStakingRewards:     0x84b55204DD018Df703765A1005Dd3A5223aFFFcb dep tx 0xdab3d1885caef7b4d2bae6e498b46523244a2908baa066921f309feedb7b8ae7
 * LPStakingRewardsFactory: 0xea337f6d78eD90d8488c18b641dbDA1d5675Ef40 dep tx 0x0f53e1919086d702c82e8cf8868fd6f814f5e86f86a1cdffa24525edfb0e727d
 */