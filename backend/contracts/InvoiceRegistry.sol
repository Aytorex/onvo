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
/// @dev Invoice IDs are packed `uint256` values encoding `F-<emitter>-<year>-<month>-<seq>` (human form off-chain).
///      Layout: address (160 bits) << 96 | year (16) << 80 | month (8) << 72 | sequence (40 low bits).
/// @custom:clear-signing ERC-7730 v2 descriptor: `contracts/erc7730/invoice-registry.erc7730.json` (see https://eips.ethereum.org/EIPS/eip-7730).
/// After deployment, run `bun run erc7730:bindings` with `INVOICE_REGISTRY_ADDRESS` (and optional `CHAIN_ID`) so wallets can bind `context.contract.deployments`.
/// After ABI changes, run `bun run erc7730:sync` to verify `display.formats` selectors still match the contract.
contract InvoiceRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 private constant _SEQ_MASK = (1 << 40) - 1;

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

    mapping(uint256 => Invoice) private _invoices;
    mapping(bytes32 => bool) private _hashUsed;
    mapping(address => bool) public isEmitterVerified;
    mapping(uint256 => bool) private _nullifierUsed;
    mapping(address => bool) public allowedToken;
    /// @dev Count of invoices already minted for `emitter` in calendar month `year * 100 + month`.
    mapping(address => mapping(uint256 => uint256))
        private _invoiceCountByEmitterMonth;

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

    /// @notice Decodes a packed invoice id (same packing as {packInvoiceId}).
    function parseInvoiceId(
        uint256 invoiceId
    )
        external
        pure
        returns (
            address emitter_,
            uint256 year,
            uint256 month,
            uint256 sequence
        )
    {
        return _parseInvoiceId(invoiceId);
    }

    function _parseInvoiceId(
        uint256 invoiceId
    )
        internal
        pure
        returns (
            address emitter_,
            uint256 year,
            uint256 month,
            uint256 sequence
        )
    {
        emitter_ = address(uint160(invoiceId >> 96));
        year = (invoiceId >> 80) & 0xffff;
        month = (invoiceId >> 72) & 0xff;
        sequence = invoiceId & _SEQ_MASK;
    }

    /// @notice Packs emitter, calendar year/month, and per-month sequence into the on-chain invoice id.
    function packInvoiceId(
        address emitter_,
        uint256 year,
        uint256 month,
        uint256 sequence
    ) public pure returns (uint256 invoiceId) {
        require(year <= type(uint16).max, "InvoiceRegistry: year overflow");
        require(month >= 1 && month <= 12, "InvoiceRegistry: invalid month");
        require(
            sequence > 0 && sequence <= _SEQ_MASK,
            "InvoiceRegistry: invalid sequence"
        );
        invoiceId =
            (uint256(uint160(emitter_)) << 96) |
            ((year & 0xffff) << 80) |
            ((month & 0xff) << 72) |
            (sequence & _SEQ_MASK);
    }

    function _yearMonthKey(
        uint256 year,
        uint256 month
    ) internal pure returns (uint256) {
        return year * 100 + month;
    }

    /// @notice Next 1-based sequence number for `emitter` in the given calendar month (what the next invoice will use).
    function getNextInvoiceSequence(
        address emitter_,
        uint256 year,
        uint256 month
    ) public view returns (uint256) {
        require(year >= 2000 && year <= 9999, "InvoiceRegistry: invalid year");
        require(month >= 1 && month <= 12, "InvoiceRegistry: invalid month");
        uint256 ym = _yearMonthKey(year, month);
        return _invoiceCountByEmitterMonth[emitter_][ym] + 1;
    }

    /// @notice Packed id the next `createInvoice` must pass for this emitter and month (human label: `F-<emitter>-<y>-<mm>-<seq>` off-chain).
    function getNextInvoiceId(
        address emitter_,
        uint256 year,
        uint256 month
    ) external view returns (uint256) {
        uint256 seq = getNextInvoiceSequence(emitter_, year, month);
        return packInvoiceId(emitter_, year, month, seq);
    }

    function _validateNewInvoiceId(
        uint256 invoiceId,
        address emitter,
        uint256 year,
        uint256 month
    ) internal view {
        (
            address idEmitter,
            uint256 yId,
            uint256 mId,
            uint256 seq
        ) = _parseInvoiceId(invoiceId);
        require(idEmitter == emitter, "InvoiceRegistry: id emitter mismatch");
        require(
            yId == year && mId == month,
            "InvoiceRegistry: id period mismatch"
        );
        uint256 ym = _yearMonthKey(year, month);
        require(
            seq == _invoiceCountByEmitterMonth[emitter][ym] + 1,
            "InvoiceRegistry: id sequence mismatch"
        );
        require(
            _invoices[invoiceId].emitter == address(0),
            "InvoiceRegistry: id already used"
        );
    }

    /// @param invoiceId Packed id; must equal {getNextInvoiceId}(`emitter`, `year`, `month`) and encode `emitter` as the issuer wallet.
    function createInvoice(
        uint256 invoiceId,
        bytes32 invoiceHash_,
        address emitter,
        address recipient,
        uint256 amount,
        address token,
        uint256 year,
        uint256 month
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
        require(year >= 2000 && year <= 9999, "InvoiceRegistry: invalid year");
        require(month >= 1 && month <= 12, "InvoiceRegistry: invalid month");

        _validateNewInvoiceId(invoiceId, emitter, year, month);

        _hashUsed[invoiceHash_] = true;
        uint256 ym = _yearMonthKey(year, month);
        _invoiceCountByEmitterMonth[emitter][ym] =
            _invoiceCountByEmitterMonth[emitter][ym] + 1;
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
        Invoice storage inv = _invoices[invoiceId];
        require(inv.emitter != address(0), "InvoiceRegistry: invalid id");
        return inv;
    }
}
