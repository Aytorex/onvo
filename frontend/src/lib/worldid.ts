'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import type { IDKitResult, RpContext } from '@worldcoin/idkit';

const STORAGE_KEY = 'onvo_worldid_proof';
const COOKIE_NAME = 'onvo_worldid_session';

export const WORLD_ID_CONFIG = {
  app_id: (process.env.NEXT_PUBLIC_WORLD_APP_ID ?? '') as `app_${string}`,
  rp_id: (process.env.NEXT_PUBLIC_WORLD_RP_ID ?? '') as `rp_${string}`,
  action: 'onvo-create-invoice',
  environment: 'staging' as const,
} as const;

export interface WorldIDProof {
  result: IDKitResult;
  verifiedAt: number;
  nullifier: string;
}

function getStoredProof(): WorldIDProof | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorldIDProof;
  } catch {
    return null;
  }
}

/**
 * In-memory cache so each new `useWorldID()` mount (e.g. /dashboard → /invoice/[id])
 * reads a verified session on the first render — avoids `isVerified === false` flash
 * and spurious `router.replace('/')`.
 */
let memoryProof: WorldIDProof | null | undefined;

function readProofForInitialState(): WorldIDProof | null {
  if (typeof window === 'undefined') return null;
  if (memoryProof !== undefined) return memoryProof;
  memoryProof = getStoredProof();
  return memoryProof;
}

function setMemoryProof(next: WorldIDProof | null): void {
  memoryProof = next;
}

function setStoredProof(proof: WorldIDProof): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(proof));
}

function clearStoredProof(): void {
  localStorage.removeItem(STORAGE_KEY);
  setMemoryProof(null);
}

function setSessionCookie(value: string): void {
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

function clearSessionCookie(): void {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export async function fetchRpContext(): Promise<RpContext> {
  const res = await fetch('/api/rp-signature', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: WORLD_ID_CONFIG.action }),
  });

  if (!res.ok) throw new Error('Failed to fetch RP signature');

  const data = (await res.json()) as {
    sig: string;
    nonce: string;
    created_at: number;
    expires_at: number;
  };

  return {
    rp_id: WORLD_ID_CONFIG.rp_id,
    nonce: data.nonce,
    created_at: data.created_at,
    expires_at: data.expires_at,
    signature: data.sig,
  };
}

export async function verifyProof(result: IDKitResult): Promise<boolean> {
  const res = await fetch('/api/verify-worldid', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      rp_id: WORLD_ID_CONFIG.rp_id,
      idkitResponse: result,
    }),
  });

  return res.ok;
}

function extractNullifier(result: IDKitResult): string {
  const firstResponse = result.responses?.[0];
  if (!firstResponse) return '';
  if ('nullifier' in firstResponse) {
    return firstResponse.nullifier as string;
  }
  return '';
}

export function useWorldID() {
  const router = useRouter();
  const { address } = useAccount();
  const [proof, setProof] = useState<WorldIDProof | null>(() =>
    readProofForInitialState(),
  );
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  /** False until client has synced `localStorage` (avoids SSR/hydration redirect flicker). */
  const [authReady, setAuthReady] = useState(
    typeof window === 'undefined',
  );

  useLayoutEffect(() => {
    const stored = getStoredProof();
    setMemoryProof(stored);
    setProof(stored);
    setAuthReady(true);
  }, []);

  const isVerified = proof !== null;

  /** Connected wallet — use as `emitter` for `createInvoice` and localStorage keys. */
  const worldAddress = address ?? null;
  const nullifier = proof?.nullifier ?? null;

  const verify = useCallback(() => {
    setIsWidgetOpen(true);
  }, []);

  const handleVerifyResult = useCallback(async (result: IDKitResult) => {
    const valid = await verifyProof(result);
    if (!valid) throw new Error('Proof verification failed');
  }, []);

  const handleSuccess = useCallback(
    (result: IDKitResult) => {
      const nullifier = extractNullifier(result);
      const proofData: WorldIDProof = {
        result,
        verifiedAt: Date.now(),
        nullifier,
      };

      setStoredProof(proofData);
      setMemoryProof(proofData);
      setSessionCookie(nullifier || 'verified');
      setProof(proofData);
      setIsWidgetOpen(false);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(() => {
    clearStoredProof();
    setMemoryProof(null);
    clearSessionCookie();
    setProof(null);
    router.push('/');
  }, [router]);

  return {
    isVerified,
    worldAddress,
    nullifier,
    proof,
    verify,
    logout,
    isWidgetOpen,
    setIsWidgetOpen,
    handleVerifyResult,
    handleSuccess,
  } as const;
}
