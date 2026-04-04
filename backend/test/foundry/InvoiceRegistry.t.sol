// SPDX-License-Identifier: MIT

pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";

import {InvoiceRegistry} from "@/contracts/InvoiceRegistry.sol";
import {MockERC20} from "@/contracts/mocks/MockERC20.sol";
import {WorldIdRouterMock} from "@/contracts/mocks/WorldIdRouterMock.sol";

/// @dev Mirrors Hardhat `InvoiceRegistry.test.ts` + edge cases for full line coverage on `InvoiceRegistry`.
contract InvoiceRegistryTest is Test {
    uint256 internal constant EXTERNAL_NULLIFIER = 42_424;
    address internal constant ZERO = address(0);

    /// @dev Fixed calendar period for deterministic packed invoice ids in tests.
    uint256 internal constant INV_YEAR = 2026;
    uint256 internal constant INV_MONTH = 4;
    /// @dev Sample emitter VAT ID for event / storage checks.
    string internal constant SAMPLE_VAT_NUMBER = "FR85939527636";

    uint256[8] internal dummyProof;

    InvoiceRegistry internal registry;
    WorldIdRouterMock internal worldId;
    MockERC20 internal token;
    address internal owner;
    address internal emitter;
    address internal payer;
    address internal stranger;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        bytes32 indexed invoiceHash,
        address indexed emitter_,
        address recipient,
        uint256 amount,
        address token_,
        string vatNumber
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer_,
        uint256 amount,
        address token_
    );
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed emitter_);

    function setUp() public {
        owner = makeAddr("owner");
        emitter = makeAddr("emitter");
        payer = makeAddr("payer");
        stranger = makeAddr("stranger");
        vm.label(owner, "owner");
        vm.label(emitter, "emitter");
        vm.label(payer, "payer");
        vm.label(stranger, "stranger");

        worldId = new WorldIdRouterMock();
        worldId.setRevertMessage("WorldIdRouterMock: verify failed");
        token = new MockERC20("Mock USDC", "mUSDC", 6);
        assertEq(token.decimals(), 6);

        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        registry = new InvoiceRegistry(
            owner,
            address(worldId),
            EXTERNAL_NULLIFIER,
            tokens
        );

        token.mint(payer, 1_000_000);
        token.mint(emitter, 1_000_000);
    }

    function _registerEmitter() internal {
        vm.prank(emitter);
        registry.registerWithWorldId(1, 1, 777, dummyProof);
    }

    function _nextInvoiceId(address emitter_) internal view returns (uint256) {
        return registry.getNextInvoiceId(emitter_, INV_YEAR, INV_MONTH);
    }

    /* registerWithWorldId */

    function testRegisterWithWorldIdMarksVerified() public {
        vm.prank(emitter);
        registry.registerWithWorldId(1, 1, 777, dummyProof);
        assertTrue(registry.isEmitterVerified(emitter));
    }

    function testRevertWhenRegisterWithWorldIdRouterReverts() public {
        worldId.setShouldRevert(true);
        vm.prank(emitter);
        vm.expectRevert("WorldIdRouterMock: verify failed");
        registry.registerWithWorldId(1, 1, 1, dummyProof);
    }

    function testRevertWhenRegisterWithWorldIdNullifierReuse() public {
        vm.startPrank(emitter);
        registry.registerWithWorldId(1, 1, 999, dummyProof);
        vm.expectRevert("InvoiceRegistry: nullifier used");
        registry.registerWithWorldId(2, 1, 999, dummyProof);
        vm.stopPrank();
    }

    /* createInvoice */

    function testCreateInvoicePendingAndEvent() public {
        _registerEmitter();
        bytes32 hash = keccak256("pdf-hash-1");
        uint256 amount = 1000;
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
            SAMPLE_VAT_NUMBER
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
            InvoiceRegistry.Status status
        ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
        assertEq(em, emitter);
        assertEq(recipient, payer);
        assertEq(amt, amount);
        assertEq(tok, address(token));
        assertEq(vat_, SAMPLE_VAT_NUMBER);
        assertEq(uint256(status), uint256(InvoiceRegistry.Status.Pending));
    }

    function testGetNextInvoiceIdIncrementsPerMonth() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );
        uint256 id2 = _nextInvoiceId(emitter);
        assertTrue(id2 != id1);
        (, , , uint256 seq1) = registry.parseInvoiceId(id1);
        (, , , uint256 seq2) = registry.parseInvoiceId(id2);
        assertEq(seq1 + 1, seq2);
    }

    /// @dev External call to `getNextInvoiceSequence` so forge coverage counts that entry point (not only via `getNextInvoiceId`).
    function testGetNextInvoiceSequencePublicView() public {
        assertEq(
            registry.getNextInvoiceSequence(emitter, INV_YEAR, INV_MONTH),
            1
        );
        _registerEmitter();
        assertEq(
            registry.getNextInvoiceSequence(emitter, INV_YEAR, INV_MONTH),
            1
        );
        uint256 id = _nextInvoiceId(emitter);
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
        assertEq(
            registry.getNextInvoiceSequence(emitter, INV_YEAR, INV_MONTH),
            2
        );
    }

    /// @dev Full tuple decode via external `parseInvoiceId` (ABI / coverage).
    function testParseInvoiceIdExternalDecodesPackedId() public view {
        uint256 id = registry.packInvoiceId(emitter, INV_YEAR, INV_MONTH, 7);
        (address e, uint256 y, uint256 m, uint256 s) = registry.parseInvoiceId(
            id
        );
        assertEq(e, emitter);
        assertEq(y, INV_YEAR);
        assertEq(m, INV_MONTH);
        assertEq(s, 7);
    }

    function testRevertWhenCreateInvoiceIdEmitterMismatch() public {
        _registerEmitter();
        uint256 badId = registry.packInvoiceId(
            stranger,
            INV_YEAR,
            INV_MONTH,
            1
        );
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
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceIdSequenceMismatch() public {
        _registerEmitter();
        uint256 badId = registry.packInvoiceId(
            emitter,
            INV_YEAR,
            INV_MONTH,
            99
        );
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
        uint256 id = _nextInvoiceId(emitter);
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
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceEmitterNotVerified() public {
        bytes32 hash = keccak256("h2");
        uint256 id = registry.getNextInvoiceId(emitter, INV_YEAR, INV_MONTH);
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
        vm.prank(emitter);
        registry.registerWithWorldId(1, 1, 300, dummyProof);
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
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceZeroAmount() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );
    }

    function testRevertWhenCreateInvoiceVatNumberTooLong() public {
        _registerEmitter();
        bytes32 hash = keccak256("h-vat");
        uint256 id = _nextInvoiceId(emitter);
        // 65 bytes > 64 max
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
        uint256 id1 = _nextInvoiceId(emitter);
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
            INV_YEAR,
            INV_MONTH
        );
        vm.stopPrank();
    }

    function testRevertWhenCreateInvoiceZeroRecipient() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );
    }

    /* payInvoice */

    function testPayInvoiceTransfersAndPaid() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );

        uint256 emitterBefore = token.balanceOf(emitter);
        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectEmit(true, true, true, true);
        emit InvoicePaid(id, payer, amount, address(token));
        registry.payInvoice(id);

        (, , , , , , InvoiceRegistry.Status st) = registry.getInvoice(id);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Paid));
        assertEq(token.balanceOf(emitter), emitterBefore + amount);
    }

    function testRevertWhenPayInvoiceInvalidId() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
            emitter,
            payer,
            50_000,
            address(token),
            "",
            INV_YEAR,
            INV_MONTH
        );

        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: invalid id");
        registry.payInvoice(0);

        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: invalid id");
        registry.payInvoice(99);
    }

    function testRevertWhenPayInvoiceAlreadyPaid() public {
        _registerEmitter();
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

    function testRevertWhenPayInvoiceCancelled() public {
        _registerEmitter();
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
        _registerEmitter();
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

    /// @dev `payInvoice` re-checks verification; corrupt storage to hit the revert branch.
    function testRevertWhenPayInvoiceEmitterNoLongerVerified() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );

        bytes32 slot = keccak256(abi.encode(emitter, uint256(4)));
        vm.store(address(registry), slot, bytes32(0));

        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: emitter not verified");
        registry.payInvoice(id);
    }

    /// @dev `payInvoice` re-checks allowed token; corrupt storage to hit the revert branch.
    function testRevertWhenPayInvoiceTokenNoLongerAllowed() public {
        _registerEmitter();
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
            INV_YEAR,
            INV_MONTH
        );

        bytes32 slot = keccak256(abi.encode(address(token), uint256(6)));
        vm.store(address(registry), slot, bytes32(0));

        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: token not allowed");
        registry.payInvoice(id);
    }

    /* cancelInvoice */

    function testCancelInvoicePending() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
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

        (, , , , , , InvoiceRegistry.Status st) = registry.getInvoice(id);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Cancelled));
    }

    function testRevertWhenCancelInvoiceNotEmitter() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
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
        bytes32 hash = keccak256("cancel");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
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
        bytes32 hash = keccak256("cancel");
        uint256 id = _nextInvoiceId(emitter);
        vm.prank(emitter);
        registry.createInvoice(
            id,
            hash,
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

        vm.prank(emitter);
        registry.registerWithWorldId(1, 1, 800, dummyProof);

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
            INV_YEAR,
            INV_MONTH
        );

        (bytes32 invoiceHash_, , , , , , ) = registry.getInvoice(id);
        assertEq(invoiceHash_, hash);
    }

    /* constructor */

    function testRevertWhenConstructorZeroWorldId() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(token);
        vm.expectRevert("InvoiceRegistry: zero worldId");
        new InvoiceRegistry(owner, ZERO, 1, tokens);
    }

    function testRevertWhenConstructorZeroToken() public {
        address[] memory tokens = new address[](1);
        tokens[0] = ZERO;
        vm.expectRevert("InvoiceRegistry: zero token");
        new InvoiceRegistry(owner, address(worldId), 1, tokens);
    }

    /// @dev Constructor loop + `_addAllowedToken` for more than one token.
    function testConstructorAllowsMultipleInitialTokens() public {
        MockERC20 tA = new MockERC20("A", "A", 6);
        MockERC20 tB = new MockERC20("B", "B", 6);
        address[] memory tokens = new address[](2);
        tokens[0] = address(tA);
        tokens[1] = address(tB);

        InvoiceRegistry r = new InvoiceRegistry(
            owner,
            address(worldId),
            EXTERNAL_NULLIFIER,
            tokens
        );
        assertTrue(r.allowedToken(address(tA)));
        assertTrue(r.allowedToken(address(tB)));
    }
}
