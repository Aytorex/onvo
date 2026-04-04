'use client';

import { Button } from '@/components/ui/button';
import { InvoiceCommissionPanel } from '@/components/invoice/invoice-commission-panel';
import { InvoiceStatusBadge } from '@/components/invoice/invoice-status-badge';
import { InvoicePreviewDocument } from '@/components/invoice/invoice-preview';
import {
  formatWorldIdAddressForDisplay,
  readCommissionConfig,
  readInvoice,
  type CommissionConfig,
} from '@/lib/invoice-contract';
import {
  formatOnvoInvoiceLabel,
  invoiceIdToUrlSegment,
  parseInvoiceIdRouteParam,
} from '@/lib/invoice-id';
import { invoiceMetaToFormValues } from '@/lib/invoice-meta-to-form';
import { applyDuplicataWatermarkToPdfBase64 } from '@/lib/pdf-duplicata-watermark';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
} from '@/lib/invoice-storage';
import { useWorldID } from '@/lib/worldid';
import { ArrowLeft, Copy, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { isAddressEqual, zeroAddress } from 'viem';
import { usePublicClient } from 'wagmi';

export function InvoiceDetailClient() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const params = useParams();
  const idStr = typeof params.id === 'string' ? params.id : '';
  const parsedRoute = idStr ? parseInvoiceIdRouteParam(idStr) : null;
  const invoiceId = parsedRoute ?? undefined;
  const previewRef = useRef<HTMLDivElement>(null);

  const { authReady, isVerified } = useWorldID();
  const publicClient = usePublicClient();
  const [data, setData] = useState<Awaited<
    ReturnType<typeof readInvoice>
  > | null>(null);
  const [commissionConfig, setCommissionConfig] =
    useState<CommissionConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfDownloadPending, setPdfDownloadPending] = useState(false);

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
  const previewValues = meta ? invoiceMetaToFormValues(meta) : null;

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
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30 p-4"
        aria-busy
        aria-label={t('invoice.detail.loadingSessionAria')}
      />
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

  const worldIdDisplay = !isAddressEqual(data.worldIdAddress, zeroAddress)
    ? formatWorldIdAddressForDisplay(data.worldIdAddress)
    : (meta?.emitterWorldIdNullifier?.trim() ?? '');

  const worldIdForPreview =
    meta?.emitterWorldIdNullifier?.trim() ||
    (!isAddressEqual(data.worldIdAddress, zeroAddress)
      ? formatWorldIdAddressForDisplay(data.worldIdAddress)
      : '');

  const invoiceLabelFull = formatOnvoInvoiceLabel(invoiceId);

  return (
    <div className="p-4 space-y-8">
      <div className="flex w-full items-center justify-between gap-2">
        <Button asChild variant="secondary">
          <Link href="/dashboard/invoices" className="gap-2">
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {t('invoice.detail.back')}
          </Link>
        </Button>
        <div className="flex items-center gap-4">
          <Button variant="default" asChild>
            <Link
              href={`/pay/${invoiceIdToUrlSegment(invoiceId)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
              {t('invoice.detail.payPage')}
            </Link>
          </Button>
          {pdf ? (
            <Button
              variant="outline"
              disabled={pdfDownloadPending}
              onClick={() => {
                void (async () => {
                  setPdfDownloadPending(true);
                  try {
                    const stamped =
                      await applyDuplicataWatermarkToPdfBase64(pdf);
                    downloadBase64Pdf(
                      stamped,
                      `invoice-${invoiceId.toString()}-duplicata.pdf`,
                    );
                    toast.success(t('invoice.detail.downloadStarted'));
                  } catch (e) {
                    console.error(e);
                    toast.error(t('invoice.detail.downloadWatermarkFailed'));
                  } finally {
                    setPdfDownloadPending(false);
                  }
                })();
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex min-w-0 max-w-full flex-wrap items-start gap-2">
            <h2
              className="min-w-0 flex-1 break-all text-2xl font-semibold tracking-tight"
              title={invoiceLabelFull}
            >
              {invoiceLabelFull}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={t('invoice.detail.copyInvoiceLabelAria')}
              title={t('invoice.detail.copyInvoiceLabel')}
              onClick={() => {
                void navigator.clipboard.writeText(invoiceLabelFull).then(
                  () => {
                    toast.success(t('invoice.detail.copyInvoiceLabelSuccess'));
                  },
                  () => {
                    toast.error(t('invoice.detail.copyInvoiceLabelError'));
                  },
                );
              }}
            >
              <Copy className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
        <InvoiceStatusBadge status={data.status} t={t} />
      </div>

      {previewValues ? (
        <InvoicePreviewDocument
          values={previewValues}
          previewRef={previewRef}
          emitterWorldIdNullifier={worldIdForPreview || null}
          publishedDocumentNo={
            meta?.invoiceNumber?.trim() || formatOnvoInvoiceLabel(invoiceId)
          }
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {t('invoice.detail.storedMetaMissing')}
          </p>
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
              <dd className="mt-1 font-mono text-xs">
                {data.amount.toString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t('invoice.detail.token')}
              </dt>
              <dd className="mt-1 font-mono text-xs">{data.token}</dd>
            </div>
            {data.vatNumber.trim() ? (
              <div>
                <dt className="text-muted-foreground">
                  {t('invoice.detail.vatNumber')}
                </dt>
                <dd className="mt-1 font-mono text-sm">
                  {data.vatNumber.trim()}
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
          </dl>
        </>
      )}

      {previewValues ? (
        <details className="rounded-xl border border-border/80 bg-card/30 text-sm">
          <summary className="cursor-pointer list-none px-4 py-3 font-medium text-foreground hover:bg-muted/30 [&::-webkit-details-marker]:hidden">
            {t('invoice.detail.onChainDetailsSummary')}
          </summary>
          <dl className="grid gap-4 border-t border-border/60 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
              <dd className="mt-1 font-mono text-xs">
                {data.amount.toString()}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {t('invoice.detail.token')}
              </dt>
              <dd className="mt-1 font-mono text-xs">{data.token}</dd>
            </div>
            {data.vatNumber.trim() ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">
                  {t('invoice.detail.vatNumber')}
                </dt>
                <dd className="mt-1 font-mono text-sm">
                  {data.vatNumber.trim()}
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
          </dl>
        </details>
      ) : null}

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
    </div>
  );
}
