export type InvoiceStatusOnChain = 0 | 1 | 2;

export type StableCurrency = 'USDC' | 'EURC';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceFormValues {
  emitterName: string;
  emitterAddress: string;
  emitterSiret: string;
  emitterEmail: string;
  clientName: string;
  clientWallet: string;
  clientEmail: string;
  lines: InvoiceLine[];
  vatPercent: number;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: StableCurrency;
  notes: string;
}

export interface InvoiceMetaRecord {
  invoiceId: string;
  invoiceNumber: string;
  emitterName: string;
  emitterAddress: string;
  emitterSiret: string;
  emitterEmail: string;
  clientName: string;
  clientWallet: string;
  clientEmail: string;
  lines: InvoiceLine[];
  vatPercent: number;
  subtotal: number;
  totalHt: number;
  tvaAmount: number;
  totalTtc: number;
  currency: StableCurrency;
  issueDate: string;
  dueDate: string;
  notes: string;
  invoiceHash: string;
  createdAt: number;
}

export interface InvoiceRowView {
  invoiceId: bigint;
  recipient: `0x${string}`;
  amount: bigint;
  token: `0x${string}`;
  status: InvoiceStatusOnChain;
  invoiceHash: `0x${string}`;
  emitter: `0x${string}`;
  meta: InvoiceMetaRecord | null;
}
