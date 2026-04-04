import { arcTestnet, switchWalletToArcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { parseRegisterWithWorldIdArgs } from '@/lib/worldid-register-args';
import type { IDKitResult } from '@worldcoin/idkit';
import type { PublicClient } from 'viem';
import type { UseWriteContractReturnType } from 'wagmi';

type SwitchChainAsync = (args: { chainId: number }) => Promise<unknown>;

/**
 * Passe sur Arc, envoie `registerWithWorldId`, attend le receipt.
 */
export async function registerEmitterOnChain(
  result: IDKitResult,
  deps: {
    switchChainAsync: SwitchChainAsync;
    writeContractAsync: UseWriteContractReturnType['writeContractAsync'];
    publicClientArc: PublicClient | null | undefined;
  },
): Promise<void> {
  await switchWalletToArcTestnet(deps.switchChainAsync);
  const args = parseRegisterWithWorldIdArgs(result);
  const hash = await deps.writeContractAsync({
    address: invoiceRegistryContract.address,
    abi: invoiceRegistryContract.abi,
    functionName: 'registerWithWorldId',
    args: [
      args.root,
      args.groupId,
      args.nullifierHash,
      [...args.proof] as [
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
        bigint,
      ],
    ],
    chainId: arcTestnet.id,
    chain: arcTestnet,
  });
  await deps.publicClientArc!.waitForTransactionReceipt({ hash });
}
