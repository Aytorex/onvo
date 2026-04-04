import { arcTestnet, hardhat } from 'viem/chains';
import { cookieStorage, createConfig, createStorage, http } from 'wagmi';

const alchemyArcUrl = process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ?? '';
const alchemyApiKey = process.env.ALCHEMY_API_KEY ?? '';

export const chains = [arcTestnet, hardhat] as const;

export const config = createConfig({
  chains,
  multiInjectedProviderDiscovery: false,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [hardhat.id]: http(),
    [arcTestnet.id]: http(
      alchemyArcUrl && alchemyApiKey
        ? `${alchemyArcUrl}${alchemyApiKey}`
        : undefined,
    ),
  },
});
