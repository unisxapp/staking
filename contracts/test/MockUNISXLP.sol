// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUNISXLP is ERC20 {
  constructor(uint256 _initialSupply) ERC20("UNISXLP", "UNISXLP") {
    _mint(msg.sender, _initialSupply);
  }

  function decimals() public pure override returns(uint8) {
    return 6;
  }
}