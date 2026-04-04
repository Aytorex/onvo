import type { AppLocale } from '@/lib/i18n/client';

export type LocaleMode = 'device' | AppLocale;

const STORAGE_KEY = 'onvo-locale-mode';

export function readLocaleMode(): LocaleMode {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'device' || stored === 'en' || stored === 'fr') {
    return stored;
  }
  const legacy = localStorage.getItem('i18nextLng');
  if (legacy === 'en' || legacy === 'fr') {
    localStorage.setItem(STORAGE_KEY, legacy);
    return legacy;
  }
  return 'en';
}

export function writeLocaleMode(mode: LocaleMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
}

/** Map browser language tags to a supported app locale; default `en`. */
export function resolveBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'en';
  const list =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const tag of list) {
    const base = tag.split('-')[0]?.toLowerCase();
    if (base === 'fr') return 'fr';
    if (base === 'en') return 'en';
  }
  return 'en';
}

export function resolveActiveLocale(mode: LocaleMode): AppLocale {
  if (mode === 'device') return resolveBrowserLocale();
  return mode;
}
