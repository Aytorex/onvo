'use client';

import { useEffect, useState } from 'react';

import { arcTestnet } from 'viem/chains';

import {
  fetchArcScanTokenMeta,
  type ArcScanTokenMeta,
} from '@/lib/pay-invoice/explorer';

export function useArcScanTokenInfo(
  tokenAddress: `0x${string}` | undefined,
  chainId: number,
): {
  data: ArcScanTokenMeta | null;
  loading: boolean;
  error: boolean;
} {
  const [data, setData] = useState<ArcScanTokenMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!tokenAddress || chainId !== arcTestnet.id) {
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    void (async () => {
      try {
        const meta = await fetchArcScanTokenMeta(tokenAddress, chainId);
        if (!cancelled) {
          setData(meta);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setData(null);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tokenAddress, chainId]);

  return { data, loading, error };
}
