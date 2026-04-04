## Learned User Preferences

- Keep the product on Arc (including testnet); avoid moving core flows to another chain for World ID or deployment.
- Rely on backend/API verification for World ID when an on-chain World ID router is not viable on Arc.
- Do not maintain ERC-7730 descriptors or Ledger Clear Signing flows; treat that toolchain as abandoned unless explicitly revived.
- For MVP time pressure, accept a light model: optional `worldIdNullifierHash` (and similar) as invoice metadata without strong on-chain attestation until a later phase.

## Learned Workspace Facts

- `InvoiceRegistry` invoice IDs are packed as `uint256`: high 160 bits = emitter address, low 96 bits = per-emitter sequence (`(uint160(emitter) << 96) | seq`).
- The contract design dropped `registerEmitter`, `trustedVerifier`, and the older year/month/World ID–based ID packing.
- On-chain World ID proof verification via a router is not assumed for MVP on Arc; `worldIdNullifierHash` on the invoice struct is optional metadata with off-chain/API trust for verification.
- Payment flow retains commission (basis points) and a treasury/commission recipient on `payInvoice`.
- A documented future option for stronger binding without a World ID router on Arc is EIP-712–signed attestations from a dedicated `attester` address (e.g. backend key) verified with `ecrecover`.
