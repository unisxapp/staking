// SPDX-License-Identifier: MIT

// Based on https://github.com/Synthetixio/synthetix/blob/master/contracts/StakingRewards.sol

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./UNISXERC20.sol";

// staking rewards ERC20-like token (without transfer possibilities)
contract xUNISX is Ownable, UNISXERC20 {
    IERC20 public UNISXToken;

    uint public rewardRate;
    uint public lastUpdateTime;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    constructor(
        address _UNISXToken,
        uint _rewardRate
    ) UNISXERC20("xUNISX", "xUNISX") {
        UNISXToken = IERC20(_UNISXToken);
        rewardRate = _rewardRate;
    }

    function rewardPerToken() public view returns (uint) {
        if (totalSupply() == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalSupply());
    }

    function earned(address account) public view returns (uint) {
        return
            ((balanceOf(account) *
                (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) +
            rewards[account];
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (account != address(0)) {
          rewards[account] = earned(account);
          userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function stake(uint _amount) external updateReward(msg.sender) {
        UNISXToken.transferFrom(msg.sender, address(this), _amount);
        _mint(msg.sender, _amount);
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        _burn(msg.sender, _amount);
        UNISXToken.transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function getReward() external updateReward(msg.sender) returns (uint) {
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        UNISXToken.transfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
        return reward;
    }

    function setRewardRate(uint _rewardRate) external updateReward(address(0)) onlyOwner() {
        rewardRate = _rewardRate;
		emit RewardRateSet(rewardRate);
    }

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateSet(uint rewardRate);
}
