'use client';

import {
  commissionWeiFromGross,
  formatCommissionPercentString,
} from '@/lib/commission';
import type { CommissionConfig } from '@/lib/invoice-contract';
import { useTranslation } from 'react-i18next';

type Props = {
  config: CommissionConfig;
  grossAmount: bigint;
};

export function InvoiceCommissionPanel({ config, grossAmount }: Props) {
  const { t } = useTranslation('common');
  const fee = commissionWeiFromGross(grossAmount, config.commissionBps);
  const net = grossAmount - fee;
  const pct = formatCommissionPercentString(config.commissionBps);

  return (
    <div className="sm:col-span-2 space-y-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
      <h2 className="font-semibold text-foreground">
        {t('invoice.commission.title')}
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.commission.rate')}
          </dt>
          <dd className="mt-1">
            {t('invoice.commission.rateValue', { percent: pct })}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.commission.recipient')}
          </dt>
          <dd className="mt-1 break-all font-mono text-xs">
            {config.commissionRecipient}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.commission.gross')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{grossAmount.toString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">
            {t('invoice.commission.fee')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{fee.toString()}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">
            {t('invoice.commission.net')}
          </dt>
          <dd className="mt-1 font-mono text-xs">{net.toString()}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        {t('invoice.commission.note')}
      </p>
    </div>
  );
}
