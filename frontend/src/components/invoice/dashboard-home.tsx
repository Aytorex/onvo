'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatOnvoInvoiceLabel } from '@/lib/invoice-id';
import type { InvoiceRowView } from '@/lib/invoice-types';
import {
  formatInvoiceTokenAmount,
  shortAddr,
  tokenSymbolForAddress,
} from '@/lib/invoice-row-display';
import { cn } from '@/lib/utils';
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Sparkles,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

function statusBadge(
  status: 0 | 1 | 2,
  t: (key: string) => string,
  compact?: boolean,
) {
  const base = compact ? 'text-[10px] uppercase tracking-wider' : '';
  if (status === 0)
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300',
          base,
        )}
      >
        {t('invoice.status.pending')}
      </Badge>
    );
  if (status === 1)
    return (
      <Badge
        variant="outline"
        className={cn(
          'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
          base,
        )}
      >
        {t('invoice.status.paid')}
      </Badge>
    );
  return (
    <Badge variant="secondary" className={cn('text-muted-foreground', base)}>
      {t('invoice.status.cancelled')}
    </Badge>
  );
}

function DecorativeInvoiceStack() {
  return (
    <div
      className="relative mx-auto hidden h-[220px] w-full max-w-[280px] lg:block"
      aria-hidden
    >
      <div className="absolute right-2 top-0 w-[92%] rotate-[6deg] rounded-2xl border border-border/60 bg-gradient-to-br from-card/90 to-card/40 p-4 shadow-lg backdrop-blur-sm">
        <div className="h-2 w-1/3 rounded-full bg-primary/30" />
        <div className="mt-3 space-y-2">
          <div className="h-1.5 w-full rounded-full bg-muted/80" />
          <div className="h-1.5 w-4/5 rounded-full bg-muted/60" />
        </div>
      </div>
      <div className="absolute right-6 top-10 w-[92%] rotate-[-2deg] rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card/80 to-card/50 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20" />
          <div className="flex-1 space-y-1.5">
            <div className="h-2 w-2/3 rounded-full bg-foreground/20" />
            <div className="h-1.5 w-1/2 rounded-full bg-muted-foreground/30" />
          </div>
        </div>
        <div className="mt-4 h-px w-full bg-border/60" />
        <div className="mt-3 flex justify-between">
          <div className="h-2 w-16 rounded-full bg-emerald-500/30" />
          <div className="h-2 w-12 rounded-full bg-muted/70" />
        </div>
      </div>
      <div className="absolute right-10 top-[8.5rem] w-[88%] rotate-[-5deg] rounded-2xl border border-border/50 bg-card/70 p-3 shadow-md backdrop-blur-sm">
        <div className="h-1.5 w-full rounded-full bg-muted/70" />
        <div className="mt-2 h-1.5 w-3/4 rounded-full bg-muted/50" />
      </div>
    </div>
  );
}

