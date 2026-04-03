'use client';

import { useData } from '@/hooks/useData';
import { type ReactNode } from 'react';

export function BallotDataStoreSync({ children }: { children: ReactNode }) {
  useData();
  return children;
}
