#!/usr/bin/env node
/**
 * Injects `context.contract.deployments` into invoice-registry.erc7730.json
 * for Ledger Clear Signing (ERC-7730). Wallets typically require a matching
 * (chainId, address) pair to apply the descriptor.
 *
 * Usage:
 *   CHAIN_ID=5042002 INVOICE_REGISTRY_ADDRESS=0x... node scripts/erc7730-bindings.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const target = path.join(
  root,
  'contracts/erc7730/invoice-registry.erc7730.json',
);

const chainId = Number(process.env.CHAIN_ID || '5042002');
const address = (process.env.INVOICE_REGISTRY_ADDRESS || '').trim();

if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
  console.error(
    'Set INVOICE_REGISTRY_ADDRESS=0x... (and optionally CHAIN_ID, default Arc testnet 5042002).',
  );
  process.exit(1);
}

const doc = JSON.parse(fs.readFileSync(target, 'utf8'));
doc.context ??= {};
doc.context.contract ??= {};
doc.context.contract.deployments = [
  { chainId, address: address.toLowerCase() },
];
fs.writeFileSync(target, JSON.stringify(doc, null, 2) + '\n');
console.log(
  `Updated ${path.relative(root, target)} deployments →`,
  doc.context.contract.deployments,
);
