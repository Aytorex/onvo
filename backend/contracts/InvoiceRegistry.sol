// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title InvoiceRegistry
/// @notice On-chain invoice registry with ERC-20 settlement and optional World ID nullifier metadata (off-chain verified on Arc).
/// @dev Invoice ID layout: `uint160(emitter) << 96 | seq` with `seq` in 96 low bits, unique and incremental per emitter wallet.
contract InvoiceRegistry is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev Low 96 bits encode per-emitter sequence (1-based after first invoice).
    uint256 private constant _SEQ_MASK = (1 << 96) - 1;

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
        /// @dev Emitter VAT identification number (e.g. EU VAT ID), max 64 bytes.
        string vatNumber;
        /// @dev World ID nullifier hash (metadata; verified off-chain / API on Arc — no on-chain proof in MVP).
        uint256 worldIdNullifierHash;
        Status status;
    }

    mapping(uint256 => Invoice) private _invoices;
    mapping(bytes32 => bool) private _hashUsed;
    mapping(address => bool) public allowedToken;
    /// @dev Number of invoices already created by this emitter (used for next sequence).
    mapping(address => uint256) private _invoiceCountByEmitter;

    /// @dev Emitter → nullifier hash → registered via `bindWorldId` (off-chain verified). Same nullifier may appear on several emitters; no global exclusivity.
    mapping(address => mapping(uint256 => bool)) private _worldIdRegistered;

    /// @dev Basis points denominator (100% = 10_000). Default commission is 10 bps = 0.1%.
    uint256 public constant COMMISSION_BPS_DENOMINATOR = 10_000;

    /// @dev Commission on payment, in basis points of the invoice `amount` (gross debited from payer).
    uint256 public commissionBps;

    /// @dev Onvo treasury wallet receiving commission transfers.
    address public commissionRecipient;

    event CommissionBpsUpdated(uint256 newCommissionBps);
    event CommissionRecipientUpdated(address indexed newRecipient);

    event InvoiceCreated(
        uint256 indexed invoiceId,
        bytes32 indexed invoiceHash,
        address indexed emitter,
        address recipient,
        uint256 amount,
        address token,
        string vatNumber,
        uint256 worldIdNullifierHash
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        uint256 amount,
        address token,
        uint256 commissionAmount
    );
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed emitter);
    event WorldIdBound(address indexed emitter, uint256 indexed nullifierHash);

    constructor(
        address initialOwner,
        address[] memory tokens,
        address commissionRecipient_
    ) Ownable(initialOwner) {
        require(
            commissionRecipient_ != address(0),
            "InvoiceRegistry: zero commission recipient"
        );
        commissionRecipient = commissionRecipient_;
        commissionBps = 10;
        uint256 len = tokens.length;
        for (uint256 i = 0; i < len; ) {
            _addAllowedToken(tokens[i]);
            unchecked {
                ++i;
            }
        }
    }

    /// @notice Updates commission rate (basis points of gross invoice amount). Max 100%.
    function setCommissionBps(uint256 newBps) external onlyOwner {
        require(
            newBps <= COMMISSION_BPS_DENOMINATOR,
            "InvoiceRegistry: commission bps too high"
        );
        commissionBps = newBps;
        emit CommissionBpsUpdated(newBps);
    }

    /// @notice Updates the wallet that receives commission on each payment.
    function setCommissionRecipient(address newRecipient) external onlyOwner {
        require(
            newRecipient != address(0),
            "InvoiceRegistry: zero commission recipient"
        );
        commissionRecipient = newRecipient;
        emit CommissionRecipientUpdated(newRecipient);
    }

    function addAllowedToken(address token) external onlyOwner {
        _addAllowedToken(token);
    }

    function _addAllowedToken(address token) internal {
        require(token != address(0), "InvoiceRegistry: zero token");
        allowedToken[token] = true;
    }

    /// @notice Registers a World ID nullifier hash for `msg.sender` as emitter (signal off-chain; Arc has no World ID router).
    /// @dev Several nullifiers per emitter; the same nullifier can also be registered by other emitters. No on-chain proof — product trust + API verification.
    function bindWorldId(uint256 nullifierHash) external {
        require(nullifierHash != 0, "InvoiceRegistry: zero nullifier");
        if (!_worldIdRegistered[msg.sender][nullifierHash]) {
            _worldIdRegistered[msg.sender][nullifierHash] = true;
            emit WorldIdBound(msg.sender, nullifierHash);
        }
    }

    /// @notice Returns true if this nullifier was registered for `emitter` via `bindWorldId`.
    function isWorldIdAuthorizedForEmitter(
        address emitter,
        uint256 nullifierHash
    ) external view returns (bool) {
        if (nullifierHash == 0) return false;
        return _worldIdRegistered[emitter][nullifierHash];
    }

    /// @notice Packs emitter address and sequence into the on-chain invoice id (96-bit sequence per emitter).
    function packInvoiceId(address emitter, uint256 seq) public pure returns (uint256 invoiceId) {
        require(emitter != address(0), "InvoiceRegistry: zero emitter");
        require(seq > 0 && seq <= _SEQ_MASK, "InvoiceRegistry: invalid sequence");
        invoiceId = (uint256(uint160(emitter)) << 96) | seq;
    }

    /// @notice Decodes emitter and sequence from a packed invoice id.
    function parseInvoiceId(uint256 invoiceId) public pure returns (address emitter, uint256 seq) {
        emitter = address(uint160(invoiceId >> 96));
        seq = invoiceId & _SEQ_MASK;
    }

    /// @notice Next invoice id for `emitter` (sequential per wallet).
    function getNextInvoiceId(address emitter) external view returns (uint256) {
        return packInvoiceId(emitter, _invoiceCountByEmitter[emitter] + 1);
    }

    /// @notice Number of invoices created by `emitter` (sequences `1` .. count).
    function getInvoiceCountForEmitter(address emitter) external view returns (uint256) {
        return _invoiceCountByEmitter[emitter];
    }

    /// @notice Last created invoice id for `emitter`, or `0` if none. Previous ids: `packInvoiceId(emitter, seq - 1)` down to seq 1 (or multicall `getInvoice`).
    function getLastInvoiceIdForEmitter(address emitter) external view returns (uint256) {
        if (emitter == address(0)) return 0;
        uint256 count = _invoiceCountByEmitter[emitter];
        if (count == 0) return 0;
        return packInvoiceId(emitter, count);
    }

    /// @notice Creates an invoice; `invoiceId` must equal {getNextInvoiceId}(emitter) (emitter in high 160 bits, seq in low 96).
    /// @dev `worldIdNullifierHash_` is optional metadata (0 if unused); World ID is verified off-chain on Arc for MVP.
    function createInvoice(
        uint256 invoiceId,
        bytes32 invoiceHash_,
        address emitter,
        address recipient,
        uint256 amount,
        address token,
        string calldata vatNumber,
        uint256 worldIdNullifierHash_
    ) external {
        require(msg.sender == emitter, "InvoiceRegistry: not emitter");
        require(recipient != address(0), "InvoiceRegistry: zero recipient");
        require(allowedToken[token], "InvoiceRegistry: token not allowed");
        require(amount > 0, "InvoiceRegistry: zero amount");
        require(
            bytes(vatNumber).length <= 64,
            "InvoiceRegistry: vat number too long"
        );
        require(!_hashUsed[invoiceHash_], "InvoiceRegistry: hash used");

        (address idEmitter, uint256 seq) = parseInvoiceId(invoiceId);
        require(idEmitter == emitter, "InvoiceRegistry: id emitter mismatch");
        require(
            seq == _invoiceCountByEmitter[emitter] + 1,
            "InvoiceRegistry: id sequence mismatch"
        );
        require(
            _invoices[invoiceId].emitter == address(0),
            "InvoiceRegistry: id already used"
        );

        _hashUsed[invoiceHash_] = true;
        unchecked {
            _invoiceCountByEmitter[emitter] += 1;
        }
        _invoices[invoiceId] = Invoice({
            invoiceHash: invoiceHash_,
            emitter: emitter,
            recipient: recipient,
            amount: amount,
            token: token,
            vatNumber: vatNumber,
            worldIdNullifierHash: worldIdNullifierHash_,
            status: Status.Pending
        });

        emit InvoiceCreated(
            invoiceId,
            invoiceHash_,
            emitter,
            recipient,
            amount,
            token,
            vatNumber,
            worldIdNullifierHash_
        );
    }

    function payInvoice(uint256 invoiceId) external nonReentrant {
        Invoice storage inv = _requireInvoice(invoiceId);
        require(inv.status == Status.Pending, "InvoiceRegistry: not pending");
        require(allowedToken[inv.token], "InvoiceRegistry: token not allowed");

        uint256 gross = inv.amount;
        uint256 fee = (gross * commissionBps) / COMMISSION_BPS_DENOMINATOR;
        if (fee > 0) {
            require(
                commissionRecipient != address(0),
                "InvoiceRegistry: zero commission recipient"
            );
        }
        uint256 netToEmitter = gross - fee;

        inv.status = Status.Paid;
        emit InvoicePaid(invoiceId, msg.sender, gross, inv.token, fee);
        IERC20 t = IERC20(inv.token);
        if (fee > 0) {
            t.safeTransferFrom(msg.sender, commissionRecipient, fee);
        }
        t.safeTransferFrom(msg.sender, inv.emitter, netToEmitter);
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
            string memory vatNumber,
            uint256 worldIdNullifierHash_,
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
            inv.vatNumber,
            inv.worldIdNullifierHash,
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
