// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUNISX is ERC20 {
  constructor() ERC20("TestUNISX", "UNISX") {
  }

  function mint(uint256 amount) external {
    _mint(msg.sender, amount);
  }
}
