import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeStub = path.join(__dirname, 'src/lib/node-stub.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID ?? '',
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY ?? '',
    ALCHEMY_ENDPOINT_URL_ARC_TESTNET:
      process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ??
      process.env.ALCHEMY_ENDPOINT_URL_BASE_SEPOLIA ??
      '',
    NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS:
      process.env.NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS ?? '',
    NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK:
      process.env.NEXT_PUBLIC_INVOICE_REGISTRY_FROM_BLOCK ?? '0',
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
