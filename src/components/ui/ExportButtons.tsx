import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { FileDown, FileSpreadsheet, Printer, Check, Loader2, ClipboardCopy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { shareFileNative } from '../../utils/nativeFile';
// Heavy export libs (jsPDF/xlsx/file-saver, ~240 KB gz) are loaded on demand
// inside the export handlers so they don't bloat the initial calculator bundle.

// Ссылка в шапке/подвале PDF; utm — чтобы видеть в Метрике переходы из PDF.
const SITE_URL = 'https://calk.kz/?utm_source=pdf_export';

// Логотип для шапки PDF (public/icon-192.png → dataURL, кэш на сессию).
let logoPromise: Promise<string> | null = null;
function loadLogo(): Promise<string> {
  if (!logoPromise) {
    logoPromise = fetch('/icon-192.png')
      .then((res) => {
        if (!res.ok) throw new Error(`logo fetch failed: ${res.status}`);
        return res.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );
    logoPromise.catch(() => { logoPromise = null; }); // не кэшировать неудачу
  }
  return logoPromise;
}


interface ExportData {
  title: string;
  subtitle?: string;
  date?: string;
  sections: {
    title?: string;
    data: { label: string; value: string | number }[];
  }[];
  footer?: string;
}

interface ExportButtonsProps {
  data: ExportData;
  filename?: string;
  showPrint?: boolean;
  compact?: boolean;
}

export function ExportButtons({ 
  data, 
  filename = 'calculation', 
  showPrint = true,
  compact = false 
}: ExportButtonsProps) {
  const { t } = useTranslation('common');
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exported, setExported] = useState<'pdf' | 'excel' | 'tsv' | null>(null);

  // Копирование результата как TSV — вставляется в Excel/Google Sheets как таблица.
  const copyForExcel = async () => {
    const rows: string[] = [];
    data.sections.forEach((section) => {
      if (section.title) rows.push(section.title);
      section.data.forEach((item) => rows.push(`${item.label}\t${item.value}`));
    });
    const text = rows.join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Фоллбэк: старые браузеры / clipboard API недоступен
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } finally { document.body.removeChild(ta); }
    }
    setExported('tsv');
    setTimeout(() => setExported(null), 2000);
  };

  const exportToPDF = async () => {
    setExportingPDF(true);

    try {
      const [{ default: jsPDF }, { default: autoTable }, { ensureCyrillicFont }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        import('../../utils/pdfCyrillicFont'),
      ]);
      const doc = new jsPDF();
      // Обязательно: стандартные PDF-шрифты не умеют кириллицу (выходит мусор).
      const font = await ensureCyrillicFont(doc);
      const pageWidth = doc.internal.pageSize.getWidth();

      // Шапка-бренд: логотип + название сайта + кликабельная ссылка
      try {
        doc.addImage(await loadLogo(), 'PNG', 14, 8, 12, 12);
      } catch {
        /* логотип не загрузился — шапка остаётся текстовой */
      }
      doc.setFont(font, 'bold');
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text(t('siteName'), 30, 14);
      doc.setFont(font, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(t('siteTagline'), 30, 19);
      doc.setFontSize(10);
      doc.setTextColor(37, 99, 235); // blue-600
      const urlLabel = 'calk.kz';
      doc.textWithLink(urlLabel, pageWidth - 14 - doc.getTextWidth(urlLabel), 14, { url: SITE_URL });
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.line(14, 24, pageWidth - 14, 24);

      // Заголовок
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text(data.title, pageWidth / 2, 34, { align: 'center' });

      // Подзаголовок
      if (data.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(data.subtitle, pageWidth / 2, 42, { align: 'center' });
      }

      // Дата
      const dateStr = data.date || new Date().toLocaleDateString('ru-RU');
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Дата расчета: ${dateStr}`, pageWidth / 2, 49, { align: 'center' });

      let yPosition = 58;
      
      // Секции с данными
      data.sections.forEach((section, sectionIndex) => {
        if (section.title) {
          doc.setFontSize(14);
          doc.setTextColor(31, 41, 55); // gray-800
          doc.text(section.title, 14, yPosition);
          yPosition += 8;
        }
        
        const tableData = section.data.map(item => [item.label, String(item.value)]);
        
        autoTable(doc, {
          startY: yPosition,
          head: [],
          body: tableData,
          theme: 'striped',
          styles: {
            font,
            fontSize: 10,
            cellPadding: 4,
          },
          columnStyles: {
            0: { fontStyle: 'normal', textColor: [107, 114, 128] },
            1: { fontStyle: 'bold', halign: 'right', textColor: [31, 41, 55] },
          },
          margin: { left: 14, right: 14 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
      });
      
      // Футер
      if (data.footer) {
        doc.setFontSize(9);
        doc.setTextColor(156, 163, 175);
        doc.text(data.footer, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
      }
      
      // Водяной знак (тоже кликабельный)
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.textWithLink(
        'calk.kz',
        pageWidth - 14 - doc.getTextWidth('calk.kz'),
        doc.internal.pageSize.getHeight() - 10,
        { url: SITE_URL }
      );

      if (Capacitor.isNativePlatform()) {
        // В приложении doc.save() молча не работает (WKWebView) → Filesystem + share sheet.
        await shareFileNative(`${filename}.pdf`, doc.output('datauristring').split(',')[1]);
      } else {
        doc.save(`${filename}.pdf`);
      }
      setExported('pdf');
      setTimeout(() => setExported(null), 2000);
    } catch (error) {
      console.error('PDF export error:', error);
    } finally {
      setExportingPDF(false);
    }
  };

  const exportToExcel = async () => {
    setExportingExcel(true);

    try {
      const [XLSX, { saveAs }] = await Promise.all([
        import('xlsx'),
        import('file-saver'),
      ]);
      const wb = XLSX.utils.book_new();
      
      // Подготовка данных для Excel
      const wsData: (string | number)[][] = [
        [data.title],
        data.subtitle ? [data.subtitle] : [],
        [`Дата: ${data.date || new Date().toLocaleDateString('ru-RU')}`],
        [],
      ].filter(row => row.length > 0);
      
      data.sections.forEach((section) => {
        if (section.title) {
          wsData.push([section.title]);
        }
        section.data.forEach(item => {
          wsData.push([item.label, item.value]);
        });
        wsData.push([]);
      });
      
      if (data.footer) {
        wsData.push([data.footer]);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      
      // Установка ширины колонок
      ws['!cols'] = [
        { wch: 40 },
        { wch: 25 },
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'Расчет');
      
      // Сохранение файла
      if (Capacitor.isNativePlatform()) {
        // В приложении saveAs() молча не работает (WKWebView) → Filesystem + share sheet.
        const base64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        await shareFileNative(`${filename}.xlsx`, base64);
      } else {
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `${filename}.xlsx`);
      }

      setExported('excel');
      setTimeout(() => setExported(null), 2000);
    } catch (error) {
      console.error('Excel export error:', error);
    } finally {
      setExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // window.print() не работает в WKWebView/Android WebView → в приложении кнопку прячем.
  const canPrint = showPrint && !Capacitor.isNativePlatform();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={exportToPDF}
          disabled={exportingPDF}
          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title={t('export.downloadPDF')}
        >
          {exportingPDF ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : exported === 'pdf' ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <FileDown className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={exportToExcel}
          disabled={exportingExcel}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          title={t('export.downloadExcel')}
        >
          {exportingExcel ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : exported === 'excel' ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <FileSpreadsheet className="w-5 h-5" />
          )}
        </button>
        
        <button
          onClick={copyForExcel}
          className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
          title={t('export.copyForExcel')}
        >
          {exported === 'tsv' ? <Check className="w-5 h-5 text-green-600" /> : <ClipboardCopy className="w-5 h-5" />}
        </button>

        {canPrint && (
          <button
            onClick={handlePrint}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors print:hidden"
            title={t('export.print')}
          >
            <Printer className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button
        onClick={exportToPDF}
        disabled={exportingPDF}
        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg 
                   hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {exportingPDF ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : exported === 'pdf' ? (
          <Check className="w-4 h-4" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        <span>{t('export.downloadPDF')}</span>
      </button>
      
      <button
        onClick={exportToExcel}
        disabled={exportingExcel}
        className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg 
                   hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {exportingExcel ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : exported === 'excel' ? (
          <Check className="w-4 h-4" />
        ) : (
          <FileSpreadsheet className="w-4 h-4" />
        )}
        <span>{t('export.downloadExcel')}</span>
      </button>
      
      <button
        onClick={copyForExcel}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg
                   hover:bg-emerald-100 transition-colors"
      >
        {exported === 'tsv' ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
        <span>{exported === 'tsv' ? t('export.copiedForExcel') : t('export.copyForExcel')}</span>
      </button>

      {canPrint && (
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg
                     hover:bg-blue-100 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>{t('export.print')}</span>
        </button>
      )}
    </div>
  );
}

export default ExportButtons;


