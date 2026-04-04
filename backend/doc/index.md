# Solidity API

## InvoiceRegistry

On-chain invoice registry: sequential invoice ids per emitter wallet, ERC-20 settlement (e.g. USDC / EURC), invoice lifecycle **Pending** → **Paid** / **Cancelled**. World ID is verified off-chain (API); `worldIdNullifierHash` on each invoice is optional metadata for the MVP.

### Events

- `InvoiceCreated` — new invoice minted (hash, parties, amount, token, VAT string, optional nullifier metadata).
- `InvoicePaid` — payer settled; optional commission to treasury.
- `InvoiceCancelled` — emitter cancelled a pending invoice.

### Core flows

- **`createInvoice`** — emitter creates an invoice (unique PDF hash, allowed token, packed `invoiceId` = emitter + sequence).
- **`payInvoice`** — payer transfers token per invoice; updates status to **Paid**.
- **`cancelInvoice`** — emitter cancels while **Pending**.

See NatSpec and implementation in [`contracts/InvoiceRegistry.sol`](../contracts/InvoiceRegistry.sol).
