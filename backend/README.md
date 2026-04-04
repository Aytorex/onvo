# Hardhat

Deploy **Ballot** on localhost:

```
$ bun run start:node
$ bunx hardhat ignition deploy ignition/modules/Ballot.ts --network localhost
```

Deploy **InvoiceRegistry** (mock World ID + test ERC-20) on the in-process network:

```
$ bun run deploy:invoice:local
```

Deploy **InvoiceRegistry** against a long-running node:

```
$ bun run start:node
$ bun run deploy:invoice:localhost
```

Deploy on **Arc Testnet** (needs `PRIVATE_KEY`, RPC via `ALCHEMY_ENDPOINT_URL_ARC_TESTNET` + `ALCHEMY_API_KEY` or `ARC_TESTNET_RPC_URL` — see [`hardhat.config.ts`](hardhat.config.ts)):

1. Copy the Ignition parameter template and edit addresses / nullifier:

   ```
   $ cp ignition/parameters/invoice-registry.arc.example.json ignition/parameters/invoice-registry.arc.json
   ```

2. Edit `ignition/parameters/invoice-registry.arc.json` (gitignored, start from the example): set `worldIdRouter`, `externalNullifierHash` (decimal string), `initialOwner`, and `commissionRecipient` (Onvo treasury wallet). You can drop `allowedTokens` to keep the module default (Arc USDC + EURC).

3. Deploy:

   ```
   $ bun run deploy:invoice:arc
   ```

   This runs Hardhat Ignition with `--parameters ignition/parameters/invoice-registry.arc.json` (see [`package.json`](package.json)).

Verify on ArcScan (uses `ARCSCAN_API_KEY` or `ETHERSCAN_API_KEY` in [`hardhat.config.ts`](hardhat.config.ts)). Constructor arguments are read from the same `ignition/parameters/invoice-registry.arc.json` as deploy via [`scripts/verify/invoice-registry.constructor-args.ts`](scripts/verify/invoice-registry.constructor-args.ts):

```
$ bun run verify:invoice:arc -- 0xYourDeployedInvoiceRegistry
```

After deploy, set `NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS` in the frontend env and refresh `frontend/src/lib/contract.ts` ABI if the contract changes (`bunx hardhat compile` then regenerate the ABI block if you use a script, or copy from `artifacts/contracts/InvoiceRegistry.sol/InvoiceRegistry.json`).

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

Configuration: [slither.config.json](slither.config.json) filters vendored OpenZeppelin, `node_modules`, and `contracts/mocks`. Run `bun run slither` with no detector exclusions; `registerWithWorldId` follows checks-effects-interactions (storage updates before `verifyProof`, with full revert on failure).

If Slither reports a false positive on production code, document the reason in this README before adding exclusions.
