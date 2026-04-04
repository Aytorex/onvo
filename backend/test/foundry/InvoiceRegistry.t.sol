// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {InvoiceRegistry} from "@/contracts/InvoiceRegistry.sol";
import {MockERC20} from "@/contracts/mocks/MockERC20.sol";

contract InvoiceRegistryTest is Test {
    address internal constant ZERO = address(0);

    uint256 internal constant INV_YEAR = 2026;
    uint256 internal constant INV_MONTH = 4;
    string internal constant SAMPLE_VAT_NUMBER = "FR85939527636";

    InvoiceRegistry internal registry;
    MockERC20 internal token;
    address internal owner;
    address internal emitter;
    address internal payer;
    address internal stranger;
    address internal treasury;

    event EmitterRegistered(address indexed emitter_, uint256 nullifierHash);
    event TrustedVerifierUpdated(address indexed newVerifier);
    event InvoiceCreated(
        uint256 indexed invoiceId,
        bytes32 indexed invoiceHash,
        address indexed emitter_,
        address recipient,
        uint256 amount,
        address token_,
        string vatNumber,
        uint256 worldIdNullifierHash
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer_,
        uint256 amount,
        address token_,
        uint256 commissionAmount
    );
    event CommissionBpsUpdated(uint256 newCommissionBps);
    event CommissionRecipientUpdated(address indexed newRecipient);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed emitter_);

    function setUp() public {
        owner = makeAddr("owner");
        emitter = makeAddr("emitter");
        payer = makeAddr("payer");
        stranger = makeAddr("stranger");
        treasury = makeAddr("treasury");

        token = new MockERC20("Mock USDC", "mUSDC", 6);
        assertEq(token.decimals(), 6);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        registry = new InvoiceRegistry(owner, owner, tokens, treasury);

        token.mint(payer, 1_000_000);
        token.mint(emitter, 1_000_000);
    }

    function _registerEmitter() internal {
        vm.prank(owner);
        registry.registerEmitter(emitter, 777);
    }

    function _nextInvoiceId(
        uint256 worldIdNullifier
    ) internal view returns (uint256) {
        return registry.getNextInvoiceId(worldIdNullifier, INV_YEAR, INV_MONTH);
    }

    /* registerEmitter */

    function testRegisterEmitterMarksVerified() public {
        vm.prank(owner);
        registry.registerEmitter(emitter, 777);
        assertTrue(registry.isEmitterVerified(emitter));
        assertEq(registry.emitterWorldIdNullifier(emitter), 777);
    }

    function testRegisterEmitterEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit EmitterRegistered(emitter, 42);
        registry.registerEmitter(emitter, 42);
    }

    function testRevertWhenRegisterEmitterNotTrustedVerifier() public {
        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not trusted verifier");
        registry.registerEmitter(emitter, 1);
    }

    function testRevertWhenRegisterEmitterNullifierReuse() public {
        vm.startPrank(owner);
        registry.registerEmitter(emitter, 999);
        vm.expectRevert("InvoiceRegistry: nullifier used");
        registry.registerEmitter(payer, 999);
        vm.stopPrank();
    }

    function testRevertWhenRegisterEmitterZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("InvoiceRegistry: zero emitter");
        registry.registerEmitter(ZERO, 1);
    }

    function testSecondRegisterEmitterOverwritesNullifier() public {
        vm.startPrank(owner);
        registry.registerEmitter(emitter, 111);
        assertEq(registry.emitterWorldIdNullifier(emitter), 111);
        registry.registerEmitter(emitter, 222);
        assertEq(registry.emitterWorldIdNullifier(emitter), 222);
        vm.stopPrank();

        uint256 id = _nextInvoiceId(222);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("snap"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        (, , , , , , uint256 wid, InvoiceRegistry.Status st) = registry
            .getInvoice(id);
        assertEq(wid, 222);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Pending));
    }

    /* setTrustedVerifier */

    function testSetTrustedVerifierOwner() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TrustedVerifierUpdated(emitter);
        registry.setTrustedVerifier(emitter);
        assertEq(registry.trustedVerifier(), emitter);
    }

    function testRevertWhenSetTrustedVerifierNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        registry.setTrustedVerifier(emitter);
    }

    function testRevertWhenSetTrustedVerifierZero() public {
        vm.prank(owner);
        vm.expectRevert("InvoiceRegistry: zero verifier");
        registry.setTrustedVerifier(ZERO);
    }

    /* createInvoice */

    function testCreateInvoicePendingAndEvent() public {
        _registerEmitter();
        bytes32 hash = keccak256("pdf-hash-1");
        uint256 amount = 1000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCreated(
            id,
            hash,
            emitter,
            payer,
            amount,
            address(token),
            SAMPLE_VAT_NUMBER,
            777
        );
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            amount,
            address(token),
            SAMPLE_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH
        );

        (
            bytes32 invoiceHash_,
            address em,
            address recipient,
            uint256 amt,
            address tok,
            string memory vat_,
            uint256 worldId_,
            InvoiceRegistry.Status status
        ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
        assertEq(em, emitter);
        assertEq(recipient, payer);
        assertEq(amt, amount);
        assertEq(tok, address(token));
        assertEq(vat_, SAMPLE_VAT_NUMBER);
        assertEq(worldId_, 777);
        assertEq(uint256(status), uint256(InvoiceRegistry.Status.Pending));
    }

    function testGetNextInvoiceIdIncrementsPerMonth() public {
        _registerEmitter();
        uint256 id1 = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id1,
            keccak256("a"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        uint256 id2 = _nextInvoiceId(777);
        assertTrue(id2 != id1);
        (, , , uint256 seq1) = registry.parseInvoiceId(id1);
        (, , , uint256 seq2) = registry.parseInvoiceId(id2);
        assertEq(seq1 + 1, seq2);
    }

    function testGetNextInvoiceSequencePublicView() public {
        assertEq(registry.getNextInvoiceSequence(777, INV_YEAR, INV_MONTH), 1);
        _registerEmitter();
        assertEq(registry.getNextInvoiceSequence(777, INV_YEAR, INV_MONTH), 1);
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("seq-view"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        assertEq(registry.getNextInvoiceSequence(777, INV_YEAR, INV_MONTH), 2);
    }

    function testParseInvoiceIdExternalDecodesPackedId() public view {
        uint160 wid = registry.worldIdNullifierToPacked160(777);
        uint256 id = registry.packInvoiceId(wid, INV_YEAR, INV_MONTH, 7);
        (uint160 wp, uint256 y, uint256 m, uint256 s) = registry.parseInvoiceId(
            id
        );
        assertEq(uint256(wp), uint256(wid));
        assertEq(y, INV_YEAR);
        assertEq(m, INV_MONTH);
        assertEq(s, 7);
    }

    function testRevertWhenCreateInvoiceIdWorldIdMismatch() public {
        _registerEmitter();
        uint160 wrong = registry.worldIdNullifierToPacked160(999);
        uint256 badId = registry.packInvoiceId(wrong, INV_YEAR, INV_MONTH, 1);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: id world id mismatch");
        registry.createInvoice(
            badId,
            keccak256("x"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceIdSequenceMismatch() public {
        _registerEmitter();
        uint160 wid = registry.worldIdNullifierToPacked160(777);
        uint256 badId = registry.packInvoiceId(wid, INV_YEAR, INV_MONTH, 99);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: id sequence mismatch");
        registry.createInvoice(
            badId,
            keccak256("x"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceIdPeriodMismatch() public {
        _registerEmitter();
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: id period mismatch");
        registry.createInvoice(
            id,
            keccak256("x"),
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH + 1
        );
    }

    function testRevertWhenCreateInvoiceNotEmitter() public {
        _registerEmitter();
        bytes32 hash = keccak256("h");
        uint256 id = _nextInvoiceId(777);
        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not emitter");
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceEmitterNotVerified() public {
        bytes32 hash = keccak256("h2");
        uint256 id = registry.getNextInvoiceId(1, INV_YEAR, INV_MONTH);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: emitter not verified");
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceTokenNotAllowed() public {
        MockERC20 other = new MockERC20("Other", "O", 6);
        _registerEmitter();
        bytes32 hash = keccak256("h3");
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: token not allowed");
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(other),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceZeroAmount() public {
        _registerEmitter();
        bytes32 hash = keccak256("h4");
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: zero amount");
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            0,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceVatNumberTooLong() public {
        _registerEmitter();
        bytes32 hash = keccak256("h-vat");
        uint256 id = _nextInvoiceId(777);
        string memory tooLong =
            "012345678901234567890123456789012345678901234567890123456789012345";
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: vat number too long");
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(token),
            tooLong,
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceHashUsed() public {
        _registerEmitter();
        bytes32 hash = keccak256("dup");
        vm.startPrank(emitter);
        uint256 id1 = _nextInvoiceId(777);
        registry.createInvoice(
            id1,
            hash,
            emitter,
            payer,
            10,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        uint256 id2 = _nextInvoiceId(777);
        vm.expectRevert("InvoiceRegistry: hash used");
        registry.createInvoice(
            id2,
            hash,
            emitter,
            payer,
            20,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.stopPrank();
    }

    function testRevertWhenCreateInvoiceZeroRecipient() public {
        _registerEmitter();
        bytes32 hash = keccak256("zero-recipient");
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: zero recipient");
        registry.createInvoice(
            id,
            hash,
            emitter,
            ZERO,
            1,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
    }

    /* payInvoice */

    function testPayInvoiceTransfersAndPaid() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            amount,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );

        uint256 fee =
            (amount * registry.commissionBps()) /
                registry.COMMISSION_BPS_DENOMINATOR();
        uint256 net = amount - fee;
        uint256 emitterBefore = token.balanceOf(emitter);
        uint256 treasuryBefore = token.balanceOf(treasury);
        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectEmit(true, true, true, true);
        emit InvoicePaid(id, payer, amount, address(token), fee);
        registry.payInvoice(id);

        (, , , , , , , InvoiceRegistry.Status st) = registry.getInvoice(id);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Paid));
        assertEq(token.balanceOf(emitter), emitterBefore + net);
        assertEq(token.balanceOf(treasury), treasuryBefore + fee);
    }

    function testRevertWhenPayInvoiceInvalidId() public {
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: invalid id");
        registry.payInvoice(0);
    }

    function testRevertWhenPayInvoiceAlreadyPaid() public {
        _registerEmitter();
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.startPrank(payer);
        token.approve(address(registry), amount);
        registry.payInvoice(id);
        token.approve(address(registry), amount);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.payInvoice(id);
        vm.stopPrank();
    }

    function testPayInvoiceZeroCommissionBpsFullToEmitter() public {
        vm.prank(owner);
        registry.setCommissionBps(0);
        _registerEmitter();
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay-zero-fee"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        uint256 emitterBefore = token.balanceOf(emitter);
        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectEmit(true, true, true, true);
        emit InvoicePaid(id, payer, amount, address(token), 0);
        registry.payInvoice(id);
        assertEq(token.balanceOf(emitter), emitterBefore + amount);
        assertEq(token.balanceOf(treasury), 0);
    }

    function testRevertWhenPayInvoiceCancelled() public {
        _registerEmitter();
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.prank(emitter);
        registry.cancelInvoice(id);
        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.payInvoice(id);
    }

    function testRevertWhenPayInvoiceInsufficientAllowance() public {
        vm.prank(owner);
        registry.setCommissionBps(0);
        _registerEmitter();
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                address(registry),
                uint256(0),
                amount
            )
        );
        registry.payInvoice(id);
    }

    /* cancelInvoice */

    function testCancelInvoicePending() public {
        _registerEmitter();
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCancelled(id, emitter);
        registry.cancelInvoice(id);
        (, , , , , , , InvoiceRegistry.Status st) = registry.getInvoice(id);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Cancelled));
    }

    function testRevertWhenCancelInvoiceNotEmitter() public {
        _registerEmitter();
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not emitter");
        registry.cancelInvoice(id);
    }

    function testRevertWhenCancelInvoiceAlreadyPaid() public {
        _registerEmitter();
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.prank(payer);
        token.approve(address(registry), 100);
        vm.prank(payer);
        registry.payInvoice(id);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.cancelInvoice(id);
    }

    function testRevertWhenCancelInvoiceDoubleCancel() public {
        _registerEmitter();
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );
        vm.startPrank(emitter);
        registry.cancelInvoice(id);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.cancelInvoice(id);
        vm.stopPrank();
    }

    /* getInvoice */

    function testRevertWhenGetInvoiceInvalidId() public {
        vm.expectRevert("InvoiceRegistry: invalid id");
        registry.getInvoice(1);
    }

    /* commission config */

    function testDefaultCommissionBpsAndRecipient() public view {
        assertEq(registry.commissionBps(), 10);
        assertEq(registry.commissionRecipient(), treasury);
        assertEq(registry.COMMISSION_BPS_DENOMINATOR(), 10_000);
    }

    function testSetCommissionBpsAndRecipientOwner() public {
        vm.startPrank(owner);
        vm.expectEmit(false, false, false, true);
        emit CommissionBpsUpdated(100);
        registry.setCommissionBps(100);
        assertEq(registry.commissionBps(), 100);
        vm.expectEmit(true, false, false, false);
        emit CommissionRecipientUpdated(emitter);
        registry.setCommissionRecipient(emitter);
        vm.stopPrank();
        assertEq(registry.commissionRecipient(), emitter);
    }

    function testRevertWhenSetCommissionBpsTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("InvoiceRegistry: commission bps too high");
        registry.setCommissionBps(10_001);
    }

    function testRevertWhenSetCommissionBpsNotOwner() public {
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        registry.setCommissionBps(1);
    }

    function testRevertWhenSetCommissionRecipientZero() public {
        vm.prank(owner);
        vm.expectRevert("InvoiceRegistry: zero commission recipient");
        registry.setCommissionRecipient(ZERO);
    }

    /* addAllowedToken */

    function testAddAllowedTokenOnlyOwner() public {
        MockERC20 newToken = new MockERC20("N", "N", 6);
        address addr = address(newToken);
        vm.prank(owner);
        registry.addAllowedToken(addr);
        assertTrue(registry.allowedToken(addr));
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                Ownable.OwnableUnauthorizedAccount.selector,
                stranger
            )
        );
        registry.addAllowedToken(addr);
    }

    function testCreateInvoiceWithNewlyAddedToken() public {
        MockERC20 newToken = new MockERC20("N2", "N2", 6);
        vm.prank(owner);
        registry.addAllowedToken(address(newToken));
        _registerEmitter();
        bytes32 hash = keccak256("newInvoice");
        uint256 id = _nextInvoiceId(777);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(newToken),
            "",
            INV_YEAR,
            INV_MONTH
        );
        (bytes32 invoiceHash_, , , , , , , ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
    }

    /* constructor */

    function testRevertWhenConstructorZeroVerifier() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.expectRevert("InvoiceRegistry: zero verifier");
        new InvoiceRegistry(owner, ZERO, tokens, treasury);
    }

    function testRevertWhenConstructorZeroToken() public {
        address[] memory tokens = new address[](1);
        tokens[0] = ZERO;
        vm.expectRevert("InvoiceRegistry: zero token");
        new InvoiceRegistry(owner, owner, tokens, treasury);
    }

    function testRevertWhenConstructorZeroCommissionRecipient() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.expectRevert("InvoiceRegistry: zero commission recipient");
        new InvoiceRegistry(owner, owner, tokens, ZERO);
    }

    function testConstructorAllowsMultipleInitialTokens() public {
        MockERC20 tA = new MockERC20("A", "A", 6);
        MockERC20 tB = new MockERC20("B", "B", 6);
        address[] memory tokens = new address[](2);
        tokens[0] = address(tA);
        tokens[1] = address(tB);
        InvoiceRegistry r = new InvoiceRegistry(owner, owner, tokens, treasury);
        assertTrue(r.allowedToken(address(tA)));
        assertTrue(r.allowedToken(address(tB)));
    }
}
