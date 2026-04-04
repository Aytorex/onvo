# Solidity API

## InvoiceRegistry

On-chain invoice registry: World ID–verified emitters, ERC-20 settlement (e.g. USDC / EURC), invoice lifecycle **Pending** → **Paid** / **Cancelled**.

### Events

- `InvoiceCreated` — new invoice minted (hash, parties, amount, token, VAT string, emitter nullifier).
- `InvoicePaid` — payer settled; optional commission to treasury.
- `InvoiceCancelled` — emitter cancelled a pending invoice.

### Core flows

- **`registerEmitter`** — binds an emitter address to a World ID nullifier (called by `trustedVerifier` after off-chain proof verification via `POST /api/v4/verify`).
- **`createInvoice`** — emitter creates an invoice (unique hash, allowed token, structured invoice id encoding).
- **`payInvoice`** — payer transfers token per invoice; updates status to **Paid**.
- **`cancelInvoice`** — emitter cancels while **Pending**.

See NatSpec and implementation in [`contracts/InvoiceRegistry.sol`](../contracts/InvoiceRegistry.sol).
