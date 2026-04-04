'use client';

import { use } from 'react';
import { useTranslation } from 'react-i18next';

export default function PayPage({
  params,
}: Readonly<{
  params: Promise<{ token: string }>;
}>) {
  const { token } = use(params);
  const { t } = useTranslation('common');

  if (!token?.trim()) {
    return (
      <section
        className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8"
        aria-labelledby="pay-heading"
      >
        <h1
          id="pay-heading"
          className="text-xl font-bold tracking-tight text-heading sm:text-2xl"
        >
          {t('pay.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t('pay.missingToken')}
        </p>
      </section>
    );
  }

  return (
    <section
      className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm sm:p-8"
      aria-labelledby="pay-heading"
    >
      <h1
        id="pay-heading"
        className="text-xl font-bold tracking-tight text-heading sm:text-2xl"
      >
        {t('pay.title')}
      </h1>
      <p className="mt-2 text-sm font-semibold text-foreground">
        {t('pay.tokenReceived')}
      </p>
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground">
        {token}
      </pre>
    </section>
  );
}
