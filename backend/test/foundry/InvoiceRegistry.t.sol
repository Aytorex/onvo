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
        address token_
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
        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCreated(1, hash, emitter, payer, amount, address(token));
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        (
            bytes32 invoiceHash_,
            address em,
            address recipient,
            uint256 amt,
            address tok,
            InvoiceRegistry.Status status
        ) = registry.getInvoice(1);
        assertEq(invoiceHash_, hash);
        assertEq(em, emitter);
        assertEq(recipient, payer);
        assertEq(amt, amount);
        assertEq(tok, address(token));
        assertEq(uint256(status), uint256(InvoiceRegistry.Status.Pending));
    }

    function testRevertWhenCreateInvoiceNotEmitter() public {
        _registerEmitter();
        bytes32 hash = keccak256("h");
        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not emitter");
        registry.createInvoice(hash, emitter, payer, 1, address(token));
    }

    function testRevertWhenCreateInvoiceEmitterNotVerified() public {
        bytes32 hash = keccak256("h2");
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: emitter not verified");
        registry.createInvoice(hash, emitter, payer, 1, address(token));
    }

    function testRevertWhenCreateInvoiceTokenNotAllowed() public {
        MockERC20 other = new MockERC20("Other", "O", 6);
        vm.prank(emitter);
        registry.registerWithWorldId(1, 1, 300, dummyProof);
        bytes32 hash = keccak256("h3");
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: token not allowed");
        registry.createInvoice(hash, emitter, payer, 1, address(other));
    }

    function testRevertWhenCreateInvoiceZeroAmount() public {
        _registerEmitter();
        bytes32 hash = keccak256("h4");
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: zero amount");
        registry.createInvoice(hash, emitter, payer, 0, address(token));
    }

    function testRevertWhenCreateInvoiceHashUsed() public {
        _registerEmitter();
        bytes32 hash = keccak256("dup");
        vm.startPrank(emitter);
        registry.createInvoice(hash, emitter, payer, 10, address(token));
        vm.expectRevert("InvoiceRegistry: hash used");
        registry.createInvoice(hash, emitter, payer, 20, address(token));
        vm.stopPrank();
    }

    function testRevertWhenCreateInvoiceZeroRecipient() public {
        _registerEmitter();
        bytes32 hash = keccak256("zero-recipient");
        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: zero recipient");
        registry.createInvoice(hash, emitter, ZERO, 1, address(token));
    }

    /* payInvoice */

    function testPayInvoiceTransfersAndPaid() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        uint256 emitterBefore = token.balanceOf(emitter);
        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectEmit(true, true, true, true);
        emit InvoicePaid(1, payer, amount, address(token));
        registry.payInvoice(1);

        (, , , , , InvoiceRegistry.Status st) = registry.getInvoice(1);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Paid));
        assertEq(token.balanceOf(emitter), emitterBefore + amount);
    }

    function testRevertWhenPayInvoiceInvalidId() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 50_000, address(token));

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
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        vm.startPrank(payer);
        token.approve(address(registry), amount);
        registry.payInvoice(1);
        token.approve(address(registry), amount);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.payInvoice(1);
        vm.stopPrank();
    }

    function testRevertWhenPayInvoiceCancelled() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        vm.prank(emitter);
        registry.cancelInvoice(1);

        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.payInvoice(1);
    }

    function testRevertWhenPayInvoiceInsufficientAllowance() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        vm.prank(payer);
        vm.expectRevert(
            abi.encodeWithSelector(
                IERC20Errors.ERC20InsufficientAllowance.selector,
                address(registry),
                uint256(0),
                amount
            )
        );
        registry.payInvoice(1);
    }

    /// @dev `payInvoice` re-checks verification; corrupt storage to hit the revert branch.
    function testRevertWhenPayInvoiceEmitterNoLongerVerified() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        bytes32 slot = keccak256(abi.encode(emitter, uint256(5)));
        vm.store(address(registry), slot, bytes32(0));

        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: emitter not verified");
        registry.payInvoice(1);
    }

    /// @dev `payInvoice` re-checks allowed token; corrupt storage to hit the revert branch.
    function testRevertWhenPayInvoiceTokenNoLongerAllowed() public {
        _registerEmitter();
        bytes32 hash = keccak256("pay");
        uint256 amount = 50_000;
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, amount, address(token));

        bytes32 slot = keccak256(abi.encode(address(token), uint256(7)));
        vm.store(address(registry), slot, bytes32(0));

        vm.prank(payer);
        token.approve(address(registry), amount);
        vm.prank(payer);
        vm.expectRevert("InvoiceRegistry: token not allowed");
        registry.payInvoice(1);
    }

    /* cancelInvoice */

    function testCancelInvoicePending() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 100, address(token));

        vm.prank(emitter);
        vm.expectEmit(true, true, true, true);
        emit InvoiceCancelled(1, emitter);
        registry.cancelInvoice(1);

        (, , , , , InvoiceRegistry.Status st) = registry.getInvoice(1);
        assertEq(uint256(st), uint256(InvoiceRegistry.Status.Cancelled));
    }

    function testRevertWhenCancelInvoiceNotEmitter() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 100, address(token));

        vm.prank(stranger);
        vm.expectRevert("InvoiceRegistry: not emitter");
        registry.cancelInvoice(1);
    }

    function testRevertWhenCancelInvoiceAlreadyPaid() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 100, address(token));

        vm.prank(payer);
        token.approve(address(registry), 100);
        vm.prank(payer);
        registry.payInvoice(1);

        vm.prank(emitter);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.cancelInvoice(1);
    }

    function testRevertWhenCancelInvoiceDoubleCancel() public {
        _registerEmitter();
        bytes32 hash = keccak256("cancel");
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 100, address(token));

        vm.startPrank(emitter);
        registry.cancelInvoice(1);
        vm.expectRevert("InvoiceRegistry: not pending");
        registry.cancelInvoice(1);
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
        vm.prank(emitter);
        registry.createInvoice(hash, emitter, payer, 1, address(newToken));

        (bytes32 invoiceHash_, , , , , ) = registry.getInvoice(1);
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
