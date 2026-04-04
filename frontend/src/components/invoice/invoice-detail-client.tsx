'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  formatClientPhysicalAddressFromMeta,
  formatEmitterPhysicalAddressFromMeta,
} from '@/lib/invoice-address';
import { InvoiceCommissionPanel } from '@/components/invoice/invoice-commission-panel';
import {
  formatWorldIdNullifierForDisplay,
  readCommissionConfig,
  readInvoice,
  type CommissionConfig,
} from '@/lib/invoice-contract';
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
} from '@/lib/invoice-storage';
import { useWorldID } from '@/lib/worldid';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePublicClient } from 'wagmi';

function statusLabel(s: 0 | 1 | 2, t: (key: string) => string) {
  if (s === 0) return t('invoice.status.pending');
  if (s === 1) return t('invoice.status.paid');
  return t('invoice.status.cancelled');
}

export function InvoiceDetailClient() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const idStr = typeof params.id === 'string' ? params.id : '';
  const invoiceId = idStr ? BigInt(idStr) : undefined;

  const { authReady, isVerified } = useWorldID();
  const publicClient = usePublicClient();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof readInvoice>
  > | null>(null);
  const [commissionConfig, setCommissionConfig] =
    useState<CommissionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invoiceId || !publicClient) {
      setLoading(false);
      return;
    }
    void Promise.all([
      readInvoice(publicClient, invoiceId),
      readCommissionConfig(publicClient).catch(() => null),
    ])
      .then(([inv, cfg]) => {
        setData(inv);
        setCommissionConfig(cfg);
      })
      .catch(() => {
        setData(null);
        setCommissionConfig(null);
      })
      .finally(() => setLoading(false));
  }, [invoiceId, publicClient]);

  const meta = invoiceId ? getInvoiceMeta(invoiceId) : null;

  useEffect(() => {
    if (!authReady) return;
    if (!isVerified) router.replace('/');
  }, [authReady, isVerified, router]);

  if (!authReady) {
    return (
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30"
        aria-busy
        aria-label={t('invoice.detail.loadingSessionAria')}
      />
    );
  }

  if (!isVerified) {
    return (
      <p className="text-muted-foreground">
        <Link href="/" className="text-primary underline">
          {t('invoice.detail.worldIdRequired')}
        </Link>
      </p>
    );
  }

  if (!invoiceId) {
    return <p className="text-destructive">{t('invoice.detail.invalidId')}</p>;
  }

  if (loading) {
    return (
      <p className="text-muted-foreground">{t('invoice.detail.loading')}</p>
    );
  }

  if (!data) {
    return (
      <p className="text-muted-foreground">{t('invoice.detail.notFound')}</p>
    );
  }

  const pdf = getInvoicePdfBase64(invoiceId);
  const registeredOfficeText = meta
    ? formatEmitterPhysicalAddressFromMeta(meta).trim()
    : '';
  const clientRegisteredOfficeText = meta
    ? formatClientPhysicalAddressFromMeta(meta).trim()
    : '';

  const worldIdDisplay =
    data.worldIdNullifierHash !== 0n
      ? formatWorldIdNullifierForDisplay(data.worldIdNullifierHash)
      : (meta?.emitterWorldIdNullifier?.trim() ?? '');

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {formatOnvoInvoiceLabel(invoiceId)}
          </h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground break-all">
            {invoiceId.toString()}
          </p>
        </div>
        <Badge variant="outline">{statusLabel(data.status, t)}</Badge>
      </div>

      <dl className="grid gap-4 rounded-xl border border-border/80 bg-card/50 p-6 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.detail.hashPdf')}
          </dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {data.invoiceHash}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.detail.emitter')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{data.emitter}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.detail.recipient')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{data.recipient}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.detail.amountWei')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{data.amount.toString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t('invoice.detail.token')}</dt>
          <dd className="mt-1 font-mono text-xs">{data.token}</dd>
        </div>
        {data.vatNumber.trim() || meta?.emitterVatNumber?.trim() ? (
          <div>
            <dt className="text-muted-foreground">
              {t('invoice.detail.vatNumber')}
            </dt>
            <dd className="mt-1 font-mono text-sm">
              {(data.vatNumber.trim() || meta?.emitterVatNumber?.trim()) ?? ''}
            </dd>
          </div>
        ) : null}
        {worldIdDisplay ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground">
              {t('invoice.detail.emitterWorldId')}
            </dt>
            <dd className="mt-1 break-all font-mono text-xs">
              {worldIdDisplay}
            </dd>
          </div>
        ) : null}
        {meta ? (
          <>
            <div>
              <dt className="text-muted-foreground">
                {t('invoice.detail.docNumber')}
              </dt>
              <dd className="mt-1">{meta.invoiceNumber}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t('invoice.detail.client')}
              </dt>
              <dd className="mt-1">{meta.clientName}</dd>
            </div>
            {registeredOfficeText ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">
                  {t('invoice.detail.registeredOffice')}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-sm">
                  {registeredOfficeText}
                </dd>
              </div>
            ) : null}
            {clientRegisteredOfficeText ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">
                  {t('invoice.detail.clientRegisteredOffice')}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-sm">
                  {clientRegisteredOfficeText}
                </dd>
              </div>
            ) : null}
          </>
        ) : null}
      </dl>

      {data.status === 0 && commissionConfig ? (
        <InvoiceCommissionPanel
          config={commissionConfig}
          grossAmount={data.amount}
        />
      ) : null}
      {data.status === 0 && !commissionConfig && !loading ? (
        <p className="text-sm text-muted-foreground">
          {t('invoice.commission.unavailable')}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="secondary">
          <Link href="/dashboard">{t('invoice.detail.backDashboard')}</Link>
        </Button>
        <Button asChild>
          <Link href={`/pay/${invoiceId.toString()}`}>
            {t('invoice.detail.payPage')}
          </Link>
        </Button>
        {pdf ? (
          <Button
            variant="outline"
            onClick={() => {
              downloadBase64Pdf(pdf, `invoice-${invoiceId.toString()}.pdf`);
              toast.success(t('invoice.detail.downloadStarted'));
            }}
          >
            {t('invoice.detail.downloadPdf')}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t('invoice.detail.pdfUnavailable')}
          </p>
        )}
      </div>
    </div>
  );
}
