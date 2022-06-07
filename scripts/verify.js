const { ethers, run } = require('hardhat');

async function main() {
    if (ethers.utils.isAddress(process.env.TREASURY) === false) throw new Error('invalid treasuryAddress!');
    if (ethers.utils.isAddress(process.env.UNISX_TOKEN) === false) throw new Error('invalid treasuryAddress!');
    if (ethers.utils.isAddress(process.env.XUSX_MANAGER) === false) throw new Error('invalid treasuryAddress!');

    await run('verify:verify', {
        address: process.env.DEPLOYED_UNISX_STAKING,
        constructorArguments: [
            process.env.TREASURY,
            process.env.UNISX_TOKEN,
            process.env.XUSX_MANAGER,
            process.env.REWARD_RATE,
        ],
    });
    await run('verify:verify', {
        address: process.env.DEPLOYED_STAKING_FACTORY,
        constructorArguments: [],
    });
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
