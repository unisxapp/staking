// SPDX-License-Identifier: MIT

pragma solidity ^0.8;

import "../interfaces/IVaultMin.sol";
import "../interfaces/IERC20Min.sol";

contract TestTreasury is IVaultMin {
    function transfer(address _token, address _to, uint256 _value) external {
        IERC20Min(_token).transfer(_to, _value);
    }
}