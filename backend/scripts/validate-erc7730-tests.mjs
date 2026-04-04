#!/usr/bin/env node
/**
 * Validates `invoice-registry.erc7730.tests.json` against the Ledger ERC-7730
 * test file rules (structure + rawTx shape + calldata selectors).
 * @see https://github.com/LedgerHQ/clear-signing-erc7730-registry
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Transaction } from 'ethers';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const testsPath = path.join(
  root,
  'contracts/erc7730/invoice-registry.erc7730.tests.json',
);

const RAW_TX = /^0x[0-9a-fA-F]+$/;
const TX_HASH = /^0x[0-9a-fA-F]{64}$/;

/** Expected function selectors in `tests` array order (Ledger cs-tester vectors). */
const EXPECTED_SELECTORS = [
  '0xd65413b5', // createInvoice
  '0xac60a6cd', // payInvoice
  '0xda9c273d', // cancelInvoice
  '0x12b914ef', // registerWithWorldId
];

const doc = JSON.parse(fs.readFileSync(testsPath, 'utf8'));

if (
  typeof doc.$schema !== 'string' ||
  !doc.$schema.includes('erc7730-tests.schema.json')
) {
  console.error('Missing or invalid $schema on tests file.');
  process.exit(1);
}

if (!Array.isArray(doc.tests) || doc.tests.length < 1) {
  console.error('tests must be a non-empty array.');
  process.exit(1);
}

if (doc.tests.length !== EXPECTED_SELECTORS.length) {
  console.error(
    `Expected ${EXPECTED_SELECTORS.length} test cases, got ${doc.tests.length}.`,
  );
  process.exit(1);
}

for (let i = 0; i < doc.tests.length; i++) {
  const t = doc.tests[i];
  const label = t.description || `tests[${i}]`;

  if (typeof t.rawTx !== 'string' || !RAW_TX.test(t.rawTx)) {
    console.error(`${label}: rawTx must be a 0x-hex string.`);
    process.exit(1);
  }

  if (
    t.txHash !== undefined &&
    (typeof t.txHash !== 'string' || !TX_HASH.test(t.txHash))
  ) {
    console.error(`${label}: txHash must be 32-byte 0x-hex when set.`);
    process.exit(1);
  }

  if (t.description !== undefined && typeof t.description !== 'string') {
    console.error(`${label}: description must be a string when set.`);
    process.exit(1);
  }

  if (!Array.isArray(t.expectedTexts) || t.expectedTexts.length < 1) {
    console.error(`${label}: expectedTexts must be a non-empty array.`);
    process.exit(1);
  }

  for (const s of t.expectedTexts) {
    if (typeof s !== 'string' || s.length === 0) {
      console.error(
        `${label}: expectedTexts entries must be non-empty strings.`,
      );
      process.exit(1);
    }
  }

  const extra = Object.keys(t).filter(
    (k) => !['rawTx', 'txHash', 'description', 'expectedTexts'].includes(k),
  );
  if (extra.length) {
    console.error(`${label}: unknown keys: ${extra.join(', ')}`);
    process.exit(1);
  }

  let data;
  try {
    const parsed = Transaction.from(t.rawTx);
    data = parsed.data;
  } catch (e) {
    console.error(`${label}: failed to parse rawTx:`, e.message);
    process.exit(1);
  }

  if (!data || data.length < 4) {
    console.error(`${label}: calldata too short.`);
    process.exit(1);
  }

  const sel = data.slice(0, 10).toLowerCase();
  const want = EXPECTED_SELECTORS[i].toLowerCase();
  if (sel !== want) {
    console.error(
      `${label}: expected selector ${want}, got ${sel} (test index ${i}).`,
    );
    process.exit(1);
  }
}

console.log(
  'OK: ERC-7730 calldata test file structure and selectors (',
  doc.tests.length,
  'cases).',
);
