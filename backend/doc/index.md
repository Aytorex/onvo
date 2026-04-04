# Solidity API

## InvoiceRegistry

On-chain invoice registry: sequential invoice ids per emitter wallet, ERC-20 settlement (e.g. USDC / EURC), invoice lifecycle **Pending** → **Paid** / **Cancelled**. World ID is verified off-chain (API). Each invoice can carry optional World ID metadata: the IDKit **nullifier** (`uint256`) is passed into `createInvoice`; the contract stores a **normalized `address`** derived as `address(uint160(uint256(keccak256(abi.encodePacked(nullifier)))))` (see `worldIdAddressFromNullifier`), or `address(0)` if omitted.

### Events

- `InvoiceCreated` — new invoice minted (hash, parties, amount, token, VAT string, optional derived `worldIdAddress`).
- `InvoicePaid` — payer settled; optional commission to treasury.
- `InvoiceCancelled` — emitter cancelled a pending invoice.

### Core flows

- **`bindWorldId(nullifier)`** — l’émetteur enregistre un nullifier IDKit ; le contrat en dérive une `address` et l’enregistre (plusieurs nullifiers par émetteur ; pas d’unicité globale on-chain).
- **`worldIdAddressFromNullifier(nullifier)`** — pure, même règle de dérivation que le stockage.
- **`isWorldIdAuthorizedForEmitter(emitter, nullifier)`** — indique si ce nullifier a été enregistré pour cet émetteur (`nullifier == 0` → `false`).
- **`createInvoice`** — emitter creates an invoice (unique PDF hash, allowed token, packed `invoiceId` = emitter + sequence).
- **`getInvoiceCountForEmitter`** — nombre de factures créées par cet émetteur (séquences `1`..`count`).
- **`getLastInvoiceIdForEmitter`** — dernier `invoiceId` créé (`packInvoiceId(emitter, count)`), ou `0` si aucune facture / adresse nulle ; pour lister à l’envers, multicall `getInvoice` en décrémentant la séquence ou reconstruire les ids avec `packInvoiceId`.
- **`payInvoice`** — payer transfers token per invoice; updates status to **Paid**.
- **`cancelInvoice`** — emitter cancels while **Pending**.

See NatSpec and implementation in [`contracts/InvoiceRegistry.sol`](../contracts/InvoiceRegistry.sol).
