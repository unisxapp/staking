// SPDX-License-Identifier: MIT

// Based on https://github.com/Synthetixio/synthetix/blob/master/contracts/StakingRewards.sol

pragma solidity ^0.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMiniMeMin.sol";
import "./interfaces/ITokenManagerMin.sol";

contract UNISXStakingRewards is Ownable {
    IMiniMeMin public immutable UNISXToken;
    ITokenManagerMin public immutable xUNISXTokenManager;

    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    uint256 private _totalSupply;
    mapping(address => uint256) public balanceOf;

    constructor(
        address _UNISXToken,
        address _tokenManager,
        uint256 _rewardRate
    ) {
        UNISXToken = IMiniMeMin(_UNISXToken);
        xUNISXTokenManager = ITokenManagerMin(_tokenManager);
        rewardRate = _rewardRate;
    }

    function rewardPerToken() public view returns (uint256) {
        if (_totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
    }

    function earned(address account) public view returns (uint256) {
        return
            ((balanceOf[account] *
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

    function stake(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, 'cannot stake 0');
        _totalSupply += _amount;
        balanceOf[msg.sender] += _amount;
        UNISXToken.transferFrom(msg.sender, address(this), _amount);
        xUNISXTokenManager.mint(msg.sender, _amount);
        emit Staked(msg.sender, _amount);
    }

    function withdraw(uint256 _amount) external updateReward(msg.sender) {
        require(_amount > 0, 'cannot withdraw 0');
        _totalSupply -= _amount;
        balanceOf[msg.sender] -= _amount;
        xUNISXTokenManager.burn(msg.sender, _amount);
        UNISXToken.transfer(msg.sender, _amount);
        emit Withdrawn(msg.sender, _amount);
    }

    function getReward() external updateReward(msg.sender) returns (uint256) {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        UNISXToken.transfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
        return reward;
    }

    function setRewardRate(uint256 _rewardRate) external updateReward(address(0)) onlyOwner() {
        rewardRate = _rewardRate;
        emit RewardRateSet(rewardRate);
    }

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateSet(uint256 rewardRate);
}
