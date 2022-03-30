# UNISX Staking Smart Contract Security Overview

## Background:

UNISX is a DAO deployed on the Ethereum Mainnet that oversees the operation of synthetic tokens with prices tied to the quotes of various SPAC stock indices. 

Read more about UNISX [here](https://welcome-3.gitbook.io/unisx-project/).

The UNISX DAO is built on the Aragon framework and its synthetic token infrastructure exists within the UMA framework. Both frameworks are commercially audited (by [ConsenSys](https://github.com/ConsenSys/aragon-daotemplates-audit-report-2019-08) and [OpenZeppelin](https://blog.openzeppelin.com/uma-audit-phase-1/) respectively), and as such, our staking contract repository represents the only portion of the UNISX smart contract ecosystem that is built in-house and requires a rigorous overview and due-diligence on potential vulnerabilities.

It goes without saying that all contract functionality described declaritively in this document has been unit tested with Hardhat and on testnets for standard expected behaviours. 

The focus of this overview, however, is less on smart contract functionality and more on the reasoning that has gone into the safety of these contracts.

## Security Overview

There are three staking contracts:

1. **LPStakingRewardsFactory**
2. **LPStakingRewards**
3. **UNISXStakingRewards**

**LPStakingRewardsFactory** is a bare-bones factory contract (under 50 lines of code) which exists for the purpose of deploying LPStakingRewards contracts. 

**LPStakingRewards** and **UNISXStakingRewards** are significantly simplified versions of the [Synthetix StakingRewards contract](https://github.com/Synthetixio/synthetix/blob/master/contracts/StakingRewards.sol) (audited by [iosiro](https://docs.synthetix.io/releases/)).

All three contracts are Ownable as defined by OpenZeppelin, and during operation will be owned by the DAO.

LPStakingRewardsFactory contains only one method – `createLPStakingRewards` – which in turn has the `onlyOwner` modifier and as such is not considered a security concern. The function allows the DAO to deploy LPStakingRewards contracts for a given staking token under the condition that either no LPStakingRewards for such a staking token had been deployed before or that the prior deployed LPStakingRewards is no longer generating rewards. 

LPStakingRewards is a close descendant of Synthetix’s StakingRewards and implements verbatim its staking mathematics in [post-0.8 Solidity format](https://docs.soliditylang.org/en/v0.8.13/080-breaking-changes.html#solidity-v0-8-0-breaking-changes). The order of transferring tokens and updating balances is reversed from the original in some instances to comply with anti-reentrancy best practices. `getReward` contains an additional require statement to ensure the contract never accidentally hands away more staking token than it owes to stakers. This is a useful check in the event that the staking token and reward token are identical, although such a use-case isn’t planned. The only entirely new method in LPStakingRewards which doesn’t exist in StakingRewards is `setRewardRate` which updates the reward rate of the contract and is modified with `onlyOwner`, and as such isn’t considered a security concern.

UNISXStakingRewards is identical to LPStakingRewards excluding two important differences: `stakingToken` and `rewardsToken` are replaced with a single `UNISXToken` – as the UNISX token is used for both staking and rewards – and there is no `periodFinish` parameter – as the contract is intended to remain live indefinitely. In the case of UNISXStakingRewards, the check in `getReward` is useful for ensuring stakers cannot claim other users’ UNISX in the event that the contract runs out of reward UNISX. As with Synthetix, the onus is on the DAO to make sure the contract is supplied with sufficient amounts of reward UNISX during its operation or that the reward rate is reduced to 0 when no incentives are planned.

In terms of tokenomics and user incentives, the addition of the ability to change the reward rate in a staking contract may be seen as dubious, as a user’s stake can be rendered null in the event that the reward rate is set to zero between the moment of staking and claiming rewards. However, as such an operation can be carried out by the DAO alone, and a smooth and fair operation of rewards is in its own interest, this event is impossible during the early, more centralised stages of the DAO's existance and improbable during the later, more decentralised stages of its existence. While this does raise the level of trust any prospective participant must place in the DAO before staking, this is not viewed as a security concern.

Any fault in the reward mathematics or basic methods of the staking rewards contracts – outside of the issues outlined above – would have to be an issue with the source material, which is highly unlikely. In the event that you believe this to be the case, there is a [$100,000 bounty](https://immunefi.com/bounty/synthetix/) you might be entitled to.

## Classic Smart Contract Vulnerabilities

Here is a comprehensive list of classic smart contract attacks that are either irrelevant to these contracts or have been explored and found to present no security risk: 

* Reentrancy
* Timestamp manipulation
* Gas limit and loops
* DoS with block gas limit
* Transaction-ordering dependence
* Use of tx.origin
* Exception disorder/gasless send
* Balance equality
* Unexpected ether
* Default visibilities
* OP-code gas cost dependence
* Malicious libraries
* Redundant fallback function
* Uninitialised storage pointers

## Place in the UNISX Ecosystem

These three contracts are all owned by the DAO and will interact with the UNISX utility token and xUNISX governance token. UNISXStakingRewards has unique privileges to mint and burn xUNISX, which, however, can be withdrawn at any time by the DAO. 

These three contracts are dependent on the DAO for smooth operation, but the reverse is not true, and the staking contracts can always be theoretically replaced with an updated system. The purpose of the contracts is to incentivise engagement and long-term holding of LP tokens in AMM pools to make swapping into UNISX synthetic tokens easier for new users, as well as to reward long-term holders of the UNISX utility token with more of it and access to DAO governance.