export function DashboardHomeView({
  rows,
  loading,
  alertsSlot,
  onExportAllCsv,
  exportDisabled,
  onCancel,
  onExportPdf,
  isCancelPending,
}: {
  rows: InvoiceRowView[];
  loading: boolean;
  alertsSlot?: ReactNode;
  onExportAllCsv: () => void;
  exportDisabled: boolean;
  onCancel: (invoiceId: bigint) => void;
  onExportPdf: (invoiceId: bigint) => void;
  isCancelPending: boolean;
}) {
  const { t } = useTranslation('common');
  const [greetingKey, setGreetingKey] = useState(
    'invoice.dashboard.greetingDay',
  );

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreetingKey('invoice.dashboard.greetingMorning');
    else if (h < 18) setGreetingKey('invoice.dashboard.greetingAfternoon');
    else setGreetingKey('invoice.dashboard.greetingEvening');
  }, []);

  const pendingCount = rows.filter((r) => r.status === 0).length;
  const paidCount = rows.filter((r) => r.status === 1).length;
  const cancelledCount = rows.filter((r) => r.status === 2).length;
  const recent = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <div className="relative">
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <div className="absolute -left-[20%] -top-[10%] h-[min(520px,80vw)] w-[min(520px,80vw)] rounded-full bg-primary/[0.12] blur-[100px] dark:bg-primary/[0.18]" />
        <div className="absolute -right-[15%] top-[15%] h-[min(440px,70vw)] w-[min(440px,70vw)] rounded-full bg-cyan-500/[0.08] blur-[90px]" />
        <div className="absolute bottom-0 left-1/3 h-[min(360px,60vw)] w-[min(360px,60vw)] rounded-full bg-violet-500/[0.06] blur-[80px]" />
      </div>

      <div className="space-y-10">
        {alertsSlot}
        <section
          className={cn(
            'relative overflow-hidden rounded-3xl border border-border/70',
            'bg-gradient-to-br from-card/95 via-card/80 to-primary/[0.07]',
            'shadow-[0_24px_80px_-32px_hsl(var(--primary)/0.45)]',
            'before:pointer-events-none before:absolute before:inset-0 before:rounded-3xl',
            'before:bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,hsl(var(--primary)/0.12),transparent_55%)]',
          )}
        >
          <div className="relative grid gap-10 p-8 md:grid-cols-[1fr_minmax(0,320px)] md:p-10 lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden />
                {t(greetingKey)}
              </div>
              <h1 className="mt-4 text-balance font-semibold tracking-tight text-heading text-3xl md:text-4xl lg:text-[2.35rem] lg:leading-tight">
                {t('invoice.dashboard.headline')}
              </h1>
              <p className="mt-3 max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed md:text-base">
                {t('invoice.dashboard.subtitle')}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" className="gap-2" asChild>
                  <Link href="/invoice/new">
                    <Plus className="size-4 shrink-0" aria-hidden />
                    {t('invoice.dashboard.newInvoice')}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2 border-border/80 bg-background/40 backdrop-blur-sm"
                  disabled={exportDisabled}
                  onClick={onExportAllCsv}
                >
                  <FileSpreadsheet className="size-4" aria-hidden />
                  {t('invoice.dashboard.exportAllCsv')}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="gap-1 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href="/dashboard/invoices">
                    {t('invoice.dashboard.viewFullList')}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
            <DecorativeInvoiceStack />
          </div>
        </section>

        {!loading && rows.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Layers}
              label={t('invoice.dashboard.statTotal')}
              value={rows.length}
              accent="text-foreground"
            />
            <StatCard
              icon={Clock}
              label={t('invoice.dashboard.statPending')}
              value={pendingCount}
              accent="text-amber-600 dark:text-amber-300"
            />
            <StatCard
              icon={CheckCircle2}
              label={t('invoice.dashboard.statPaid')}
              value={paidCount}
              accent="text-emerald-600 dark:text-emerald-300"
            />
            <StatCard
              icon={XCircle}
              label={t('invoice.dashboard.statCancelled')}
              value={cancelledCount}
              accent="text-muted-foreground"
            />
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[108px] animate-pulse rounded-2xl border border-border/60 bg-muted/30"
              />
            ))}
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-semibold text-heading text-lg tracking-tight">
                <FileText className="size-5 text-primary" aria-hidden />
                {t('invoice.dashboard.activityTitle')}
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                {t('invoice.dashboard.activityHint')}
              </p>
            </div>
            {!loading && rows.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1"
                asChild
              >
                <Link href="/dashboard/invoices">
                  {t('invoice.dashboard.viewFullList')}
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[72px] animate-pulse rounded-2xl border border-border/60 bg-muted/25"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/20 px-8 py-14 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CircleDollarSign className="size-7" aria-hidden />
              </div>
              <p className="mt-4 font-medium text-foreground">
                {t('invoice.dashboard.emptyTitle')}
              </p>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground text-sm">
                {t('invoice.dashboard.emptyState')}
              </p>
              <Button className="mt-6 gap-2" asChild>
                <Link href="/invoice/new">
                  <Plus className="size-4 shrink-0" aria-hidden />
                  {t('invoice.dashboard.newInvoice')}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {recent.map((r) => {
                const title =
                  r.meta?.clientName?.trim() || shortAddr(r.recipient);
                const sym = tokenSymbolForAddress(r.token);
                const amt = formatInvoiceTokenAmount(r.amount, r.token);
                return (
                  <li key={r.invoiceId.toString()}>
                    <div
                      className={cn(
                        'group flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/40 p-4 backdrop-blur-sm transition-all',
                        'hover:border-primary/25 hover:bg-card/70 hover:shadow-md hover:shadow-primary/5',
                        'sm:flex-row sm:items-center sm:justify-between',
                      )}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-muted-foreground text-xs">
                            {formatOnvoInvoiceLabel(r.invoiceId)}
                          </span>
                          {statusBadge(r.status, t, true)}
                        </div>
                        <p className="truncate font-medium text-foreground">
                          {title}
                        </p>
                        <p className="text-muted-foreground text-sm tabular-nums">
                          {amt}{' '}
                          <span className="font-medium text-foreground/80">
                            {sym}
                          </span>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                        <Button variant="secondary" size="sm" asChild>
                          <Link href={`/invoice/${r.invoiceId.toString()}`}>
                            {t('invoice.dashboard.view')}
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExportPdf(r.invoiceId)}
                        >
                          {t('invoice.dashboard.export')}
                        </Button>
                        {r.status === 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={isCancelPending}
                            onClick={() => onCancel(r.invoiceId)}
                          >
                            {t('invoice.dashboard.cancel')}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-5 backdrop-blur-sm',
        'shadow-sm transition-shadow hover:shadow-md',
        'before:pointer-events-none before:absolute before:right-0 before:top-0 before:h-24 before:w-24',
        'before:translate-x-1/3 before:-translate-y-1/3 before:rounded-full before:bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            {label}
          </p>
          <p
            className={cn(
              'mt-2 font-semibold text-3xl tabular-nums tracking-tight',
              accent,
            )}
          >
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-muted/80 p-2.5 text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      </div>
    </div>
  );
}
