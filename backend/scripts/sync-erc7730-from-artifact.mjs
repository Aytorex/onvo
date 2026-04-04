#!/usr/bin/env node
/**
 * Verifies that each `display.formats` key in invoice-registry.erc7730.json
 * matches a function on InvoiceRegistry (Forge artifact). Run `forge build` first.
 *
 * EIP-7730 v2 derives selectors from `display.formats` keys; `context.contract.abi`
 * is deprecated — this script only guards against ABI/descriptor drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Interface } from 'ethers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const artifactPath = path.join(
  root,
  'out/InvoiceRegistry.sol/InvoiceRegistry.json',
);
const target = path.join(
  root,
  'contracts/erc7730/invoice-registry.erc7730.json',
);

const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
const doc = JSON.parse(fs.readFileSync(target, 'utf8'));
const formatKeys = Object.keys(doc.display?.formats ?? {});

const iface = new Interface(artifact.abi);
const bySelector = new Map();
for (const frag of iface.fragments) {
  if (frag.type === 'function') {
    bySelector.set(frag.selector, frag.format('sighash'));
  }
}

const missing = [];
for (const key of formatKeys) {
  let selector;
  try {
    const local = new Interface([`function ${key}`]);
    const fn = local.fragments.find((f) => f.type === 'function');
    selector = fn.selector;
  } catch {
    missing.push(`${key} (parse error)`);
    continue;
  }
  if (!bySelector.has(selector)) {
    missing.push(`${key} → selector ${selector} not in InvoiceRegistry ABI`);
  }
}

if (missing.length) {
  console.error(
    'ERC-7730 format keys out of sync with contract:\n',
    missing.join('\n'),
  );
  process.exit(1);
}

console.log(
  'OK: all',
  formatKeys.length,
  'display.formats entries match InvoiceRegistry selectors.',
);
