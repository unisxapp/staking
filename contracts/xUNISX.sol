// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract xUNISX is ERC20, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  
  constructor() ERC20("xUNISX", "xUNISX") {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
  }

  function mint(address account, uint256 amount) external onlyRole(MINTER_ROLE) {
    _mint(account, amount);
  }

  function burn(uint256 amount) external {
    _burn(msg.sender, amount);
  }
}
