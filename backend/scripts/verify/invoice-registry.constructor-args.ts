import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Same token defaults as `ignition/modules/InvoiceRegistry.prod.ts`. */
const ARC_USDC = '0x3600000000000000000000000000000000000000';
const ARC_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

const __dirname = dirname(fileURLToPath(import.meta.url));
const paramsPath = join(
  __dirname,
  '../../ignition/parameters/invoice-registry.arc.json',
);

if (!existsSync(paramsPath)) {
  throw new Error(
    `Missing ${paramsPath}. Copy ignition/parameters/invoice-registry.arc.example.json, edit, then verify.`,
  );
}

const doc = JSON.parse(readFileSync(paramsPath, 'utf8')) as {
  InvoiceRegistryProdModule?: {
    initialOwner?: string;
    allowedTokens?: string[];
    commissionRecipient?: string;
  };
};

const m = doc.InvoiceRegistryProdModule;
if (m == null) {
  throw new Error(
    'invoice-registry.arc.json must contain an "InvoiceRegistryProdModule" object.',
  );
}

if (m.initialOwner == null || m.initialOwner === '') {
  throw new Error(
    'invoice-registry.arc.json: set InvoiceRegistryProdModule.initialOwner (must match deploy)',
  );
}

if (m.commissionRecipient == null || m.commissionRecipient === '') {
  throw new Error(
    'invoice-registry.arc.json: set InvoiceRegistryProdModule.commissionRecipient (Onvo treasury)',
  );
}

const allowedTokens =
  m.allowedTokens != null && m.allowedTokens.length > 0
    ? m.allowedTokens
    : [ARC_USDC, ARC_EURC];

/** Constructor args for `InvoiceRegistry` — consumed by `hardhat verify etherscan --constructor-args-path`. */
export default [m.initialOwner, allowedTokens, m.commissionRecipient];
