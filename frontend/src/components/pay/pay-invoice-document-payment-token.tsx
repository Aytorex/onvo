'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { useArcScanTokenInfo } from '@/hooks/use-arcscan-token';
import { tokenExplorerUrl, type InvoiceView } from '@/lib/pay-invoice';
import { getTokenMeta, shortAddress } from '@/lib/pay-invoice/format';
import { cn } from '@/lib/utils';

type ArcTokenInfoState = ReturnType<typeof useArcScanTokenInfo>;

export function PayInvoiceDocumentPaymentToken({
  invoice,
  chainId,
  arcTokenInfo,
}: Readonly<{
  invoice: InvoiceView;
  chainId: number;
  arcTokenInfo: ArcTokenInfoState;
}>) {
  const { t } = useTranslation('common');
  const { data: arcData, loading } = arcTokenInfo;
  const tokenUrl = tokenExplorerUrl(chainId, invoice.token);
  const known = getTokenMeta(invoice.token);

  const displayLabel = arcData?.symbol ?? arcData?.name ?? known.symbol;

  return (
    <div
      className={cn(
        'mt-6 flex flex-col gap-2.5 border-t border-border/40 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-medium uppercase tracking-wide text-muted-foreground">
          {t('pay.paymentTokenLabel')}
        </span>
        {loading ? (
          <span className="animate-pulse text-muted-foreground">…</span>
        ) : (
          <>
            <span className="font-semibold text-foreground">
              {displayLabel}
            </span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {shortAddress(invoice.token, 6)}
            </span>
          </>
        )}
      </div>
      {tokenUrl ? (
        <a
          href={tokenUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {t('pay.viewOnArcScan')}
        </a>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          {t('pay.arcScanLinkUnavailable')}
        </p>
      )}
    </div>
  );
}
