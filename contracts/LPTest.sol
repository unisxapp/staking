// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LPTest is ERC20 {

  constructor(uint256 _initialSupply) ERC20("UNISX", "UNISX") {
    _mint(msg.sender, _initialSupply);
  }

}
