'use client';

import { computeLineSubtotal, computeTotals } from '@/lib/invoice-calculations';
import type { InvoiceFormValues } from '@/lib/invoice-types';
import { format } from 'date-fns';

function fmtMoney(n: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'EURC' ? 'EUR' : 'USD',
    minimumFractionDigits: 2,
  }).format(n);
}

export function InvoicePreviewDocument({
  values,
  previewRef,
}: {
  values: InvoiceFormValues;
  previewRef: React.RefObject<HTMLDivElement | null>;
}) {
  const subtotal = computeLineSubtotal(values.lines);
  const { totalHt, tvaAmount, totalTtc } = computeTotals(
    subtotal,
    values.vatPercent,
  );

  let issueFmt = values.issueDate;
  let dueFmt = values.dueDate;
  try {
    if (values.issueDate)
      issueFmt = format(new Date(values.issueDate), 'dd MMM yyyy');
    if (values.dueDate)
      dueFmt = format(new Date(values.dueDate), 'dd MMM yyyy');
  } catch {
    /* keep raw */
  }

  return (
    <div
      ref={previewRef}
      className="invoice-print-root rounded-xl border border-zinc-700 bg-zinc-950 p-8 text-zinc-100 shadow-inner"
      style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
    >
      <div className="flex flex-col justify-between gap-6 border-b border-zinc-700 pb-6 sm:flex-row">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-onvo-cyan">
            Onvo
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-white">Facture</h2>
          <p className="mt-2 text-sm text-zinc-400">{values.invoiceNumber}</p>
        </div>
        <div className="text-right text-sm text-zinc-400">
          <p>
            <span className="text-zinc-500">Émis le</span> {issueFmt}
          </p>
          <p>
            <span className="text-zinc-500">Échéance</span> {dueFmt}
          </p>
          <p className="mt-2 font-mono text-xs text-zinc-500">
            {values.currency}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Émetteur
          </p>
          <p className="mt-1 font-medium text-white">{values.emitterName}</p>
          <p className="text-sm text-zinc-400">{values.emitterAddress}</p>
          {values.emitterSiret ? (
            <p className="text-sm text-zinc-500">SIRET {values.emitterSiret}</p>
          ) : null}
          {values.emitterEmail ? (
            <p className="text-sm text-zinc-500">{values.emitterEmail}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">Client</p>
          <p className="mt-1 font-medium text-white">{values.clientName}</p>
          <p className="break-all font-mono text-sm text-zinc-400">
            {values.clientWallet}
          </p>
          {values.clientEmail ? (
            <p className="text-sm text-zinc-500">{values.clientEmail}</p>
          ) : null}
        </div>
      </div>

      <table className="mt-10 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-xs uppercase text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Description</th>
            <th className="pb-3 pr-4 font-medium">Qté</th>
            <th className="pb-3 pr-4 font-medium">P.U.</th>
            <th className="pb-3 text-right font-medium">Montant</th>
          </tr>
        </thead>
        <tbody>
          {values.lines.map((line) => (
            <tr key={line.id} className="border-b border-zinc-800">
              <td className="py-3 pr-4 text-zinc-200">{line.description}</td>
              <td className="py-3 pr-4 text-zinc-400">{line.quantity}</td>
              <td className="py-3 pr-4 text-zinc-400">
                {fmtMoney(line.unitPrice, values.currency)}
              </td>
              <td className="py-3 text-right text-zinc-200">
                {fmtMoney(line.quantity * line.unitPrice, values.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto mt-8 max-w-xs space-y-2 text-sm">
        <div className="flex justify-between text-zinc-400">
          <span>Sous-total HT</span>
          <span>{fmtMoney(subtotal, values.currency)}</span>
        </div>
        <div className="flex justify-between text-zinc-400">
          <span>TVA ({values.vatPercent}%)</span>
          <span>{fmtMoney(tvaAmount, values.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-zinc-700 pt-2 text-base font-semibold text-white">
          <span>Total TTC</span>
          <span>{fmtMoney(totalTtc, values.currency)}</span>
        </div>
      </div>

      {values.notes ? (
        <div className="mt-10 border-t border-zinc-800 pt-6">
          <p className="text-xs font-medium uppercase text-zinc-500">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">
            {values.notes}
          </p>
        </div>
      ) : null}

      <p className="mt-10 text-center text-[10px] text-zinc-600">
        Document généré par Onvo — hash on-chain à l&apos;émission.
      </p>
    </div>
  );
}
