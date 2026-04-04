import { MiniKit } from '@worldcoin/minikit-js';

/**
 * Universal link to open this app’s mini app in World App.
 * @see https://docs.world.org/mini-apps/quick-start/installing
 */
export function getWorldMiniAppUrl(path: string): string | null {
  const appId = process.env.NEXT_PUBLIC_WORLD_MINI_APP_ID;
  if (!appId?.trim()) {
    return null;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return MiniKit.getMiniAppUrl(appId, normalized);
}
