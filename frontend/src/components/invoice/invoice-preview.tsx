'use client';

import {
  computeLineHt,
  computeLineTtc,
  computeLineVatAmount,
  computeTotalsFromLines,
} from '@/lib/invoice-calculations';
import {
  formatClientPhysicalAddress,
  formatEmitterPhysicalAddress,
} from '@/lib/invoice-address';
import type { InvoiceFormValues, InvoiceLine } from '@/lib/invoice-types';
import { OnvoLogo } from '@/components/shared/onvo-logo';
import { enUS, fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const FIRST_PAGE_LINES = 12;
const CONTINUATION_PAGE_LINES = 24;

function fmtMoney(n: number, currency: string, localeTag: string) {
  return new Intl.NumberFormat(localeTag, {
    style: 'currency',
    currency: currency === 'EURC' ? 'EUR' : 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

function chunkLines(lines: InvoiceLine[]): InvoiceLine[][] {
  if (lines.length <= FIRST_PAGE_LINES) return [lines];

  const pages: InvoiceLine[][] = [];
  pages.push(lines.slice(0, FIRST_PAGE_LINES));

  let offset = FIRST_PAGE_LINES;
  while (offset < lines.length) {
    pages.push(lines.slice(offset, offset + CONTINUATION_PAGE_LINES));
    offset += CONTINUATION_PAGE_LINES;
  }

  return pages;
}

export function InvoicePreviewDocument({
  values,
  previewRef,
  emitterWorldIdNullifier,
}: {
  values: InvoiceFormValues;
  previewRef: React.RefObject<HTMLDivElement | null>;
  emitterWorldIdNullifier?: string | null;
}) {
  const { t, i18n } = useTranslation('common');
  const localeTag = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-US';
  const dateLocale = i18n.language.startsWith('fr') ? fr : enUS;

  const { totalHt, tvaAmount, totalTtc } = computeTotalsFromLines(values.lines);

  let issueFmt = values.issueDate;
  let dueFmt = values.dueDate;
  try {
    if (values.issueDate)
      issueFmt = format(new Date(values.issueDate), 'dd MMM yyyy', {
        locale: dateLocale,
      });
    if (values.dueDate)
      dueFmt = format(new Date(values.dueDate), 'dd MMM yyyy', {
        locale: dateLocale,
      });
  } catch {
    /* keep raw */
  }

  const pages = useMemo(() => chunkLines(values.lines), [values.lines]);
  const totalPages = pages.length;

  const tableHead = (
    <thead>
      <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground/60">
        <th className="pb-3 pr-3 font-medium">
          {t('invoice.preview.thDescription')}
        </th>
        <th className="pb-3 pr-3 font-medium">{t('invoice.preview.thQty')}</th>
        <th className="pb-3 pr-3 font-medium">
          {t('invoice.preview.thUnitHt')}
        </th>
        <th className="pb-3 pr-3 font-medium">
          {t('invoice.preview.thVatPct')}
        </th>
        <th className="pb-3 pr-3 text-right font-medium">
          {t('invoice.preview.thAmountHt')}
        </th>
        <th className="pb-3 pr-3 text-right font-medium">
          {t('invoice.preview.thVat')}
        </th>
        <th className="pb-3 text-right font-medium">
          {t('invoice.preview.thTotalTtc')}
        </th>
      </tr>
    </thead>
  );

  function renderLineRows(lines: InvoiceLine[]) {
    return lines.map((line) => {
      const ht = computeLineHt(line);
      const lineTva = computeLineVatAmount(line);
      const ttc = computeLineTtc(line);
      return (
        <tr key={line.id} className="border-b border-border/50">
          <td className="py-3 pr-3 text-foreground">{line.description}</td>
          <td className="py-3 pr-3 text-muted-foreground">{line.quantity}</td>
          <td className="py-3 pr-3 text-muted-foreground">
            {fmtMoney(line.unitPrice, values.currency, localeTag)}
          </td>
          <td className="py-3 pr-3 text-muted-foreground">
            {line.vatPercent}%
          </td>
          <td className="py-3 pr-3 text-right text-foreground">
            {fmtMoney(ht, values.currency, localeTag)}
          </td>
          <td className="py-3 pr-3 text-right text-muted-foreground">
            {fmtMoney(lineTva, values.currency, localeTag)}
          </td>
          <td className="py-3 text-right font-medium text-foreground">
            {fmtMoney(ttc, values.currency, localeTag)}
          </td>
        </tr>
      );
    });
  }

  function renderPageFooter(pageNum: number) {
    return (
      <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-4">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
          <span>{t('invoice.preview.footerPrefix')}</span>
          <OnvoLogo className="!text-[10px]" />
          <span>{t('invoice.preview.footerSuffix')}</span>
        </div>
        {totalPages > 1 ? (
          <span className="text-[10px] text-muted-foreground/40">
            {t('invoice.preview.pagination', {
              page: pageNum,
              total: totalPages,
            })}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={previewRef}
      className="invoice-print-root space-y-8"
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      {pages.map((pageLines, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === totalPages - 1;
        const pageNum = pageIndex + 1;

        return (
          <div
            key={pageIndex}
            className={`flex flex-col overflow-hidden rounded-xl border border-border bg-card p-8 text-card-foreground shadow-sm${pageIndex > 0 ? ' invoice-page-break' : ''}`}
            style={{ aspectRatio: '210 / 297' }}
          >
            {/* ── Page header ── */}
            {isFirstPage ? (
              <>
                <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 sm:flex-row">
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">
                      {t('invoice.preview.invoiceTitle')}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {values.invoiceNumber}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>
                      <span className="text-muted-foreground/60">
                        {t('invoice.preview.issuedOn')}
                      </span>{' '}
                      {issueFmt}
                    </p>
                    <p>
                      <span className="text-muted-foreground/60">
                        {t('invoice.preview.dueOn')}
                      </span>{' '}
                      {dueFmt}
                    </p>
                    <p className="mt-2 font-mono text-xs text-muted-foreground/60">
                      {values.currency}
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground/60">
                      {t('invoice.preview.emitter')}
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {values.emitterName}
                    </p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {formatEmitterPhysicalAddress(values)}
                    </p>
                    {values.emitterSiret ? (
                      <p className="text-sm text-muted-foreground/60">
                        {t('invoice.preview.siretPrefix')} {values.emitterSiret}
                      </p>
                    ) : null}
                    {values.emitterVatNumber?.trim() ? (
                      <p className="mt-1 text-sm text-muted-foreground/60">
                        <span className="font-medium uppercase tracking-wide">
                          {t('invoice.preview.vatNumberLabel')}
                        </span>
                        <br />
                        <span className="font-mono">
                          {values.emitterVatNumber.trim()}
                        </span>
                      </p>
                    ) : null}
                    {values.emitterEmail ? (
                      <p className="text-sm text-muted-foreground/60">
                        {values.emitterEmail}
                      </p>
                    ) : null}
                    {emitterWorldIdNullifier?.trim() ? (
                      <p className="mt-2 text-xs text-muted-foreground/60">
                        <span className="font-medium uppercase tracking-wide">
                          {t('invoice.preview.worldIdNumber')}
                        </span>
                        <br />
                        <span className="break-all font-mono text-[11px]">
                          {emitterWorldIdNullifier.trim()}
                        </span>
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground/60">
                      {t('invoice.preview.client')}
                    </p>
                    <p className="mt-1 font-medium text-foreground">
                      {values.clientName}
                    </p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {formatClientPhysicalAddress(values)}
                    </p>
                    {values.clientEmail ? (
                      <p className="text-sm text-muted-foreground/60">
                        {values.clientEmail}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between border-b border-border pb-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {values.invoiceNumber}
                </span>
                <span>
                  {issueFmt} — {values.currency}
                </span>
              </div>
            )}

            {/* ── Line items table ── */}
            <div
              className={`overflow-x-auto ${isFirstPage ? 'mt-10' : 'mt-4'}`}
            >
              <table className="w-full min-w-[640px] border-collapse text-sm">
                {tableHead}
                <tbody>{renderLineRows(pageLines)}</tbody>
              </table>
            </div>

            {/* ── Totals + notes (last page only) ── */}
            {isLastPage ? (
              <>
                <div className="ml-auto mt-8 max-w-xs space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('invoice.preview.totalHt')}</span>
                    <span>{fmtMoney(totalHt, values.currency, localeTag)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{t('invoice.preview.totalVat')}</span>
                    <span>
                      {fmtMoney(tvaAmount, values.currency, localeTag)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
                    <span>{t('invoice.preview.totalTtc')}</span>
                    <span>
                      {fmtMoney(totalTtc, values.currency, localeTag)}
                    </span>
                  </div>
                </div>

                {values.notes ? (
                  <div className="mt-10 border-t border-border/50 pt-6">
                    <p className="text-xs font-medium uppercase text-muted-foreground/60">
                      {t('invoice.preview.notes')}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {values.notes}
                    </p>
                  </div>
                ) : null}
              </>
            ) : null}

            {/* ── Footer ── */}
            {renderPageFooter(pageNum)}
          </div>
        );
      })}
    </div>
  );
}
