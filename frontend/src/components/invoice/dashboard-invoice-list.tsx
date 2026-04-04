'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InvoiceStatusBadge } from '@/components/invoice/invoice-status-badge';
import {
  formatOnvoInvoiceLabel,
  formatOnvoInvoiceLabelDisplay,
} from '@/lib/invoice-id';
import type { InvoiceRowView } from '@/lib/invoice-types';
import {
  filterInvoiceRows,
  formatInvoiceTokenAmount,
  type InvoiceListStatusFilter,
  shortAddr,
  tokenSymbolForAddress,
} from '@/lib/invoice-row-display';
import {
  Copy,
  Eye,
  FileDown,
  Link2,
  MoreVertical,
  Plus,
  Search,
  X,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

function InvoiceIdTruncateCopy({
  fullLabel,
  displayLabel,
}: {
  fullLabel: string;
  displayLabel: string;
}) {
  const { t } = useTranslation('common');
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [truncated, setTruncated] = useState(false);

  /** Référence complète (`formatOnvoInvoiceLabel`), pas le uint256 décimal. */
  const copyValue = fullLabel;

  const updateTruncated = useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useLayoutEffect(() => {
    updateTruncated();
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(updateTruncated);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayLabel, updateTruncated]);

  const onCopy = () => {
    void navigator.clipboard.writeText(copyValue).then(
      () => {
        toast.success(t('invoice.dashboard.copyInvoiceIdSuccess'));
      },
      () => {
        toast.error(t('invoice.dashboard.copyInvoiceIdError'));
      },
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 w-full max-w-[min(100%,14rem)] items-center gap-0.5 sm:max-w-[min(100%,18rem)]"
    >
      <span
        ref={textRef}
        className="min-w-0 flex-1 truncate font-mono text-xs"
        title={fullLabel}
      >
        {displayLabel}
      </span>
      {truncated ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onCopy}
          aria-label={t('invoice.dashboard.copyInvoiceIdAria')}
          title={t('invoice.dashboard.copyInvoiceId')}
        >
          <Copy className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}

export function DashboardInvoiceList({
  rows,
  loading,
  actionsSlot,
  onExportPdf,
  onCancel,
  isCancelPending,
}: {
  rows: InvoiceRowView[];
  loading: boolean;
  actionsSlot: ReactNode;
  onExportPdf: (invoiceId: bigint) => void;
  onCancel: (invoiceId: bigint) => void;
  isCancelPending: boolean;
}) {
  const { t } = useTranslation('common');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceListStatusFilter>('all');

  const filtered = useMemo(
    () => filterInvoiceRows(rows, search, status),
    [rows, search, status],
  );

  const hasActiveFilters = search.trim().length > 0 || status !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <p className="max-w-xl text-muted-foreground text-sm">
          {t('invoice.dashboard.invoiceListLead')}
        </p>
        {actionsSlot}
      </div>

      {!loading && rows.length > 0 ? (
        <div
          className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/30 p-4 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center"
          role="search"
          aria-label={t('invoice.dashboard.filtersAria')}
        >
          <div className="relative min-w-[min(100%,280px)] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('invoice.dashboard.filterSearchPlaceholder')}
              className="border-border/80 bg-background/80 pl-9"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as InvoiceListStatusFilter)}
            >
              <SelectTrigger
                className="w-full border-border/80 bg-background/80 sm:w-[220px]"
                aria-label={t('invoice.dashboard.filterStatusLabel')}
              >
                <SelectValue
                  placeholder={t('invoice.dashboard.filterStatusAll')}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('invoice.dashboard.filterStatusAll')}
                </SelectItem>
                <SelectItem value="pending">
                  {t('invoice.status.pending')}
                </SelectItem>
                <SelectItem value="paid">{t('invoice.status.paid')}</SelectItem>
                <SelectItem value="cancelled">
                  {t('invoice.status.cancelled')}
                </SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1 text-muted-foreground"
                onClick={clearFilters}
              >
                <X className="size-4" aria-hidden />
                {t('invoice.dashboard.clearFilters')}
              </Button>
            ) : null}
          </div>
          <p className="w-full text-muted-foreground text-xs sm:ml-auto sm:w-auto sm:text-right">
            {t('invoice.dashboard.listCount', {
              shown: filtered.length,
              total: rows.length,
            })}
          </p>
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">
          {t('invoice.dashboard.loading')}
        </p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
            <Link2 className="size-6" aria-hidden />
          </div>
          <p className="mt-4 text-muted-foreground text-sm">
            {t('invoice.dashboard.emptyState')}
          </p>
          <Button className="mt-6 gap-2" asChild>
            <Link href="/invoice/new">
              <Plus className="size-4 shrink-0" aria-hidden />
              {t('invoice.dashboard.newInvoice')}
            </Link>
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-muted/10 px-6 py-10 text-center">
          <p className="font-medium text-foreground">
            {t('invoice.dashboard.noFilterResults')}
          </p>
          <p className="mt-2 text-muted-foreground text-sm">
            {t('invoice.dashboard.noFilterResultsHint')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={clearFilters}
          >
            {t('invoice.dashboard.clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="whitespace-nowrap">
                  {t('invoice.dashboard.colId')}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t('invoice.dashboard.colInvoiceNumber')}
                </TableHead>
                <TableHead>{t('invoice.dashboard.colClient')}</TableHead>
                <TableHead className="whitespace-nowrap">
                  {t('invoice.dashboard.colRecipient')}
                </TableHead>
                <TableHead className="whitespace-nowrap text-right">
                  {t('invoice.dashboard.colAmount')}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t('invoice.dashboard.colStatus')}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  {t('invoice.dashboard.colActions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const sym = tokenSymbolForAddress(r.token);
                const amt = formatInvoiceTokenAmount(r.amount, r.token);
                const clientLabel =
                  r.meta?.clientName?.trim() ||
                  t('invoice.dashboard.clientUnknown');
                return (
                  <TableRow
                    key={r.invoiceId.toString()}
                    className="group border-border/60"
                  >
                    <TableCell className="align-top min-w-0 max-w-[min(100vw,20rem)]">
                      <InvoiceIdTruncateCopy
                        fullLabel={formatOnvoInvoiceLabel(r.invoiceId)}
                        displayLabel={formatOnvoInvoiceLabelDisplay(
                          r.invoiceId,
                        )}
                      />
                    </TableCell>
                    <TableCell className="align-top text-sm">
                      {r.meta?.invoiceNumber ? (
                        <span className="font-medium">
                          {r.meta.invoiceNumber}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      <span className="font-medium">{clientLabel}</span>
                      {r.meta?.clientEmail ? (
                        <p className="mt-0.5 truncate text-muted-foreground text-xs">
                          {r.meta.clientEmail}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="align-top font-mono text-xs">
                      {shortAddr(r.recipient)}
                    </TableCell>
                    <TableCell className="align-top text-right font-medium text-sm tabular-nums">
                      {amt} <span className="text-muted-foreground">{sym}</span>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">
                      <InvoiceStatusBadge status={r.status} t={t} />
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-foreground"
                            aria-label={t('invoice.dashboard.rowActionsAria')}
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="min-w-[10rem]"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/invoice/${r.invoiceId.toString()}`}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <Eye className="size-4 opacity-70" aria-hidden />
                              {t('invoice.dashboard.view')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2"
                            onSelect={() => onExportPdf(r.invoiceId)}
                          >
                            <FileDown
                              className="size-4 opacity-70"
                              aria-hidden
                            />
                            {t('invoice.dashboard.export')}
                          </DropdownMenuItem>
                          {r.status === 0 ? (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
                                disabled={isCancelPending}
                                onSelect={() => onCancel(r.invoiceId)}
                              >
                                <XCircle
                                  className="size-4 opacity-80"
                                  aria-hidden
                                />
                                {t('invoice.dashboard.cancel')}
                              </DropdownMenuItem>
                            </>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
