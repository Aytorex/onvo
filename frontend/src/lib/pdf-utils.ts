/**
 * SHA-256 of PDF bytes as 0x-prefixed 32-byte hex (matches contract `bytes32` invoice hash).
 */
export async function pdfBlobToBytes32(pdf: Blob): Promise<`0x${string}`> {
  const buf = await pdf.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hashBuffer);
  let hex = '0x';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i]!.toString(16).padStart(2, '0');
  }
  return hex as `0x${string}`;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('read failed'));
        return;
      }
      const base64 = r.split(',')[1];
      if (!base64) reject(new Error('invalid data url'));
      else resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function generatePdfBlobFromElement(
  element: HTMLElement,
): Promise<Blob> {
  const html2pdf = (await import('html2pdf.js')).default;
  const blob = await html2pdf()
    .from(element)
    .set({
      margin: [12, 12, 12, 12],
      filename: 'invoice.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .outputPdf('blob');
  return blob as Blob;
}
