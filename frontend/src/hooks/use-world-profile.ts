'use client';

import { MiniKit } from '@worldcoin/minikit-js';
import { useEffect, useState } from 'react';

export type WorldIssuerProfile = {
  username: string | null;
  profilePictureUrl: string | null;
  walletAddress: string;
};

export function useWorldProfileByAddress(address: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<WorldIssuerProfile | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!address?.length) {
      setLoading(false);
      setProfile(null);
      setFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setProfile(null);

    void MiniKit.getUserByAddress(address)
      .then((p) => {
        if (cancelled) return;
        setProfile({
          username: p.username ?? null,
          profilePictureUrl: p.profilePictureUrl ?? null,
          walletAddress: p.walletAddress,
        });
        setFailed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        setFailed(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [address]);

  return { loading, profile, failed };
}
