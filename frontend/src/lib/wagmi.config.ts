import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { arcTestnet, hardhat } from '@reown/appkit/networks';
import { cookieStorage, createStorage, http } from 'wagmi';

/**
 * Read env without destructuring `process.env` — Next.js only inlines
 * `process.env.KEY` when KEY is listed in `next.config.mjs` `env` (or `NEXT_PUBLIC_*`).
 */
const alchemyArcUrl = process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ?? '';
const alchemyApiKey = process.env.ALCHEMY_API_KEY ?? '';
const walletConnectProjectId = process.env.WALLET_CONNECT_PROJECT_ID ?? '';

/** Reown Cloud project ID (https://dashboard.reown.com), same as WalletConnect v2. */
export const projectId = walletConnectProjectId.trim();

if (!projectId) {
  throw new Error(
    'WALLET_CONNECT_PROJECT_ID is not set. Create a project at https://dashboard.reown.com',
  );
}

export const networks = [hardhat, arcTestnet] as const;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: [...networks],
  pollingInterval: 3000,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [hardhat.id]: http(),
    [arcTestnet.id]: http(`${alchemyArcUrl}${alchemyApiKey}`),
  },
});

export const config = wagmiAdapter.wagmiConfig;
