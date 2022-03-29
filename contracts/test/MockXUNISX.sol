// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/ITokenManagerMin.sol";

contract MockXUNISX is ITokenManagerMin, ERC20 {
  address public tokenManager;

  constructor(address _tokenManager) ERC20("xUNISX", "xUNISX") {
    tokenManager = _tokenManager;
  }

  function mint(address _receiver, uint256 _amount) external override {
    require(msg.sender == tokenManager);
    _mint(_receiver, _amount);
  }

  function burn(address _holder, uint256 _amount) external override {
    require(msg.sender == tokenManager);
    _burn(_holder, _amount);
  }
}