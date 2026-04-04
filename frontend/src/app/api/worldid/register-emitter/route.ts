import { invoiceRegistryContract } from '@/lib/contract';
import { NextResponse } from 'next/server';
import { createWalletClient, createPublicClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hardhat, arcTestnet } from 'viem/chains';
import type { IDKitResult } from '@worldcoin/idkit';

const VERIFIER_PRIVATE_KEY = process.env.TRUSTED_VERIFIER_PRIVATE_KEY as
  | `0x${string}`
  | undefined;

function getChain(): Chain {
  const chainId = invoiceRegistryContract.chainId;
  if (chainId === hardhat.id) return hardhat;
  return arcTestnet;
}

function getRpcUrl(chain: Chain): string {
  if (chain.id === hardhat.id) return 'http://127.0.0.1:8545';
  const alchemyKey = process.env.ALCHEMY_API_KEY ?? '';
  const alchemyBase = process.env.ALCHEMY_ENDPOINT_URL_ARC_TESTNET ?? '';
  if (alchemyBase && alchemyKey) return `${alchemyBase}${alchemyKey}`;
  return chain.rpcUrls.default.http[0];
}

function extractNullifier(result: IDKitResult): string {
  const first = result.responses?.[0];
  if (!first) return '';
  if ('nullifier' in first) return first.nullifier as string;
  return '';
}

/**
 * The World ID proof is already verified by `handleVerify` → `POST /api/verify-worldid`
 * before IDKit calls `onSuccess`. This route only needs the nullifier to register on-chain.
 * Re-verifying would fail because the proof is single-use.
 */
export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as {
    emitterAddress?: string;
    idkitResult?: IDKitResult;
  };

  if (!body.emitterAddress || !body.idkitResult) {
    return NextResponse.json(
      { message: 'Missing emitterAddress or idkitResult' },
      { status: 400 },
    );
  }

  if (!VERIFIER_PRIVATE_KEY) {
    return NextResponse.json(
      { message: 'Server misconfigured: TRUSTED_VERIFIER_PRIVATE_KEY not set' },
      { status: 500 },
    );
  }

  const nullifierHex = extractNullifier(body.idkitResult);
  if (!nullifierHex) {
    return NextResponse.json(
      { message: 'Could not extract nullifier from proof' },
      { status: 400 },
    );
  }

  const nullifierHash = BigInt(nullifierHex);
  const chain = getChain();
  const rpcUrl = getRpcUrl(chain);

  const account = privateKeyToAccount(VERIFIER_PRIVATE_KEY);
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  try {
    const hash = await walletClient.writeContract({
      address: invoiceRegistryContract.address,
      abi: invoiceRegistryContract.abi,
      functionName: 'registerEmitter',
      args: [body.emitterAddress as `0x${string}`, nullifierHash],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(
      '[register-emitter] tx confirmed:',
      hash,
      'block:',
      receipt.blockNumber,
    );

    return NextResponse.json({
      success: true,
      txHash: hash,
      nullifier: nullifierHex,
    });
  } catch (e) {
    console.error('[register-emitter] on-chain tx failed:', e);
    const msg = e instanceof Error ? e.message : 'On-chain registration failed';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
