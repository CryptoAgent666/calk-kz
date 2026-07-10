import type { jsPDF } from 'jspdf';

/**
 * Кириллица для jsPDF. Стандартные 14 PDF-шрифтов — только латиница
 * (кириллица молча превращается в мусор), поэтому встраиваем DejaVu Sans:
 * полный русский+казахский алфавит (Ә Ғ Қ Ң Ө Ұ Ү Һ І), ₸ и №.
 *
 * Шрифты — сабсет ~40 КБ каждый (латиница + кириллица + знаки), лежат в
 * src/assets/fonts и грузятся один раз при первом экспорте (модуль и так
 * лениво импортируется вместе с jsPDF).
 */

export const PDF_FONT_FAMILY = 'DejaVuSans';

let fontsPromise: Promise<{ regular: string; bold: string }> | null = null;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000; // не звать fromCharCode на мегабайтном массиве разом
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function fetchFontB64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`font fetch failed: ${res.status}`);
  return toBase64(await res.arrayBuffer());
}

function loadFonts(): Promise<{ regular: string; bold: string }> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      fetchFontB64(new URL('../assets/fonts/DejaVuSans.subset.ttf', import.meta.url).href),
      fetchFontB64(new URL('../assets/fonts/DejaVuSans-Bold.subset.ttf', import.meta.url).href),
    ]).then(([regular, bold]) => ({ regular, bold }));
  }
  return fontsPromise;
}

/**
 * Зарегистрировать кириллический шрифт в документе и сделать его текущим.
 * Возвращает имя семейства для autoTable ({ styles: { font: ... } }).
 */
export async function ensureCyrillicFont(doc: jsPDF): Promise<string> {
  let fonts: { regular: string; bold: string };
  try {
    fonts = await loadFonts();
  } catch (err) {
    fontsPromise = null; // не кэшировать неудачу (офлайн на вебе) — попробуем в следующий раз
    throw err;
  }
  doc.addFileToVFS('DejaVuSans.ttf', fonts.regular);
  doc.addFont('DejaVuSans.ttf', PDF_FONT_FAMILY, 'normal');
  doc.addFileToVFS('DejaVuSans-Bold.ttf', fonts.bold);
  doc.addFont('DejaVuSans-Bold.ttf', PDF_FONT_FAMILY, 'bold');
  doc.setFont(PDF_FONT_FAMILY, 'normal');
  return PDF_FONT_FAMILY;
}
