import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeStub = path.join(__dirname, 'src/lib/node-stub.ts');

/** Même défauts que `src/lib/invoice-tokens.ts` (Arc Testnet). */
const ARC_TESTNET_USDC = '0x3600000000000000000000000000000000000000';
const ARC_TESTNET_EURC = '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a';

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? '',
    ALCHEMY_ENDPOINT_URL_ARC_TESTNET:
      process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ??
      process.env.ALCHEMY_ENDPOINT_URL_BASE_SEPOLIA ??
      '',
    NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS ?? '',
    NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK:
      process.env.NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK ?? '0',
    NEXT_PUBLIC_WORLD_APP_ID: process.env.NEXT_PUBLIC_WORLD_APP_ID ?? '',
    NEXT_PUBLIC_WORLD_RP_ID: process.env.NEXT_PUBLIC_WORLD_RP_ID ?? '',
    NEXT_PUBLIC_TOKEN_USDC:
      process.env.NEXT_PUBLIC_TOKEN_USDC ?? ARC_TESTNET_USDC,
    NEXT_PUBLIC_TOKEN_EURC:
      process.env.NEXT_PUBLIC_TOKEN_EURC ?? ARC_TESTNET_EURC,
    NEXT_PUBLIC_WORLD_ID_GROUP_ID:
      process.env.NEXT_PUBLIC_WORLD_ID_GROUP_ID ?? '1',
    NEXT_PUBLIC_WORLD_ID_ENV:
      process.env.NEXT_PUBLIC_WORLD_ID_ENV ?? 'staging',
  },
  reactStrictMode: true,
  serverExternalPackages: ['pino-pretty', 'encoding'],
  turbopack: {
    resolveAlias: {
      fs: { browser: nodeStub },
      net: { browser: nodeStub },
      tls: { browser: nodeStub },
    },
  },
};

export default nextConfig;
