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
      <p className="text-center text-sm text-muted-foreground">
        {t('pay.missingToken')}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold tracking-tight">{t('pay.title')}</h1>
      <p className="text-sm text-muted-foreground">{t('pay.tokenReceived')}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-muted/30 p-4 font-mono text-xs leading-relaxed">
        {token}
      </pre>
    </div>
  );
}
