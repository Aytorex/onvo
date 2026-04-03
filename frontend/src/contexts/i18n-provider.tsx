'use client';

import i18n from '@/lib/i18n/client';
import { I18nextProvider } from 'react-i18next';
import { useEffect } from 'react';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const stored = localStorage.getItem('i18nextLng');
    if (stored === 'fr' || stored === 'en') {
      void i18n.changeLanguage(stored);
    }
  }, []);

  useEffect(() => {
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

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
