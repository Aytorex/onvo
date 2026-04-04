'use client';

import { DashboardHomeView } from '@/components/invoice/dashboard-home';
import { DashboardInvoiceList } from '@/components/invoice/dashboard-invoice-list';
import { Button } from '@/components/ui/button';
import { arcTestnet } from '@/lib/arc-chain';
import { invoiceRegistryContract } from '@/lib/contract';
import { readInvoice } from '@/lib/invoice-contract';
import { exportInvoicesCSV } from '@/lib/invoice-csv';
import {
  downloadBase64Pdf,
  getInvoiceMeta,
  getInvoicePdfBase64,
  getStoredInvoiceIds,
} from '@/lib/invoice-storage';
import type { InvoiceRowView } from '@/lib/invoice-types';
import { applyDuplicataWatermarkToPdfBase64 } from '@/lib/pdf-duplicata-watermark';
import { useWorldID } from '@/lib/worldid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';

export type DashboardClientVariant = 'home' | 'invoices';

export function DashboardClient({
  variant = 'home',
}: {
  variant?: DashboardClientVariant;
}) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const {
    authReady,
    isVerified,
    nullifier: sessionWorldIdNullifier,
  } = useWorldID();
  const { address, isConnected } = useAccount();
  const registryChainId = invoiceRegistryContract.chainId ?? arcTestnet.id;
  const publicClientArc = usePublicClient({ chainId: registryChainId });
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending: isCancelPending } = useWriteContract();

  const [rows, setRows] = useState<InvoiceRowView[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!address || !publicClientArc) {
      setRows([]);
      setLoading(false);
      return;
    }
    const ids = getStoredInvoiceIds(address, sessionWorldIdNullifier);
    const next: InvoiceRowView[] = [];
    for (const id of ids) {
      try {
        const inv = await readInvoice(publicClientArc, id);
        if (inv.emitter.toLowerCase() !== address.toLowerCase()) continue;
        const meta = getInvoiceMeta(id);
        next.push({
          invoiceId: id,
          recipient: inv.recipient,
          amount: inv.amount,
          token: inv.token,
          status: inv.status,
          invoiceHash: inv.invoiceHash,
          emitter: inv.emitter,
          meta,
        });
      } catch {
        /* skip missing on-chain */
      }
    }
    next.sort((a, b) => (a.invoiceId < b.invoiceId ? 1 : -1));
    setRows(next);
    setLoading(false);
  }, [address, publicClientArc, sessionWorldIdNullifier]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authReady) return;
    if (!isVerified) router.replace('/');
  }, [authReady, isVerified, router]);

  const onCancel = async (invoiceId: bigint) => {
    if (!address) return;
    try {
      await switchChainAsync({ chainId: registryChainId });
    } catch {
      toast.error(t('invoice.toast.arcNetworkRequired'));
      return;
    }
    try {
      await writeContractAsync({
        address: invoiceRegistryContract.address,
        abi: invoiceRegistryContract.abi,
        functionName: 'cancelInvoice',
        args: [invoiceId],
        chainId: registryChainId,
      });
      toast.success(t('invoice.toast.cancelSent'));
      await load();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t('invoice.toast.cancelFailed'),
      );
    }
  };

  const exportPdf = useCallback(
    (invoiceId: bigint) => {
      void (async () => {
        const b64 = getInvoicePdfBase64(invoiceId);
        if (!b64) {
          toast.error(t('invoice.toast.pdfNotStored'));
          return;
        }
        try {
          const stamped = await applyDuplicataWatermarkToPdfBase64(b64);
          downloadBase64Pdf(
            stamped,
            `invoice-${invoiceId.toString()}-duplicata.pdf`,
          );
          toast.success(t('invoice.detail.downloadStarted'));
        } catch (e) {
          console.error(e);
          toast.error(t('invoice.detail.downloadWatermarkFailed'));
        }
      })();
    },
    [t],
  );

  if (!authReady) {
    return (
      <div
        className="min-h-[40vh] animate-pulse rounded-xl bg-muted/30 p-4"
        aria-busy
        aria-label={t('invoice.dashboard.loadingSessionAria')}
      />
    );
  }

  if (!isVerified) {
    return (
      <p className="p-4 text-center text-muted-foreground">
        <Link href="/" className="text-primary underline">
          {t('invoice.dashboard.connectWorldIdLink')}
        </Link>
      </p>
    );
  }

  const actionsRow = (
    <div className="flex flex-wrap gap-2 shrink-0">
      <Button variant="default" asChild>
        <Link href="/invoice/new">{t('invoice.dashboard.newInvoice')}</Link>
      </Button>
      <Button
        variant="outline"
        disabled={rows.length === 0}
        onClick={() => exportInvoicesCSV(rows)}
      >
        {t('invoice.dashboard.exportAllCsv')}
      </Button>
    </div>
  );

  if (variant === 'invoices') {
    return (
      <div className="space-y-8 p-4">
        {!isConnected ? (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            {t('invoice.dashboard.connectWalletHint')}
          </p>
        ) : null}

        <DashboardInvoiceList
          rows={rows}
          loading={loading}
          actionsSlot={actionsRow}
          onExportPdf={exportPdf}
          onCancel={(invoiceId) => void onCancel(invoiceId)}
          isCancelPending={isCancelPending}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <DashboardHomeView
        rows={rows}
        loading={loading}
        alertsSlot={
          !isConnected ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              {t('invoice.dashboard.connectWalletHint')}
            </p>
          ) : null
        }
        onExportAllCsv={() => exportInvoicesCSV(rows)}
        exportDisabled={rows.length === 0}
        onCancel={(invoiceId) => void onCancel(invoiceId)}
        onExportPdf={exportPdf}
        isCancelPending={isCancelPending}
      />
    </div>
  );
}
