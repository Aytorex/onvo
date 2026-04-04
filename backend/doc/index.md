# Solidity API

## InvoiceRegistry

On-chain invoice registry: sequential invoice ids per emitter wallet, ERC-20 settlement (e.g. USDC / EURC), invoice lifecycle **Pending** → **Paid** / **Cancelled**. World ID is verified off-chain (API); `worldIdNullifierHash` on each invoice is optional metadata for the MVP.

### Events

- `InvoiceCreated` — new invoice minted (hash, parties, amount, token, VAT string, optional nullifier metadata).
- `InvoicePaid` — payer settled; optional commission to treasury.
- `InvoiceCancelled` — emitter cancelled a pending invoice.

### Core flows

- **`bindWorldId`** — l’émetteur enregistre un nullifier (signal produit après vérif off-chain). Plusieurs nullifiers par émetteur ; le même nullifier peut aussi être enregistré par d’autres émetteurs (pas d’unicité globale on-chain).
- **`isWorldIdAuthorizedForEmitter(emitter, nullifierHash)`** — vue pour savoir si ce nullifier est enregistré pour cet émetteur (le `0` renvoie toujours `false`).
- **`createInvoice`** — emitter creates an invoice (unique PDF hash, allowed token, packed `invoiceId` = emitter + sequence).
- **`getInvoiceCountForEmitter`** — nombre de factures créées par cet émetteur (séquences `1`..`count`).
- **`getLastInvoiceIdForEmitter`** — dernier `invoiceId` créé (`packInvoiceId(emitter, count)`), ou `0` si aucune facture / adresse nulle ; pour lister à l’envers, multicall `getInvoice` en décrémentant la séquence ou reconstruire les ids avec `packInvoiceId`.
- **`payInvoice`** — payer transfers token per invoice; updates status to **Paid**.
- **`cancelInvoice`** — emitter cancels while **Pending**.

See NatSpec and implementation in [`contracts/InvoiceRegistry.sol`](../contracts/InvoiceRegistry.sol).
