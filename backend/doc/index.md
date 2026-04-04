# Solidity API

## InvoiceRegistry

On-chain invoice registry: World ID–verified emitters, ERC-20 settlement (e.g. USDC / EURC), invoice lifecycle **Pending** → **Paid** / **Cancelled**.

### Events

- `InvoiceCreated` — new invoice minted (hash, parties, amount, token, VAT string, emitter nullifier).
- `InvoicePaid` — payer settled; optional commission to treasury.
- `InvoiceCancelled` — emitter cancelled a pending invoice.

### Core flows

- **`registerWithWorldId`** — binds an emitter address to a verified World ID proof (nullifier tracked).
- **`createInvoice`** — emitter creates an invoice (unique hash, allowed token, structured invoice id encoding).
- **`payInvoice`** — payer transfers token per invoice; updates status to **Paid**.
- **`cancelInvoice`** — emitter cancels while **Pending**.

See NatSpec and implementation in [`contracts/InvoiceRegistry.sol`](../contracts/InvoiceRegistry.sol).
