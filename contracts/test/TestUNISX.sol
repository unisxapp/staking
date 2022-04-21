// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestUNISX is ERC20 {
  constructor(uint256 _initialSupply) ERC20("Universal Synthetic Token", "UNISX") {
    _mint(msg.sender, _initialSupply);
  }
}