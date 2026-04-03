// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @dev Stand-in for World ID `verifyProof`; tests can toggle reverts.
contract WorldIdRouterMock {
    bool public shouldRevert;
    string public revertMessage = "WorldIdRouterMock: verify failed";

    function setShouldRevert(bool value) external {
        shouldRevert = value;
    }

    function setRevertMessage(string calldata message) external {
        revertMessage = message;
    }

    // solhint-disable-next-line no-empty-blocks
    function verifyProof(
        uint256,
        uint256,
        uint256,
        uint256,
        uint256,
        uint256[8] calldata
    ) external view {
        if (shouldRevert) {
            revert(revertMessage);
        }
    }
}
