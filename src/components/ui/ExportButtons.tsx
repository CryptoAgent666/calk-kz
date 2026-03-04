import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Printer, Check, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


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
  const [exported, setExported] = useState<'pdf' | 'excel' | null>(null);

  const exportToPDF = async () => {
    setExportingPDF(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Заголовок
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175); // blue-800
      doc.text(data.title, pageWidth / 2, 20, { align: 'center' });
      
      // Подзаголовок
      if (data.subtitle) {
        doc.setFontSize(12);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(data.subtitle, pageWidth / 2, 28, { align: 'center' });
      }
      
      // Дата
      const dateStr = data.date || new Date().toLocaleDateString('ru-RU');
      doc.setFontSize(10);
      doc.setTextColor(156, 163, 175); // gray-400
      doc.text(`Дата расчета: ${dateStr}`, pageWidth / 2, 35, { align: 'center' });
      
      let yPosition = 45;
      
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
      
      // Водяной знак
      doc.setFontSize(8);
      doc.setTextColor(200, 200, 200);
      doc.text('calk.kz', pageWidth - 14, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      
      doc.save(`${filename}.pdf`);
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
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);
      
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
        
        {showPrint && (
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
      
      {showPrint && (
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


