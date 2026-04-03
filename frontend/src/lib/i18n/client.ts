'use client';

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '@/locales/en/common.json';
import frCommon from '@/locales/fr/common.json';

export const defaultNS = 'common';

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
} as const;

export type AppLocale = keyof typeof resources;

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS,
    supportedLngs: ['en', 'fr'],
    interpolation: { escapeValue: false },
  });
}

export default i18next;
