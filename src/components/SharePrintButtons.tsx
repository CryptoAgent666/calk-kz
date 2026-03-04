import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Download, MessageCircle, Send, Facebook, Twitter, Linkedin, Check, Mail, Instagram, Phone } from 'lucide-react';

interface SharePrintButtonsProps {
  title: string;
  description: string;
  results: string;
  url?: string;
  disabled?: boolean;
  className?: string;
}

export default function SharePrintButtons({
  title,
  description,
  results,
  url = window.location.href,
  disabled = false,
  className = ""
}: SharePrintButtonsProps) {
  const { t } = useTranslation('common');
  const [copySuccess, setCopySuccess] = useState(false);
  const [urlCopySuccess, setUrlCopySuccess] = useState(false);

  // Подготовка контента для шеринга
  const shareText = `${title}\n\n${description}\n\n${results}\n\n${t('buttons.calculatedOn')}`;
  const shortDescription = description.length > 100 ? description.substring(0, 97) + '...' : description;

  // Функция копирования
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  // Функция скачивания
  const handleDownload = () => {
    const content = `${shareText}\n\n${t('buttons.calculationTime')} ${new Date().toLocaleString('ru-RU')}\n${t('buttons.source')} ${url}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };


  // Функция копирования URL
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setUrlCopySuccess(true);
      setTimeout(() => setUrlCopySuccess(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования URL:', err);
      // Fallback - показываем URL для ручного копирования
      try {
        const fallbackText = `${title}\n\n${t('buttons.linkToCalculation')}\n${url}\n\n${description}`;
        await navigator.clipboard.writeText(fallbackText);
        setUrlCopySuccess(true);
        setTimeout(() => setUrlCopySuccess(false), 2000);
      } catch (err) {
        console.error('Fallback также не сработал:', err);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Копировать */}
        <button
          onClick={handleCopy}
          disabled={disabled}
          className={`inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : copySuccess
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
          title={t('buttons.copyResults')}
        >
          {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span className="hidden sm:inline">{copySuccess ? t('buttons.copied') : t('buttons.copy')}</span>
        </button>

        {/* Скачать */}
        <button
          onClick={handleDownload}
          disabled={disabled}
          className={`inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
          title={t('buttons.downloadResults')}
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">{t('buttons.download')}</span>
        </button>


        {/* Поделиться */}
        <button
          onClick={handleShare}
          disabled={disabled}
          className={`inline-flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : urlCopySuccess
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
          }`}
          title={t('buttons.shareLink')}
        >
          {urlCopySuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          <span className="hidden sm:inline">{urlCopySuccess ? t('buttons.linkCopied') : t('buttons.share')}</span>
        </button>
      </div>
    </div>
  );
}