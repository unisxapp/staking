// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./MockXUNISX.sol";
import "../interfaces/ITokenManagerMin.sol";

contract MockTokenManager is ITokenManagerMin, AccessControl {
  bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
  bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

  MockXUNISX public immutable xUNISX;

  constructor() {
    _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    xUNISX = new MockXUNISX(address(this));
  }
  
  function mint(address _receiver, uint256 _amount) external override onlyRole(MINTER_ROLE) {
    xUNISX.mint(_receiver, _amount);
  }

  function burn(address _holder, uint256 _amount) external override onlyRole(BURNER_ROLE) {
    xUNISX.burn(_holder, _amount);
  }
}