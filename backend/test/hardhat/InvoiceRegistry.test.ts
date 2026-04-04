import type { InvoiceRegistry } from '@/typechain-types';
import { expect } from 'chai';
import { network } from 'hardhat';
const { ethers, networkHelpers } = await network.connect();
const { loadFixture } = networkHelpers;

const ZERO = '0x0000000000000000000000000000000000000000';

const SAMPLE_VAT_NUMBER = 'FR85939527636';
const EMPTY_VAT_NUMBER = '';
const WORLD_META = 100n;

async function nextInvoiceId(
  registry: InvoiceRegistry,
  emitter: string,
): Promise<bigint> {
  return registry.getNextInvoiceId(emitter);
}

async function deployFixture() {
  const [owner, emitter, payer, stranger, treasury] = await ethers.getSigners();
  const token = await ethers.deployContract('MockERC20', [
    'Mock USDC',
    'mUSDC',
    6,
  ]);
  expect(await token.decimals()).to.equal(6);
  const registry = await ethers.deployContract('InvoiceRegistry', [
    owner.address,
    [await token.getAddress()],
    treasury.address,
  ]);
  await token.mint(payer.address, 1_000_000n);
  await token.mint(emitter.address, 1_000_000n);
  return { owner, emitter, payer, stranger, treasury, token, registry };
}

describe('InvoiceRegistry', () => {
  describe('createInvoice', () => {
    it('creates pending invoice and emits InvoiceCreated', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('pdf-hash-1'));
      const amount = 1000n;
      const id = await nextInvoiceId(registry, emitter.address);
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
            WORLD_META,
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
          WORLD_META,
        );

      const inv = await registry.getInvoice(id);
      expect(inv.invoiceHash_).to.equal(hash);
      expect(inv.emitter).to.equal(emitter.address);
      expect(inv.recipient).to.equal(payer.address);
      expect(inv.amount).to.equal(amount);
      expect(inv.token).to.equal(await token.getAddress());
      expect(inv.vatNumber).to.equal(SAMPLE_VAT_NUMBER);
      expect(inv.worldIdNullifierHash_).to.equal(WORLD_META);
      expect(inv.status).to.equal(0n);
    });

    it('reverts when msg.sender is not emitter', async () => {
      const { emitter, payer, stranger, registry, token } =
        await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h'));
      const id = await nextInvoiceId(registry, emitter.address);
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
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: not emitter');
    });

    it('reverts for non-allowed token', async () => {
      const { emitter, payer, registry } = await loadFixture(deployFixture);
      const otherToken = await ethers.deployContract('MockERC20', [
        'Other',
        'O',
        6,
      ]);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h3'));
      const id = await nextInvoiceId(registry, emitter.address);
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
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: token not allowed');
    });

    it('reverts when amount is zero', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h4'));
      const id = await nextInvoiceId(registry, emitter.address);
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
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: zero amount');
    });

    it('reverts when VAT number exceeds max length', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h-vat'));
      const id = await nextInvoiceId(registry, emitter.address);
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
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: vat number too long');
    });

    it('reverts on duplicate invoice hash', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('dup'));
      const id1 = await nextInvoiceId(registry, emitter.address);
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
          0n,
        );
      const id2 = await nextInvoiceId(registry, emitter.address);
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
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: hash used');
    });

    it('reverts when id sequence does not match next', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('seq'));
      const wrongId = await registry.packInvoiceId(emitter.address, 99n);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            wrongId,
            hash,
            emitter.address,
            payer.address,
            1n,
            token,
            EMPTY_VAT_NUMBER,
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: id sequence mismatch');
    });

    it('reverts when id emitter does not match', async () => {
      const { emitter, payer, stranger, registry, token } =
        await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('em'));
      const badId = await nextInvoiceId(registry, stranger.address);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(
            badId,
            hash,
            emitter.address,
            payer.address,
            1n,
            token,
            EMPTY_VAT_NUMBER,
            0n,
          ),
      ).to.be.revertedWith('InvoiceRegistry: id emitter mismatch');
    });
  });

  describe('payInvoice', () => {
    async function setupPaidFlow() {
      const ctx = await loadFixture(deployFixture);
      const { emitter, payer, registry, token } = ctx;
      const hash = ethers.keccak256(ethers.toUtf8Bytes('pay'));
      const amount = 50_000n;
      const invoiceId = await nextInvoiceId(registry, emitter.address);
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
          0n,
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
      const hash = ethers.keccak256(ethers.toUtf8Bytes('cancel'));
      const invoiceId = await nextInvoiceId(registry, emitter.address);
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
          0n,
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
      const hash = ethers.keccak256(ethers.toUtf8Bytes('newInvoice'));
      const id = await nextInvoiceId(registry, emitter.address);
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
          42n,
        );
      const inv = await registry.getInvoice(id);
      expect(inv.invoiceHash_).to.equal(hash);
      expect(inv.worldIdNullifierHash_).to.equal(42n);
    });
  });

  describe('invoice id helpers', () => {
    it('parseInvoiceId decodes a packed id', async () => {
      const { emitter, registry } = await loadFixture(deployFixture);
      const packed = await registry.packInvoiceId(emitter.address, 7n);
      const [em, seq] = await registry.parseInvoiceId(packed);
      expect(em).to.equal(emitter.address);
      expect(seq).to.equal(7n);
    });

    it('getNextInvoiceId increments per emitter', async () => {
      const { emitter, payer, registry, token } = await loadFixture(deployFixture);
      const id1 = await nextInvoiceId(registry, emitter.address);
      await registry
        .connect(emitter)
        .createInvoice(
          id1,
          ethers.keccak256(ethers.toUtf8Bytes('seq-hh')),
          emitter.address,
          payer.address,
          1n,
          token,
          EMPTY_VAT_NUMBER,
          0n,
        );
      const id2 = await nextInvoiceId(registry, emitter.address);
      expect(id2).to.not.equal(id1);
      const [, s1] = await registry.parseInvoiceId(id1);
      const [, s2] = await registry.parseInvoiceId(id2);
      expect(s1 + 1n).to.equal(s2);
    });
  });

  describe('constructor', () => {
    it('reverts when allowed token is zero address', async () => {
      const [owner, , , , treasury] = await ethers.getSigners();
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          [ZERO],
          treasury.address,
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero token');
    });

    it('reverts when commission recipient is zero', async () => {
      const [owner] = await ethers.getSigners();
      const token = await ethers.deployContract('MockERC20', ['T', 'T', 6]);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          [await token.getAddress()],
          ZERO,
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero commission recipient');
    });
  });
});
