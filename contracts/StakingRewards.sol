// SPDX-License-Identifier: MIT

// Based on https://solidity-by-example.org/defi/staking-rewards/

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./xUNISX.sol";

contract StakingRewards is Ownable {
    IERC20 public rewardsToken;
    IERC20 public stakingToken;
    xUNISX public xUNISXToken;

    uint public rewardRate;
    uint public lastUpdateTime;
    uint public rewardPerTokenStored;

    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    uint private _totalSupply;
    mapping(address => uint) private _balances;

    constructor(
        address _stakingToken,
        address _rewardsToken,
        address _xUNISXToken,
        uint _rewardRate
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        xUNISXToken = xUNISX(_xUNISXToken);
        rewardRate = _rewardRate;
    }

    function rewardPerToken() public view returns (uint) {
        if (_totalSupply == 0) {
            return 0;
        }
        return
            rewardPerTokenStored +
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / _totalSupply);
    }

    function earned(address account) public view returns (uint) {
        return
            ((_balances[account] *
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
        _totalSupply += _amount;
        _balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        xUNISXToken.mint(msg.sender, _amount);
    }

    function withdraw(uint _amount) external updateReward(msg.sender) {
        _totalSupply -= _amount;
        _balances[msg.sender] -= _amount;
        xUNISXToken.transferFrom(msg.sender, address(this), _amount);
        xUNISXToken.burn(_amount);
        stakingToken.transfer(msg.sender, _amount);
    }

    function getReward() external updateReward(msg.sender) returns (uint) {
        uint reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rewardsToken.transfer(msg.sender, reward);
        return reward;
    }

    function setRewardRate(uint _rewardRate) external updateReward(address(0)) onlyOwner() {
        rewardRate = _rewardRate;
    }
}
