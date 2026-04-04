import { invoiceRegistryContract } from '@/lib/contract';
import { parseRegisterWithWorldIdArgs } from '@/lib/worldid-register-args';
import type { IDKitResult } from '@worldcoin/idkit';
import type { PublicClient } from 'viem';
import type { UseWriteContractReturnType } from 'wagmi';

type SwitchChainAsync = (args: { chainId: number }) => Promise<unknown>;

/**
 * Switch to the registry chain, send `registerWithWorldId`, wait for receipt.
 */
export async function registerEmitterOnChain(
  result: IDKitResult,
  deps: {
    switchChainAsync: SwitchChainAsync;
    writeContractAsync: UseWriteContractReturnType['writeContractAsync'];
    publicClientArc: PublicClient | null | undefined;
    registryChainId: number;
  },
): Promise<void> {
  await deps.switchChainAsync({ chainId: deps.registryChainId });
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
    chainId: deps.registryChainId,
  });
  await deps.publicClientArc!.waitForTransactionReceipt({ hash });
}
