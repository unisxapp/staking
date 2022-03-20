// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMiniMeMin {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address to, uint256 amount) external returns (bool);

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function generateTokens(address, uint256) external returns (bool);

    function destroyTokens(address, uint256) external returns (bool);
}
