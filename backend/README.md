# Hardhat

Deploy **InvoiceRegistry** (test ERC-20, owner = account[0]) on the in-process network:

```
$ bun run deploy:invoice:local
```

Deploy **InvoiceRegistry** against a long-running node:

```
$ bun run start:node
$ bun run deploy:invoice:localhost
```

Deploy on **Arc Testnet** (needs `PRIVATE_KEY`, RPC via `ALCHEMY_ENDPOINT_URL_ARC_TESTNET` + `ALCHEMY_API_KEY` or `ARC_TESTNET_RPC_URL` — see [`hardhat.config.ts`](hardhat.config.ts)):

1. Copy the Ignition parameter template and edit addresses:

   ```
   $ cp ignition/parameters/invoice-registry.arc.example.json ignition/parameters/invoice-registry.arc.json
   ```

2. Edit `ignition/parameters/invoice-registry.arc.json` (gitignored, start from the example): set `initialOwner`, `commissionRecipient` (Onvo treasury wallet), and optionally `allowedTokens` (defaults to Arc USDC + EURC in the Ignition module).

3. Deploy:

   ```
   $ bun run deploy:invoice:arc
   ```

   This runs Hardhat Ignition with `--parameters ignition/parameters/invoice-registry.arc.json` (see [`package.json`](package.json)).

Verify on ArcScan (uses `ARCSCAN_API_KEY` in [`hardhat.config.ts`](hardhat.config.ts)). Constructor arguments are read from the same `ignition/parameters/invoice-registry.arc.json` as deploy via [`scripts/verify/invoice-registry.constructor-args.ts`](scripts/verify/invoice-registry.constructor-args.ts):

```
$ bun run verify:invoice:arc -- 0xYourDeployedInvoiceRegistry
```

After deploy, set `NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS` in the frontend env and refresh `frontend/src/lib/invoice-registry-abi.json` from `artifacts/contracts/InvoiceRegistry.sol/InvoiceRegistry.json` when the contract ABI changes.

Run hardhat tests with coverage:

```
$ bun run test:hardhat:coverage
```

# Foundry

Run foundry tests with coverage
```
$ forge coverage
```

# Slither

Install [Poetry](https://python-poetry.org/docs/#installation), then from `backend/`:

```
$ poetry install
```

Run analysis:

```
$ bun run slither
```

Configuration: [slither.config.json](slither.config.json) filters vendored OpenZeppelin, `node_modules`, and `contracts/mocks`. Run `bun run slither` with no detector exclusions.

If Slither reports a false positive on production code, document the reason in this README before adding exclusions.
