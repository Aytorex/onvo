import type { IDKitResult } from '@worldcoin/idkit';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') ||
  'http://localhost:3001';

/**
 * Sends the World ID proof + emitter address to the backend.
 * The backend verifies the proof via `POST /api/v4/verify/{rp_id}`,
 * then calls `registerEmitter(emitter, nullifierHash)` on-chain as the trusted verifier.
 */
export async function registerEmitterViaBackend(
  result: IDKitResult,
  emitterAddress: string,
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/worldid/register-emitter`, {
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
