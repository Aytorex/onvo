import type { InvoiceFormValues, InvoiceMetaRecord } from '@/lib/invoice-types';

export type StructuredAddressFields = {
  street: string;
  streetLine2: string;
  postalCode: string;
  city: string;
  country: string;
};

/** Adresse postale multi-lignes (siège). */
export function formatStructuredPhysicalAddress(
  p: StructuredAddressFields,
): string {
  const line1 = p.street.trim();
  const line2 = p.streetLine2.trim();
  const cityLine = [p.postalCode.trim(), p.city.trim()]
    .filter(Boolean)
    .join(' ');
  const country = p.country.trim();
  return [line1, line2, cityLine, country].filter(Boolean).join('\n');
}

export function formatEmitterPhysicalAddress(
  v: Pick<
    InvoiceFormValues,
    | 'emitterStreet'
    | 'emitterStreetLine2'
    | 'emitterPostalCode'
    | 'emitterCity'
    | 'emitterCountry'
  >,
): string {
  return formatStructuredPhysicalAddress({
    street: v.emitterStreet,
    streetLine2: v.emitterStreetLine2,
    postalCode: v.emitterPostalCode,
    city: v.emitterCity,
    country: v.emitterCountry,
  });
}

export function formatClientPhysicalAddress(
  v: Pick<
    InvoiceFormValues,
    | 'clientStreet'
    | 'clientStreetLine2'
    | 'clientPostalCode'
    | 'clientCity'
    | 'clientCountry'
  >,
): string {
  return formatStructuredPhysicalAddress({
    street: v.clientStreet,
    streetLine2: v.clientStreetLine2,
    postalCode: v.clientPostalCode,
    city: v.clientCity,
    country: v.clientCountry,
  });
}

export function formatEmitterPhysicalAddressFromMeta(
  m: Pick<
    InvoiceMetaRecord,
    | 'emitterAddress'
    | 'emitterStreet'
    | 'emitterStreetLine2'
    | 'emitterPostalCode'
    | 'emitterCity'
    | 'emitterCountry'
  >,
): string {
  if (m.emitterStreet?.trim()) {
    return formatStructuredPhysicalAddress({
      street: m.emitterStreet,
      streetLine2: m.emitterStreetLine2 ?? '',
      postalCode: m.emitterPostalCode ?? '',
      city: m.emitterCity ?? '',
      country: m.emitterCountry ?? '',
    });
  }
  return (m.emitterAddress ?? '').trim();
}

export function formatClientPhysicalAddressFromMeta(
  m: Pick<
    InvoiceMetaRecord,
    | 'clientAddress'
    | 'clientStreet'
    | 'clientStreetLine2'
    | 'clientPostalCode'
    | 'clientCity'
    | 'clientCountry'
  >,
): string {
  if (m.clientStreet?.trim()) {
    return formatStructuredPhysicalAddress({
      street: m.clientStreet,
      streetLine2: m.clientStreetLine2 ?? '',
      postalCode: m.clientPostalCode ?? '',
      city: m.clientCity ?? '',
      country: m.clientCountry ?? '',
    });
  }
  return (m.clientAddress ?? '').trim();
}
