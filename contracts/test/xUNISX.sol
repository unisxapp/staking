// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract xUNISX is ERC20 {
  constructor() ERC20("xUNISX", "xUNISX") {}

  function mint(address account, uint256 amount) external {
    _mint(account, amount);
  }

  function burn(address owner, uint256 amount) external {
    _burn(owner, amount);
  }
}