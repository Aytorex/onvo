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

1. Edit `ignition/parameters/invoice-registry.arc.json`: set `initialOwner`, `commissionRecipient` (Onvo treasury wallet), and optionally `allowedTokens` (defaults to Arc USDC + EURC in the Ignition module). The repo ships a valid JSON template (Anvil-style placeholder addresses); you can also start from `invoice-registry.arc.example.json` if you prefer a separate local file.

   If `hardhat ignition deploy` fails with **HHE10113** (“Could not parse parameters”), the file is not valid JSON/JSON5: remove trailing garbage, use straight ASCII quotes `"`, and ensure there is no `.env`-style `KEY=value` content inside the file.

2. Deploy:

   ```
   $ bun run deploy:invoice:arc
   ```

   This runs Hardhat Ignition with `--parameters ignition/parameters/invoice-registry.arc.json` (see [`package.json`](package.json)).

   Si le déploiement échoue avec une erreur de **réconciliation** (ex. constructeur modifié par rapport à un ancien déploiement enregistré localement), supprime le dossier d’état Arc puis relance : `rm -rf ignition/deployments/chain-5042002`, ou bien `bun run deploy:invoice:arc -- --reset` (équivalent ; confirmation requise, `HARDHAT_IGNITION_CONFIRM_RESET=1` en CI). Cela ne supprime rien on-chain ; le prochain déploiement crée un **nouveau** contrat.

Verify on ArcScan (uses `ARCSCAN_API_KEY` in [`hardhat.config.ts`](hardhat.config.ts)). Constructor arguments are read from the same `ignition/parameters/invoice-registry.arc.json` as deploy via [`scripts/verify/invoice-registry.constructor-args.ts`](scripts/verify/invoice-registry.constructor-args.ts). Hardhat exige l’adresse du contrat en **premier argument** après `--` :

```
$ bun run verify:invoice:arc -- 0xYourDeployedInvoiceRegistry
```

After deploy, set `NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS` in the frontend env and refresh `frontend/src/lib/invoice-registry-abi.json` when the contract ABI changes (e.g. `cd backend && forge inspect InvoiceRegistry abi --json | jq '.' > ../frontend/src/lib/invoice-registry-abi.json`).

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
