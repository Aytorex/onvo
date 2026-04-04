// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {
    IERC20Errors
} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {InvoiceRegistry} from "@/contracts/InvoiceRegistry.sol";
import {MockERC20} from "@/contracts/mocks/MockERC20.sol";

contract InvoiceRegistryTest is Test {
    address internal constant ZERO = address(0);

    string internal constant SAMPLE_VAT_NUMBER = "FR85939527636";

    InvoiceRegistry internal registry;
    MockERC20 internal token;
    address internal owner;
    address internal emitter;
    address internal payer;
    address internal stranger;
    address internal treasury;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        bytes32 indexed invoiceHash,
        address indexed emitter_,
        address recipient,
        uint256 amount,
        address token_,
        string vatNumber,
        address worldIdAddress
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
    event WorldIdBound(address indexed emitter, address indexed worldIdAddress);

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
        registry = new InvoiceRegistry(owner, tokens, treasury);

        token.mint(payer, 1_000_000);
        token.mint(emitter, 1_000_000);
    }

    function _widAddr(uint256 nullifier) internal pure returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(nullifier)))));
    }

    function _nextInvoiceId(address em) internal view returns (uint256) {
        return registry.getNextInvoiceId(em);
    }

    /* createInvoice */

    function testCreateInvoicePendingAndEvent() public {
        bytes32 hash = keccak256("pdf-hash-1");
        uint256 amount = 1000;
        uint256 nullifier = 777;
        address wid = _widAddr(nullifier);
        uint256 id = _nextInvoiceId(emitter);
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
            wid
        );
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            amount,
            address(token),
            SAMPLE_VAT_NUMBER,
            nullifier
        );

        (
            bytes32 invoiceHash_,
            address em,
            address recipient,
            uint256 amt,
            address tok,
            string memory vat_,
            address worldIdStored,
            InvoiceRegistry.Status status
        ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
        assertEq(em, emitter);
        assertEq(recipient, payer);
        assertEq(amt, amount);
        assertEq(tok, address(token));
        assertEq(vat_, SAMPLE_VAT_NUMBER);
        assertEq(worldIdStored, wid);
        assertEq(uint256(status), uint256(InvoiceRegistry.Status.Pending));
    }

    function testGetNextInvoiceIdIncrementsPerEmitter() public {
        uint256 id1 = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id1,
            keccak256("a"),
            emitter,
            payer,
            1,
            address(token),
            "",
            0
        );
        uint256 id2 = _nextInvoiceId(emitter);
        assertTrue(id2 != id1);
        (, uint256 seq1) = registry.parseInvoiceId(id1);
        (, uint256 seq2) = registry.parseInvoiceId(id2);
        assertEq(seq1 + 1, seq2);
    }

    function testParseInvoiceIdDecodesPackedId() public view {
        uint256 id = registry.packInvoiceId(emitter, 7);
        (address em, uint256 s) = registry.parseInvoiceId(id);
        assertEq(em, emitter);
        assertEq(s, 7);
    }

    function testRevertWhenCreateInvoiceIdEmitterMismatch() public {
        uint256 badId = _nextInvoiceId(stranger);
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: id emitter mismatch");
        registry.createInvoice(
            badId,
            keccak256("x"),
            emitter,
            payer,
            1,
            address(token),
            "",
            0
        );
    }

    function testRevertWhenCreateInvoiceIdSequenceMismatch() public {
        uint256 badId = registry.packInvoiceId(emitter, 99);
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
            0
        );
    }

    function testRevertWhenCreateInvoiceNotEmitter() public {
        bytes32 hash = keccak256("h");
        uint256 id = _nextInvoiceId(emitter);
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
            0
        );
    }

    function testRevertWhenCreateInvoiceTokenNotAllowed() public {
        MockERC20 other = new MockERC20("Other", "O", 6);
        bytes32 hash = keccak256("h3");
        uint256 id = _nextInvoiceId(emitter);
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
            0
        );
    }

    function testRevertWhenCreateInvoiceZeroAmount() public {
        bytes32 hash = keccak256("h4");
        uint256 id = _nextInvoiceId(emitter);
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
            0
        );
    }

    function testRevertWhenCreateInvoiceVatNumberTooLong() public {
        bytes32 hash = keccak256("h-vat");
        uint256 id = _nextInvoiceId(emitter);
        string
            memory tooLong = "012345678901234567890123456789012345678901234567890123456789012345";
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
            0
        );
    }

    function testRevertWhenCreateInvoiceHashUsed() public {
        bytes32 hash = keccak256("dup");
        vm.startPrank(emitter);
        uint256 id1 = _nextInvoiceId(emitter);
        registry.createInvoice(
            id1,
            hash,
            emitter,
            payer,
            10,
            address(token),
            "",
            0
        );
        uint256 id2 = _nextInvoiceId(emitter);
        vm.expectRevert("InvoiceRegistry: hash used");
        registry.createInvoice(
            id2,
            hash,
            emitter,
            payer,
            20,
            address(token),
            "",
            0
        );
        vm.stopPrank();
    }

    function testRevertWhenCreateInvoiceZeroRecipient() public {
        bytes32 hash = keccak256("zero-recipient");
        uint256 id = _nextInvoiceId(emitter);
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
            0
        );
    }

    /* payInvoice */

    function testPayInvoiceTransfersAndPaid() public {
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            amount,
            address(token),
            "",
            0
        );

        uint256 fee = (amount * registry.commissionBps()) /
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
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            0
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
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay-zero-fee"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            0
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
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            0
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
        uint256 amount = 50_000;
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("pay"),
            emitter,
            payer,
            amount,
            address(token),
            "",
            0
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
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            0
        );
        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCancelled(id, emitter);
        registry.cancelInvoice(id);
        (, , , , , , , InvoiceRegistry.Status st) = registry.getInvoice(id);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Cancelled));
    }

    function testRevertWhenCancelInvoiceNotEmitter() public {
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            0
        );
        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not emitter");
        registry.cancelInvoice(id);
    }

    function testRevertWhenCancelInvoiceAlreadyPaid() public {
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            0
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
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            keccak256("cancel"),
            emitter,
            payer,
            100,
            address(token),
            "",
            0
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
        bytes32 hash = keccak256("newInvoice");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            1,
            address(newToken),
            "",
            0
        );
        (bytes32 invoiceHash_, , , , , , , ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
    }

    /* getLastInvoiceIdForEmitter */

    function testGetLastInvoiceIdForEmitterNone() public view {
        assertEq(registry.getInvoiceCountForEmitter(emitter), 0);
        assertEq(registry.getLastInvoiceIdForEmitter(emitter), 0);
    }

    function testGetLastInvoiceIdForEmitterAfterCreates() public {
        vm.startPrank(emitter);
        for (uint256 i = 0; i < 3; i++) {
            uint256 id = _nextInvoiceId(emitter);
            registry.createInvoice(
                id,
                keccak256(abi.encodePacked("h", i)),
                emitter,
                payer,
                10,
                address(token),
                "",
                0
            );
        }
        vm.stopPrank();
        assertEq(registry.getInvoiceCountForEmitter(emitter), 3);
        assertEq(
            registry.getLastInvoiceIdForEmitter(emitter),
            registry.packInvoiceId(emitter, 3)
        );
    }

    function testGetLastInvoiceIdForEmitterZeroAddress() public view {
        assertEq(registry.getLastInvoiceIdForEmitter(address(0)), 0);
    }

    /* bindWorldId */

    function testBindWorldIdAndIsAuthorized() public {
        uint256 h = 4242;
        address derived = _widAddr(h);
        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit WorldIdBound(emitter, derived);
        registry.bindWorldId(h);
        assertTrue(registry.isWorldIdAuthorizedForEmitter(emitter, h));
    }

    function testBindSeveralNullifiersPerEmitter() public {
        vm.startPrank(emitter);
        registry.bindWorldId(1);
        registry.bindWorldId(2);
        vm.stopPrank();
        assertTrue(registry.isWorldIdAuthorizedForEmitter(emitter, 1));
        assertTrue(registry.isWorldIdAuthorizedForEmitter(emitter, 2));
    }

    function testRevertBindWorldIdZero() public {
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: zero nullifier");
        registry.bindWorldId(0);
    }

    function testSameNullifierOnSeveralEmitters() public {
        uint256 h = 999;
        vm.prank(emitter);
        registry.bindWorldId(h);
        vm.prank(payer);
        registry.bindWorldId(h);
        assertTrue(registry.isWorldIdAuthorizedForEmitter(emitter, h));
        assertTrue(registry.isWorldIdAuthorizedForEmitter(payer, h));
    }

    function testIsWorldIdAuthorizedZeroNullifier() public view {
        assertFalse(registry.isWorldIdAuthorizedForEmitter(emitter, 0));
    }

    /* constructor */

    function testRevertWhenConstructorZeroToken() public {
        address[] memory tokens = new address[](1);
        tokens[0] = ZERO;
        vm.expectRevert("InvoiceRegistry: zero token");
        new InvoiceRegistry(owner, tokens, treasury);
    }

    function testRevertWhenConstructorZeroCommissionRecipient() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.expectRevert("InvoiceRegistry: zero commission recipient");
        new InvoiceRegistry(owner, tokens, ZERO);
    }

    function testConstructorAllowsMultipleInitialTokens() public {
        MockERC20 tA = new MockERC20("A", "A", 6);
        MockERC20 tB = new MockERC20("B", "B", 6);
        address[] memory tokens = new address[](2);
        tokens[0] = address(tA);
        tokens[1] = address(tB);
        InvoiceRegistry r = new InvoiceRegistry(owner, tokens, treasury);
        assertTrue(r.allowedToken(address(tA)));
        assertTrue(r.allowedToken(address(tB)));
    }
}
