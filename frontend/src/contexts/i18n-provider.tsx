'use client';

import i18n from '@/lib/i18n/client';
import {
  readLocaleMode,
  resolveActiveLocale,
  writeLocaleMode,
  type LocaleMode,
} from '@/lib/i18n/locale-mode';
import { I18nextProvider } from 'react-i18next';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

type LocalePreferenceContextValue = {
  localeMode: LocaleMode;
  setLocaleMode: (mode: LocaleMode) => void;
};

const LocalePreferenceContext =
  createContext<LocalePreferenceContextValue | null>(null);

export function useLocalePreference(): LocalePreferenceContextValue {
  const ctx = useContext(LocalePreferenceContext);
  if (!ctx) {
    throw new Error('useLocalePreference must be used within I18nProvider');
  }
  return ctx;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [localeMode, setLocaleModeState] = useState<LocaleMode>('en');

  useLayoutEffect(() => {
    const m = readLocaleMode();
    setLocaleModeState(m);
    void i18n.changeLanguage(resolveActiveLocale(m));
  }, []);

  const setLocaleMode = useCallback((mode: LocaleMode) => {
    writeLocaleMode(mode);
    setLocaleModeState(mode);
    void i18n.changeLanguage(resolveActiveLocale(mode));
  }, []);

  const preference = useMemo(
    () => ({ localeMode, setLocaleMode }),
    [localeMode, setLocaleMode],
  );

  useLayoutEffect(() => {
    const sync = (lng: string) => {
      const short = lng.startsWith('fr') ? 'fr' : 'en';
      document.documentElement.lang = short;
      localStorage.setItem('i18nextLng', short);
      document.title = i18n.t('meta.title');
    };
    sync(i18n.language);
    i18n.on('languageChanged', sync);
    return () => {
      i18n.off('languageChanged', sync);
    };
  }, []);

  return (
    <LocalePreferenceContext.Provider value={preference}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </LocalePreferenceContext.Provider>
  );
}
