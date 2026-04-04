export type InvoiceStatusOnChain = 0 | 1 | 2;

export type StableCurrency = 'USDC' | 'EURC';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  /** TVA applicable à cette ligne (0–100). */
  vatPercent: number;
}

export interface InvoiceFormValues {
  emitterName: string;
  emitterStreet: string;
  emitterStreetLine2: string;
  emitterPostalCode: string;
  emitterCity: string;
  emitterCountry: string;
  emitterSiret: string;
  /** Numéro de TVA intracommunautaire (émetteur), ex. FR85939527636. */
  emitterVatNumber: string;
  emitterEmail: string;
  clientName: string;
  clientStreet: string;
  clientStreetLine2: string;
  clientPostalCode: string;
  clientCity: string;
  clientCountry: string;
  clientEmail: string;
  lines: InvoiceLine[];
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
  /** @deprecated Anciennes factures : une seule ligne d’adresse. */
  emitterAddress?: string;
  emitterStreet?: string;
  emitterStreetLine2?: string;
  emitterPostalCode?: string;
  emitterCity?: string;
  emitterCountry?: string;
  emitterSiret: string;
  emitterVatNumber?: string;
  emitterEmail: string;
  /** Nullifier World ID de l'émetteur (identifiant unique côté app), figé au moment du PDF. */
  emitterWorldIdNullifier?: string;
  clientName: string;
  /** @deprecated Anciennes factures : adresse client sur une ligne. */
  clientAddress?: string;
  clientStreet?: string;
  clientStreetLine2?: string;
  clientPostalCode?: string;
  clientCity?: string;
  clientCountry?: string;
  /** @deprecated Anciennes factures ; le contrat stocke un `recipient` (souvent = émetteur si non saisi). */
  clientWallet?: string;
  clientEmail: string;
  lines: InvoiceLine[];
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
