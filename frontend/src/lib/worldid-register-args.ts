import type { IDKitResult } from '@worldcoin/idkit';
import { decodeAbiParameters } from 'viem';

/** Groupe World ID (Orb) — aligné avec le déploiement du routeur. */
export function worldIdGroupId(): bigint {
  return BigInt(process.env.NEXT_PUBLIC_WORLD_ID_GROUP_ID ?? '1');
}

export type RegisterWithWorldIdArgs = {
  root: bigint;
  groupId: bigint;
  nullifierHash: bigint;
  proof: readonly [
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
  ];
};

function hexToUint8Tuple8(proofHex: string): RegisterWithWorldIdArgs['proof'] {
  const hex = proofHex.replace(/^0x/, '');
  const chunk = 64;
  const need = chunk * 8;
  const padded = hex.padEnd(need, '0').slice(0, need);
  const out: bigint[] = [];
  for (let i = 0; i < 8; i++) {
    out.push(BigInt(`0x${padded.slice(i * chunk, (i + 1) * chunk)}`));
  }
  return out as unknown as RegisterWithWorldIdArgs['proof'];
}

/**
 * Convertit une réponse IDKit (après vérification API) en arguments pour
 * `InvoiceRegistry.registerWithWorldId`.
 *
 * Le contrat attend `signalHash = keccak256(abi.encodePacked(msg.sender)) >> 8` :
 * la preuve IDKit doit être demandée avec `orbLegacy({ signal: walletAddress })`.
 */
export function parseRegisterWithWorldIdArgs(
  result: IDKitResult,
): RegisterWithWorldIdArgs {
  const groupId = worldIdGroupId();

  if (result.protocol_version === '3.0') {
    const item = result.responses[0];
    if (!item || !('merkle_root' in item)) {
      throw new Error('Réponse World ID v3 attendue (Orb legacy).');
    }
    const v3 = item as {
      merkle_root: string;
      nullifier: string;
      proof: string;
    };
    const root = BigInt(v3.merkle_root);
    const nullifierHash = BigInt(v3.nullifier);
    let proofHex = v3.proof.trim() as `0x${string}`;
    if (!proofHex.startsWith('0x')) proofHex = `0x${proofHex}`;

    try {
      const decoded = decodeAbiParameters([{ type: 'uint256[8]' }], proofHex);
      const arr = decoded[0] as readonly bigint[];
      if (arr.length !== 8) throw new Error('length');
      return {
        root,
        groupId,
        nullifierHash,
        proof: [...arr] as unknown as RegisterWithWorldIdArgs['proof'],
      };
    } catch {
      return {
        root,
        groupId,
        nullifierHash,
        proof: hexToUint8Tuple8(proofHex),
      };
    }
  }

  if (result.protocol_version === '4.0' && !('session_id' in result)) {
    const item = result.responses[0];
    if (!item || !('proof' in item)) {
      throw new Error('Réponse World ID v4 attendue.');
    }
    const v4 = item as {
      proof: string[];
      nullifier: string;
    };
    if (v4.proof.length < 5) {
      throw new Error('Preuve v4 incomplète (attendu ≥ 5 éléments).');
    }
    const root = BigInt(v4.proof[4]!);
    const nullifierHash = BigInt(v4.nullifier);
    const head = v4.proof
      .slice(0, 4)
      .map((p) => p.replace(/^0x/, '').padStart(64, '0'))
      .join('');
    const proof = hexToUint8Tuple8(head);
    return { root, groupId, nullifierHash, proof };
  }

  throw new Error(
    'Format de preuve non pris en charge (utilisez Orb legacy ou v4 hors session).',
  );
}
