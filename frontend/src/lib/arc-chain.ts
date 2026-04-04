import { arcTestnet } from 'viem/chains';

export { arcTestnet };

/** Toujours appeler avant un `writeContract` vers le registre sur Arc (évite wallet encore sur mainnet). */
export async function switchWalletToArcTestnet(
  switchChainAsync: (args: { chainId: number }) => Promise<unknown>,
): Promise<void> {
  await switchChainAsync({ chainId: arcTestnet.id });
}
