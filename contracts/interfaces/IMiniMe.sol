// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IMiniMe {
    struct  Checkpoint {
        uint128 fromBlock;
        uint128 value;
    }

    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function changeController(address _newController) external;
    function name() external returns (string memory);
    function decimals() external returns (uint8);
    function controller() external returns (address);
    function balances(address) external returns (Checkpoint[] memory);
    function transfersEnabled() external returns (bool);
    function generateTokens(address, uint) external returns (bool);
    function destroyTokens(address, uint) external returns (bool);
    function enableTransfers(bool) external;
}