import type { InvoiceFormValues, InvoiceMetaRecord } from '@/lib/invoice-types';

/**
 * Reconstruit les valeurs du formulaire depuis le meta stocké (localStorage)
 * pour réutiliser `InvoicePreviewDocument` — même rendu que le PDF.
 */
export function invoiceMetaToFormValues(
  meta: InvoiceMetaRecord,
): InvoiceFormValues {
  const lines = meta.lines.map((line, i) => ({
    ...line,
    id: line.id?.trim() ? line.id : `line-${i}`,
  }));
  return {
    emitterName: meta.emitterName,
    emitterStreet: meta.emitterStreet ?? meta.emitterAddress ?? '',
    emitterStreetLine2: meta.emitterStreetLine2 ?? '',
    emitterPostalCode: meta.emitterPostalCode ?? '',
    emitterCity: meta.emitterCity ?? '',
    emitterCountry: meta.emitterCountry ?? '',
    emitterSiret: meta.emitterSiret,
    emitterVatNumber: meta.emitterVatNumber ?? '',
    emitterEmail: meta.emitterEmail,
    clientName: meta.clientName,
    clientStreet: meta.clientStreet ?? meta.clientAddress ?? '',
    clientStreetLine2: meta.clientStreetLine2 ?? '',
    clientPostalCode: meta.clientPostalCode ?? '',
    clientCity: meta.clientCity ?? '',
    clientCountry: meta.clientCountry ?? '',
    clientEmail: meta.clientEmail,
    lines,
    issueDate: meta.issueDate,
    dueDate: meta.dueDate,
    currency: meta.currency,
    notes: meta.notes,
  };
}
