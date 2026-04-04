import { expect } from 'chai';
import { network } from 'hardhat';
import type {
  InvoiceRegistry,
  MockERC20,
  WorldIdRouterMock,
} from '@/typechain-types';
const { ethers, networkHelpers } = await network.connect();
const { loadFixture } = networkHelpers;

const ZERO = '0x0000000000000000000000000000000000000000';
const EXTERNAL_NULLIFIER = 42_424n;
const DUMMY_PROOF = Array.from({ length: 8 }, () => 0n) as [
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

/** Calendar period for deterministic packed invoice ids (matches Foundry tests). */
const INV_YEAR = 2026n;
const INV_MONTH = 4n;
/** Sample emitter VAT ID (EU-style). */
const SAMPLE_VAT_NUMBER = 'FR85939527636';
const EMPTY_VAT_NUMBER = '';

async function nextInvoiceId(
  registry: InvoiceRegistry,
  worldIdNullifier: bigint,
): Promise<bigint> {
  return registry.getNextInvoiceId(worldIdNullifier, INV_YEAR, INV_MONTH);
}

async function deployFixture() {
  const [owner, emitter, payer, stranger, treasury] = await ethers.getSigners();
  const worldId = await ethers.deployContract('WorldIdRouterMock', []);
  await worldId.setRevertMessage('WorldIdRouterMock: verify failed');
  const token = await ethers.deployContract('MockERC20', [
    'Mock USDC',
    'mUSDC',
    6,
  ]);
  expect(await token.decimals()).to.equal(6);
  const registry = await ethers.deployContract('InvoiceRegistry', [
    owner.address,
    await worldId.getAddress(),
    EXTERNAL_NULLIFIER,
    [await token.getAddress()],
    treasury.address,
  ]);
  await token.mint(payer.address, 1_000_000n);
  await token.mint(emitter.address, 1_000_000n);
  return {
    owner,
    emitter,
    payer,
    stranger,
    treasury,
    worldId,
    token,
    registry,
  };
}

describe('InvoiceRegistry', () => {
  describe('registerWithWorldId', () => {
    it('marks emitter as verified after successful verifyProof', async () => {
      const { emitter, registry } = await loadFixture(deployFixture);
      const nullifier = 777n;
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, nullifier, DUMMY_PROOF);
      expect(await registry.isEmitterVerified(emitter.address)).to.equal(true);
      expect(await registry.emitterWorldIdNullifier(emitter.address)).to.equal(
        nullifier,
      );
    });

    it('reverts when router is configured to revert', async () => {
      const { emitter, worldId, registry } = await loadFixture(deployFixture);
      await worldId.setShouldRevert(true);
      await expect(
        registry.connect(emitter).registerWithWorldId(1n, 1n, 1n, DUMMY_PROOF),
      ).to.be.revertedWith('WorldIdRouterMock: verify failed');
    });

    it('reverts on nullifier reuse', async () => {
      const { emitter, registry } = await loadFixture(deployFixture);
      const nullifier = 999n;
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, nullifier, DUMMY_PROOF);
      await expect(
        registry
          .connect(emitter)
          .registerWithWorldId(2n, 1n, nullifier, DUMMY_PROOF),
      ).to.be.revertedWith('InvoiceRegistry: nullifier used');
    });

    it('overwrites emitterWorldIdNullifier on a second successful registration', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 111n, DUMMY_PROOF);
      expect(await registry.emitterWorldIdNullifier(emitter.address)).to.equal(
        111n,
      );
      await registry
        .connect(emitter)
        .registerWithWorldId(2n, 1n, 222n, DUMMY_PROOF);
      expect(await registry.emitterWorldIdNullifier(emitter.address)).to.equal(
        222n,
      );
      const id = await nextInvoiceId(registry, 222n);
      await registry
        .connect(emitter)
        .createInvoice(
          id,
          ethers.keccak256(ethers.toUtf8Bytes('snap')),
          emitter.address,
          payer.address,
          1n,
          token,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      const inv = await registry.getInvoice(id);
      expect(inv.worldIdNullifierHash_).to.equal(222n);
    });
  });

  describe('createInvoice', () => {
    it('creates pending invoice and emits InvoiceCreated', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 100n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('pdf-hash-1'));
      const amount = 1000n;
      const id = await nextInvoiceId(registry, 100n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            amount,
            token,
            SAMPLE_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      )
        .to.emit(registry, 'InvoiceCreated')
        .withArgs(
          id,
          hash,
          emitter.address,
          payer.address,
          amount,
          token,
          SAMPLE_VAT_NUMBER,
          100n,
        );

      const inv = await registry.getInvoice(id);
      expect(inv.invoiceHash_).to.equal(hash);
      expect(inv.emitter).to.equal(emitter.address);
      expect(inv.recipient).to.equal(payer.address);
      expect(inv.amount).to.equal(amount);
      expect(inv.token).to.equal(await token.getAddress());
      expect(inv.vatNumber).to.equal(SAMPLE_VAT_NUMBER);
      expect(inv.worldIdNullifierHash_).to.equal(100n);
      expect(inv.status).to.equal(0n);
    });

    it('reverts when msg.sender is not emitter', async () => {
      const { emitter, payer, stranger, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 200n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h'));
      const id = await nextInvoiceId(registry, 200n);
      await expect(
        registry
          .connect(stranger)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            1n,
            token,
            EMPTY_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: not emitter');
    });

    it('reverts when emitter is not World-ID verified', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h2'));
      const id = await nextInvoiceId(registry, 1n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            1n,
            token,
            EMPTY_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: emitter not verified');
    });

    it('reverts for non-allowed token', async () => {
      const { emitter, payer, registry } = await loadFixture(deployFixture);
      const otherToken = await ethers.deployContract('MockERC20', [
        'Other',
        'O',
        6,
      ]);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 300n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h3'));
      const id = await nextInvoiceId(registry, 300n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            1n,
            otherToken,
            EMPTY_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: token not allowed');
    });

    it('reverts when amount is zero', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 400n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h4'));
      const id = await nextInvoiceId(registry, 400n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            0n,
            token,
            EMPTY_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: zero amount');
    });

    it('reverts when VAT number exceeds max length', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 450n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h-vat'));
      const id = await nextInvoiceId(registry, 450n);
      const tooLong = 'X'.repeat(65);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id,
            hash,
            emitter.address,
            payer.address,
            1n,
            token,
            tooLong,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: vat number too long');
    });

    it('reverts on duplicate invoice hash', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 500n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('dup'));
      const id1 = await nextInvoiceId(registry, 500n);
      await registry
        .connect(emitter)
        .createInvoice(
          id1,
          hash,
          emitter.address,
          payer.address,
          10n,
          token,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      const id2 = await nextInvoiceId(registry, 500n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            id2,
            hash,
            emitter.address,
            payer.address,
            20n,
            token,
            EMPTY_VAT_NUMBER,
            INV_YEAR,
            INV_MONTH,
          ),
      ).to.be.revertedWith('InvoiceRegistry: hash used');
    });
  });

  describe('payInvoice', () => {
    async function setupPaidFlow() {
      const ctx = await loadFixture(deployFixture);
      const { emitter, payer, registry, token } = ctx;
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 600n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('pay'));
      const amount = 50_000n;
      const invoiceId = await nextInvoiceId(registry, 600n);
      await registry
        .connect(emitter)
        .createInvoice(
          invoiceId,
          hash,
          emitter.address,
          payer.address,
          amount,
          token,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      return { ...ctx, amount, invoiceId };
    }

    it('transfers token and sets Paid', async () => {
      const { emitter, payer, treasury, registry, token, amount, invoiceId } =
        await setupPaidFlow();
      const regAddr = await registry.getAddress();
      const fee = (amount * 10n) / 10_000n;
      const net = amount - fee;
      await token.connect(payer).approve(regAddr, amount);
      await expect(registry.connect(payer).payInvoice(invoiceId))
        .to.emit(registry, 'InvoicePaid')
        .withArgs(invoiceId, payer.address, amount, token, fee);

      const inv = await registry.getInvoice(invoiceId);
      expect(inv.status).to.equal(1n);
      expect(await token.balanceOf(emitter.address)).to.equal(1_000_000n + net);
      expect(await token.balanceOf(treasury.address)).to.equal(fee);
    });

    it('reverts for invalid id', async () => {
      const { payer, registry } = await setupPaidFlow();
      await expect(registry.connect(payer).payInvoice(0n)).to.be.revertedWith(
        'InvoiceRegistry: invalid id',
      );
      await expect(registry.connect(payer).payInvoice(99n)).to.be.revertedWith(
        'InvoiceRegistry: invalid id',
      );
    });

    it('reverts when already paid', async () => {
      const { payer, registry, token, amount, invoiceId } =
        await setupPaidFlow();
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await registry.connect(payer).payInvoice(invoiceId);
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await expect(
        registry.connect(payer).payInvoice(invoiceId),
      ).to.be.revertedWith('InvoiceRegistry: not pending');
    });

    it('reverts when cancelled', async () => {
      const { emitter, payer, registry, token, amount, invoiceId } =
        await setupPaidFlow();
      await registry.connect(emitter).cancelInvoice(invoiceId);
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await expect(
        registry.connect(payer).payInvoice(invoiceId),
      ).to.be.revertedWith('InvoiceRegistry: not pending');
    });

    it('reverts when allowance insufficient', async () => {
      const { payer, registry, token, invoiceId } = await setupPaidFlow();
      await expect(
        registry.connect(payer).payInvoice(invoiceId),
      ).to.be.revertedWithCustomError(token, 'ERC20InsufficientAllowance');
    });

    it('with zero commission bps sends full amount to emitter', async () => {
      const { owner, emitter, payer, registry, token, amount, invoiceId } =
        await setupPaidFlow();
      await registry.connect(owner).setCommissionBps(0n);
      const regAddr = await registry.getAddress();
      await token.connect(payer).approve(regAddr, amount);
      await expect(registry.connect(payer).payInvoice(invoiceId))
        .to.emit(registry, 'InvoicePaid')
        .withArgs(invoiceId, payer.address, amount, token, 0n);
      expect(await token.balanceOf(emitter.address)).to.equal(
        1_000_000n + amount,
      );
    });
  });

  describe('cancelInvoice', () => {
    async function setupInvoice() {
      const ctx = await loadFixture(deployFixture);
      const { emitter, payer, registry, token } = ctx;
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 700n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('cancel'));
      const invoiceId = await nextInvoiceId(registry, 700n);
      await registry
        .connect(emitter)
        .createInvoice(
          invoiceId,
          hash,
          emitter.address,
          payer.address,
          100n,
          token,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      return { ...ctx, invoiceId };
    }

    it('cancels when emitter and pending', async () => {
      const { emitter, registry, invoiceId } = await setupInvoice();
      await expect(registry.connect(emitter).cancelInvoice(invoiceId))
        .to.emit(registry, 'InvoiceCancelled')
        .withArgs(invoiceId, emitter.address);
      const inv = await registry.getInvoice(invoiceId);
      expect(inv.status).to.equal(2n);
    });

    it('reverts when not emitter', async () => {
      const { stranger, registry, invoiceId } = await setupInvoice();
      await expect(
        registry.connect(stranger).cancelInvoice(invoiceId),
      ).to.be.revertedWith('InvoiceRegistry: not emitter');
    });

    it('reverts when already paid', async () => {
      const { emitter, payer, registry, token, invoiceId } =
        await setupInvoice();
      await token.connect(payer).approve(await registry.getAddress(), 100n);
      await registry.connect(payer).payInvoice(invoiceId);
      await expect(
        registry.connect(emitter).cancelInvoice(invoiceId),
      ).to.be.revertedWith('InvoiceRegistry: not pending');
    });

    it('reverts on double cancel', async () => {
      const { emitter, registry, invoiceId } = await setupInvoice();
      await registry.connect(emitter).cancelInvoice(invoiceId);
      await expect(
        registry.connect(emitter).cancelInvoice(invoiceId),
      ).to.be.revertedWith('InvoiceRegistry: not pending');
    });
  });

  describe('getInvoice', () => {
    it('reverts for invalid id before any invoice', async () => {
      const { registry } = await loadFixture(deployFixture);
      await expect(registry.getInvoice(1n)).to.be.revertedWith(
        'InvoiceRegistry: invalid id',
      );
    });
  });

  describe('commission config', () => {
    it('defaults to 10 bps and exposes treasury', async () => {
      const { treasury, registry } = await loadFixture(deployFixture);
      expect(await registry.commissionBps()).to.equal(10n);
      expect(await registry.commissionRecipient()).to.equal(treasury.address);
      expect(await registry.COMMISSION_BPS_DENOMINATOR()).to.equal(10_000n);
    });

    it('owner can set commission bps and recipient', async () => {
      const { owner, emitter, registry } = await loadFixture(deployFixture);
      await expect(registry.connect(owner).setCommissionBps(100n))
        .to.emit(registry, 'CommissionBpsUpdated')
        .withArgs(100n);
      expect(await registry.commissionBps()).to.equal(100n);
      await expect(
        registry.connect(owner).setCommissionRecipient(emitter.address),
      )
        .to.emit(registry, 'CommissionRecipientUpdated')
        .withArgs(emitter.address);
      expect(await registry.commissionRecipient()).to.equal(emitter.address);
    });

    it('reverts setCommissionBps when not owner', async () => {
      const { stranger, registry } = await loadFixture(deployFixture);
      await expect(
        registry.connect(stranger).setCommissionBps(1n),
      ).to.be.revertedWithCustomError(registry, 'OwnableUnauthorizedAccount');
    });

    it('reverts setCommissionBps above 100%', async () => {
      const { owner, registry } = await loadFixture(deployFixture);
      await expect(
        registry.connect(owner).setCommissionBps(10_001n),
      ).to.be.revertedWith('InvoiceRegistry: commission bps too high');
    });

    it('reverts setCommissionRecipient to zero', async () => {
      const { owner, registry } = await loadFixture(deployFixture);
      await expect(
        registry.connect(owner).setCommissionRecipient(ZERO),
      ).to.be.revertedWith('InvoiceRegistry: zero commission recipient');
    });
  });

  describe('addAllowedToken', () => {
    it('allows only owner to add token', async () => {
      const { owner, stranger, registry } = await loadFixture(deployFixture);
      const newToken = await ethers.deployContract('MockERC20', ['N', 'N', 6]);
      const addr = await newToken.getAddress();
      await registry.connect(owner).addAllowedToken(addr);
      expect(await registry.allowedToken(addr)).to.equal(true);
      await expect(
        registry.connect(stranger).addAllowedToken(addr),
      ).to.be.revertedWithCustomError(registry, 'OwnableUnauthorizedAccount');
    });

    it('allows createInvoice with newly added token', async () => {
      const { owner, emitter, payer, registry } =
        await loadFixture(deployFixture);
      const newToken = await ethers.deployContract('MockERC20', [
        'N2',
        'N2',
        6,
      ]);
      await registry
        .connect(owner)
        .addAllowedToken(await newToken.getAddress());
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 800n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('newInvoice'));
      const id = await nextInvoiceId(registry, 800n);
      await registry
        .connect(emitter)
        .createInvoice(
          id,
          hash,
          emitter.address,
          payer.address,
          1n,
          newToken,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      const inv = await registry.getInvoice(id);
      expect(inv.invoiceHash_).to.equal(hash);
      expect(inv.worldIdNullifierHash_).to.equal(800n);
    });
  });

  describe('invoice id helpers', () => {
    it('parseInvoiceId decodes a packed id (external wrapper)', async () => {
      const { registry } = await loadFixture(deployFixture);
      const wid = await registry.worldIdNullifierToPacked160(42n);
      const packed = await registry.packInvoiceId(wid, INV_YEAR, INV_MONTH, 7n);
      const [wp, y, m, s] = await registry.parseInvoiceId(packed);
      expect(wp).to.equal(wid);
      expect(y).to.equal(INV_YEAR);
      expect(m).to.equal(INV_MONTH);
      expect(s).to.equal(7n);
    });

    it('getNextInvoiceSequence reflects count before and after createInvoice', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      expect(
        await registry.getNextInvoiceSequence(901n, INV_YEAR, INV_MONTH),
      ).to.equal(1n);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 901n, DUMMY_PROOF);
      expect(
        await registry.getNextInvoiceSequence(901n, INV_YEAR, INV_MONTH),
      ).to.equal(1n);
      const id = await nextInvoiceId(registry, 901n);
      await registry
        .connect(emitter)
        .createInvoice(
          id,
          ethers.keccak256(ethers.toUtf8Bytes('seq-hh')),
          emitter.address,
          payer.address,
          1n,
          token,
          EMPTY_VAT_NUMBER,
          INV_YEAR,
          INV_MONTH,
        );
      expect(
        await registry.getNextInvoiceSequence(901n, INV_YEAR, INV_MONTH),
      ).to.equal(2n);
    });
  });

  describe('constructor', () => {
    it('reverts when worldId router is zero', async () => {
      const [owner, , , , treasury] = await ethers.getSigners();
      const token = await ethers.deployContract('MockERC20', ['T', 'T', 6]);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          ZERO,
          1n,
          [await token.getAddress()],
          treasury.address,
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero worldId');
    });

    it('reverts when allowed token is zero address', async () => {
      const [owner, , , , treasury] = await ethers.getSigners();
      const worldId = await ethers.deployContract('WorldIdRouterMock', []);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          await worldId.getAddress(),
          1n,
          [ZERO],
          treasury.address,
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero token');
    });

    it('reverts when commission recipient is zero', async () => {
      const [owner] = await ethers.getSigners();
      const worldId = await ethers.deployContract('WorldIdRouterMock', []);
      const token = await ethers.deployContract('MockERC20', ['T', 'T', 6]);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          await worldId.getAddress(),
          1n,
          [await token.getAddress()],
          ZERO,
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero commission recipient');
    });
  });
});
