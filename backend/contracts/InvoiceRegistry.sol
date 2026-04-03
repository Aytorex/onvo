// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev World ID router / group manager entrypoint (IDKit must use the same signal hash rule).
interface IWorldIdRouter {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external;
}

/// @title InvoiceRegistry
/// @notice On-chain invoice hash registry with World ID–gated emitters and ERC-20 settlement.
contract InvoiceRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        Pending,
        Paid,
        Cancelled
    }

    struct Invoice {
        bytes32 invoiceHash;
        address emitter;
        address recipient;
        uint256 amount;
        address token;
        Status status;
    }

    uint256 private _nextInvoiceId;
    mapping(uint256 => Invoice) private _invoices;
    mapping(bytes32 => bool) private _hashUsed;
    mapping(address => bool) public isEmitterVerified;
    mapping(uint256 => bool) private _nullifierUsed;
    mapping(address => bool) public allowedToken;

    address public immutable worldIdRouter;
    uint256 public immutable externalNullifierHash;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        bytes32 indexed invoiceHash,
        address indexed emitter,
        address recipient,
        uint256 amount,
        address token
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        address token
    );
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed emitter);

    constructor(
        address initialOwner,
        address worldIdRouter_,
        uint256 externalNullifierHash_,
        address[] memory tokens
    ) Ownable(initialOwner) {
        require(worldIdRouter_ != address(0), "InvoiceRegistry: zero worldId");
        worldIdRouter = worldIdRouter_;
        externalNullifierHash = externalNullifierHash_;
        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; ) {
            _addAllowedToken(tokens[i]);
            unchecked {
                ++i;
            }
        }
    }

    function addAllowedToken(address token) external onlyOwner {
        _addAllowedToken(token);
    }

    function _addAllowedToken(address token) internal {
        require(token != address(0), "InvoiceRegistry: zero token");
        allowedToken[token] = true;
    }

    /// @notice Binds `msg.sender` as a verified emitter via World ID proof.
    /// @dev `signalHash` is `uint256(keccak256(abi.encodePacked(msg.sender))) / 256` (same as `>> 8`); IDKit / backend must match.
    /// @dev CEI: storage is updated before `verifyProof`. If the call reverts, the whole tx rolls back (nullifier not persisted).
    function registerWithWorldId(
        uint256 root,
        uint256 groupId,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external nonReentrant {
        require(
            !_nullifierUsed[nullifierHash],
            "InvoiceRegistry: nullifier used"
        );
        _nullifierUsed[nullifierHash] = true;
        isEmitterVerified[msg.sender] = true;
        uint256 signalHash =
            uint256(keccak256(abi.encodePacked(msg.sender))) / 256;
        IWorldIdRouter(worldIdRouter).verifyProof(
            root,
            groupId,
            signalHash,
            nullifierHash,
            externalNullifierHash,
            proof
        );
    }

    function createInvoice(
        bytes32 invoiceHash_,
        address emitter,
        address recipient,
        uint256 amount,
        address token
    ) external {
        require(msg.sender == emitter, "InvoiceRegistry: not emitter");
        require(
            isEmitterVerified[emitter],
            "InvoiceRegistry: emitter not verified"
        );
        require(recipient != address(0), "InvoiceRegistry: zero recipient");
        require(allowedToken[token], "InvoiceRegistry: token not allowed");
        require(amount > 0, "InvoiceRegistry: zero amount");
        require(!_hashUsed[invoiceHash_], "InvoiceRegistry: hash used");

        _hashUsed[invoiceHash_] = true;
        uint256 invoiceId = ++_nextInvoiceId;
        _invoices[invoiceId] = Invoice({
            invoiceHash: invoiceHash_,
            emitter: emitter,
            recipient: recipient,
            amount: amount,
            token: token,
            status: Status.Pending
        });

        emit InvoiceCreated(
            invoiceId,
            invoiceHash_,
            emitter,
            recipient,
            amount,
            token
        );
    }

    function payInvoice(uint256 invoiceId) external nonReentrant {
        Invoice storage inv = _requireInvoice(invoiceId);
        require(inv.status == Status.Pending, "InvoiceRegistry: not pending");
        require(
            isEmitterVerified[inv.emitter],
            "InvoiceRegistry: emitter not verified"
        );
        require(allowedToken[inv.token], "InvoiceRegistry: token not allowed");

        inv.status = Status.Paid;
        emit InvoicePaid(invoiceId, msg.sender, inv.amount, inv.token);
        IERC20(inv.token).safeTransferFrom(msg.sender, inv.emitter, inv.amount);
    }

    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = _requireInvoice(invoiceId);
        require(msg.sender == inv.emitter, "InvoiceRegistry: not emitter");
        require(inv.status == Status.Pending, "InvoiceRegistry: not pending");
        inv.status = Status.Cancelled;
        emit InvoiceCancelled(invoiceId, inv.emitter);
    }

    function getInvoice(
        uint256 invoiceId
    )
        external
        view
        returns (
            bytes32 invoiceHash_,
            address emitter,
            address recipient,
            uint256 amount,
            address token,
            Status status
        )
    {
        Invoice storage inv = _requireInvoice(invoiceId);
        return (
            inv.invoiceHash,
            inv.emitter,
            inv.recipient,
            inv.amount,
            inv.token,
            inv.status
        );
    }

    function _requireInvoice(
        uint256 invoiceId
    ) internal view returns (Invoice storage) {
        require(
            invoiceId > 0 && invoiceId <= _nextInvoiceId,
            "InvoiceRegistry: invalid id"
        );
        return _invoices[invoiceId];
    }
}
