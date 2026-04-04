import type { IDKitResult } from '@worldcoin/idkit';

/**
 * Sends the World ID proof + emitter address to the Next.js API route.
 * The server verifies the proof via `POST /api/v4/verify/{rp_id}`,
 * then calls `registerEmitter(emitter, nullifierHash)` on-chain as the trusted verifier.
 */
export async function registerEmitterViaBackend(
  result: IDKitResult,
  emitterAddress: string,
): Promise<void> {
  const res = await fetch('/api/worldid/register-emitter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      emitterAddress,
      idkitResult: result,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ||
        `Registration failed (${res.status})`,
    );
  }
}
