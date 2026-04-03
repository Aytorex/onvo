import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
  base,
  baseSepolia,
  hardhat,
  mainnet,
  sepolia,
} from '@reown/appkit/networks';
import { cookieStorage, createStorage, http } from 'wagmi';

const {
  ALCHEMY_ENDPOINT_URL_BASE_MAINNET = '',
  ALCHEMY_ENDPOINT_URL_BASE_SEPOLIA = '',
  ALCHEMY_ENDPOINT_URL_ETHEREUM_MAINNET = '',
  ALCHEMY_ENDPOINT_URL_ETHEREUM_SEPOLIA = '',
  ALCHEMY_API_KEY = '',
} = process.env;

/** Reown Cloud project ID (https://dashboard.reown.com), same as WalletConnect v2. */
export const projectId = process.env.WALLET_CONNECT_PROJECT_ID?.trim() ?? '';

if (!projectId) {
  throw new Error(
    'WALLET_CONNECT_PROJECT_ID is not set. Create a project at https://dashboard.reown.com',
  );
}

export const networks = [hardhat, sepolia, baseSepolia, mainnet, base] as const;

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
    [sepolia.id]: http(
      `${ALCHEMY_ENDPOINT_URL_ETHEREUM_SEPOLIA}${ALCHEMY_API_KEY}`,
    ),
    [baseSepolia.id]: http(
      `${ALCHEMY_ENDPOINT_URL_BASE_SEPOLIA}${ALCHEMY_API_KEY}`,
    ),
    [mainnet.id]: http(
      `${ALCHEMY_ENDPOINT_URL_ETHEREUM_MAINNET}${ALCHEMY_API_KEY}`,
    ),
    [base.id]: http(`${ALCHEMY_ENDPOINT_URL_BASE_MAINNET}${ALCHEMY_API_KEY}`),
  },
});

export const config = wagmiAdapter.wagmiConfig;
