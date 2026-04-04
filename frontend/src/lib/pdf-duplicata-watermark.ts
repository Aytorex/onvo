import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const sub = bytes.subarray(i, i + chunk);
    s += String.fromCharCode.apply(null, Array.from(sub) as number[]);
  }
  return btoa(s);
}

/**
 * Filigrane « DUPLICATA » : grand, diagonale bas-gauche → haut-droite, rendu discret
 * (gris clair, faible opacité) pour rappeler une copie papier sans masquer le texte.
 * Note : le dessin est ajouté après le contenu du PDF ; l’effet « sous le texte »
 * est approché par une opacité basse (comme un tampon léger sur l’original).
 */
export async function applyDuplicataWatermarkToPdfBase64(
  base64: string,
): Promise<string> {
  const pdfDoc = await PDFDocument.load(base64ToUint8Array(base64));
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const label = 'DUPLICATA';

  for (const page of pdfDoc.getPages()) {
    const { width, height } = page.getSize();
    const diagonal = Math.hypot(width, height);
    /** Angle de la diagonale page (bas-gauche → haut-droite), en degrés. */
    const angleDeg = (Math.atan2(height, width) * 180) / Math.PI;

    /** Taille : un peu sous la diagonale pour éviter tout débordement aux coins. */
    let fontSize = diagonal * 0.165;
    const maxWidth = diagonal * 0.82;
    for (let i = 0; i < 48; i++) {
      const tw = font.widthOfTextAtSize(label, fontSize);
      if (tw <= maxWidth) break;
      fontSize *= 0.96;
    }
    fontSize = Math.max(fontSize, diagonal * 0.08);

    /** Point de départ proche du bas-gauche (marges). */
    const margin = Math.min(width, height) * 0.15;
    page.drawText(label, {
      x: margin,
      y: margin,
      size: fontSize,
      font,
      color: rgb(0.78, 0.78, 0.78),
      opacity: 0.35,
      rotate: degrees(angleDeg),
    });
  }

  const out = await pdfDoc.save();
  return uint8ArrayToBase64(out);
}
