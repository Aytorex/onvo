import { expect } from 'chai';
import { network } from 'hardhat';
import type {
  InvoiceRegistry,
  MockERC20,
  WorldIdRouterMock,
} from '@/typechain-types';
import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';

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

async function deployFixture() {
  const [owner, emitter, payer, stranger] = await ethers.getSigners();
  const worldId = await ethers.deployContract('WorldIdRouterMock', []);
  const token = await ethers.deployContract('MockERC20', [
    'Mock USDC',
    'mUSDC',
    6,
  ]);
  const registry = await ethers.deployContract('InvoiceRegistry', [
    owner.address,
    await worldId.getAddress(),
    EXTERNAL_NULLIFIER,
    [await token.getAddress()],
  ]);
  await token.mint(payer.address, 1_000_000n);
  await token.mint(emitter.address, 1_000_000n);
  return { owner, emitter, payer, stranger, worldId, token, registry };
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
      await expect(
        registry
          .connect(emitter)
          .createInvoice(hash, emitter.address, payer.address, amount, token),
      )
        .to.emit(registry, 'InvoiceCreated')
        .withArgs(1n, hash, emitter.address, payer.address, amount, token);

      const inv = await registry.getInvoice(1n);
      expect(inv.invoiceHash_).to.equal(hash);
      expect(inv.emitter).to.equal(emitter.address);
      expect(inv.recipient).to.equal(payer.address);
      expect(inv.amount).to.equal(amount);
      expect(inv.token).to.equal(await token.getAddress());
      expect(inv.status).to.equal(0n);
    });

    it('reverts when msg.sender is not emitter', async () => {
      const { emitter, payer, stranger, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 200n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h'));
      await expect(
        registry
          .connect(stranger)
          .createInvoice(hash, emitter.address, payer.address, 1n, token),
      ).to.be.revertedWith('InvoiceRegistry: not emitter');
    });

    it('reverts when emitter is not World-ID verified', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h2'));
      await expect(
        registry
          .connect(emitter)
          .createInvoice(hash, emitter.address, payer.address, 1n, token),
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
      await expect(
        registry
          .connect(emitter)
          .createInvoice(hash, emitter.address, payer.address, 1n, otherToken),
      ).to.be.revertedWith('InvoiceRegistry: token not allowed');
    });

    it('reverts when amount is zero', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 400n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('h4'));
      await expect(
        registry
          .connect(emitter)
          .createInvoice(hash, emitter.address, payer.address, 0n, token),
      ).to.be.revertedWith('InvoiceRegistry: zero amount');
    });

    it('reverts on duplicate invoice hash', async () => {
      const { emitter, payer, registry, token } =
        await loadFixture(deployFixture);
      await registry
        .connect(emitter)
        .registerWithWorldId(1n, 1n, 500n, DUMMY_PROOF);
      const hash = ethers.keccak256(ethers.toUtf8Bytes('dup'));
      await registry
        .connect(emitter)
        .createInvoice(hash, emitter.address, payer.address, 10n, token);
      await expect(
        registry
          .connect(emitter)
          .createInvoice(hash, emitter.address, payer.address, 20n, token),
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
      await registry
        .connect(emitter)
        .createInvoice(hash, emitter.address, payer.address, amount, token);
      return { ...ctx, amount };
    }

    it('transfers token and sets Paid', async () => {
      const { emitter, payer, registry, token, amount } = await setupPaidFlow();
      const regAddr = await registry.getAddress();
      await token.connect(payer).approve(regAddr, amount);
      await expect(registry.connect(payer).payInvoice(1n))
        .to.emit(registry, 'InvoicePaid')
        .withArgs(1n, payer.address, amount, token);

      const inv = await registry.getInvoice(1n);
      expect(inv.status).to.equal(1n);
      expect(await token.balanceOf(emitter.address)).to.equal(
        1_000_000n + amount,
      );
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
      const { payer, registry, token, amount } = await setupPaidFlow();
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await registry.connect(payer).payInvoice(1n);
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await expect(registry.connect(payer).payInvoice(1n)).to.be.revertedWith(
        'InvoiceRegistry: not pending',
      );
    });

    it('reverts when cancelled', async () => {
      const { emitter, payer, registry, token, amount } = await setupPaidFlow();
      await registry.connect(emitter).cancelInvoice(1n);
      await token.connect(payer).approve(await registry.getAddress(), amount);
      await expect(registry.connect(payer).payInvoice(1n)).to.be.revertedWith(
        'InvoiceRegistry: not pending',
      );
    });

    it('reverts when allowance insufficient', async () => {
      const { payer, registry, token } = await setupPaidFlow();
      await expect(
        registry.connect(payer).payInvoice(1n),
      ).to.be.revertedWithCustomError(token, 'ERC20InsufficientAllowance');
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
      await registry
        .connect(emitter)
        .createInvoice(hash, emitter.address, payer.address, 100n, token);
      return ctx;
    }

    it('cancels when emitter and pending', async () => {
      const { emitter, registry } = await setupInvoice();
      await expect(registry.connect(emitter).cancelInvoice(1n))
        .to.emit(registry, 'InvoiceCancelled')
        .withArgs(1n, emitter.address);
      const inv = await registry.getInvoice(1n);
      expect(inv.status).to.equal(2n);
    });

    it('reverts when not emitter', async () => {
      const { stranger, registry } = await setupInvoice();
      await expect(
        registry.connect(stranger).cancelInvoice(1n),
      ).to.be.revertedWith('InvoiceRegistry: not emitter');
    });

    it('reverts when already paid', async () => {
      const { emitter, payer, registry, token } = await setupInvoice();
      await token.connect(payer).approve(await registry.getAddress(), 100n);
      await registry.connect(payer).payInvoice(1n);
      await expect(
        registry.connect(emitter).cancelInvoice(1n),
      ).to.be.revertedWith('InvoiceRegistry: not pending');
    });

    it('reverts on double cancel', async () => {
      const { emitter, registry } = await setupInvoice();
      await registry.connect(emitter).cancelInvoice(1n);
      await expect(
        registry.connect(emitter).cancelInvoice(1n),
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
      await registry
        .connect(emitter)
        .createInvoice(hash, emitter.address, payer.address, 1n, newToken);
      const inv = await registry.getInvoice(1n);
      expect(inv.invoiceHash_).to.equal(hash);
    });
  });

  describe('constructor', () => {
    it('reverts when worldId router is zero', async () => {
      const [owner] = await ethers.getSigners();
      const token = await ethers.deployContract('MockERC20', ['T', 'T', 6]);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          ZERO,
          1n,
          [await token.getAddress()],
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero worldId');
    });

    it('reverts when allowed token is zero address', async () => {
      const [owner] = await ethers.getSigners();
      const worldId = await ethers.deployContract('WorldIdRouterMock', []);
      await expect(
        ethers.deployContract('InvoiceRegistry', [
          owner.address,
          await worldId.getAddress(),
          1n,
          [ZERO],
        ]),
      ).to.be.revertedWith('InvoiceRegistry: zero token');
    });
  });
});
