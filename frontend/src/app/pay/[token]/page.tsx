'use client';

import { InvoiceCommissionPanel } from '@/components/invoice/invoice-commission-panel';
import {
  formatWorldIdNullifierForDisplay,
  readCommissionConfig,
  readInvoice,
  type CommissionConfig,
} from '@/lib/invoice-contract';
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import { use, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublicClient } from 'wagmi';

export default function PayPage({
  params,
}: Readonly<{
  params: Promise<{ token: string }>;
}>) {
  const { token } = use(params);
  const { t } = useTranslation('common');
  const publicClient = usePublicClient();

  const trimmedToken = token?.trim() ?? '';

  let packedLabel: string | null = null;
  let invoiceId: bigint | undefined;
  if (trimmedToken !== '') {
    try {
      invoiceId = BigInt(trimmedToken);
      packedLabel = formatOnvoInvoiceLabel(invoiceId);
    } catch {
      packedLabel = null;
      invoiceId = undefined;
    }
  }

  const [invoice, setInvoice] = useState<Awaited<
    ReturnType<typeof readInvoice>
  > | null>(null);
  const [commissionConfig, setCommissionConfig] =
    useState<CommissionConfig | null>(null);
  const [chainLoading, setChainLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId || !publicClient) {
      setInvoice(null);
      setCommissionConfig(null);
      return;
    }
    setChainLoading(true);
    void Promise.all([
      readInvoice(publicClient, invoiceId).catch(() => null),
      readCommissionConfig(publicClient).catch(() => null),
    ])
      .then(([inv, cfg]) => {
        setInvoice(inv);
        setCommissionConfig(cfg);
      })
      .finally(() => setChainLoading(false));
  }, [invoiceId, publicClient]);

  if (!trimmedToken) {
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
      {packedLabel ? (
        <p className="mt-3 font-mono text-sm text-foreground">{packedLabel}</p>
      ) : (
        <p className="mt-3 text-sm text-destructive">{t('pay.invalidToken')}</p>
      )}
      <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-muted/50 p-4 font-mono text-xs leading-relaxed text-foreground">
        {trimmedToken}
      </pre>

      {invoiceId && publicClient ? (
        <div className="mt-8 space-y-4">
          {chainLoading ? (
            <p className="text-sm text-muted-foreground">{t('pay.loading')}</p>
          ) : null}
          {!chainLoading && !invoice ? (
            <p className="text-sm text-muted-foreground">{t('pay.notFound')}</p>
          ) : null}
          {!chainLoading && invoice && invoice.worldIdNullifierHash !== 0n ? (
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
              <h2 className="font-semibold text-foreground">
                {t('pay.emitterWorldId')}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('pay.emitterWorldIdHint')}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-foreground">
                {formatWorldIdNullifierForDisplay(invoice.worldIdNullifierHash)}
              </p>
            </div>
          ) : null}
          {!chainLoading &&
          invoice &&
          invoice.status === 0 &&
          commissionConfig ? (
            <InvoiceCommissionPanel
              config={commissionConfig}
              grossAmount={invoice.amount}
            />
          ) : null}
          {!chainLoading &&
          invoice &&
          invoice.status === 0 &&
          !commissionConfig ? (
            <p className="text-sm text-muted-foreground">
              {t('invoice.commission.unavailable')}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
