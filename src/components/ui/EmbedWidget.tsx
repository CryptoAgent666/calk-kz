import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, Settings, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmbedWidgetProps {
  calculatorId: string;
  calculatorTitle: string;
  baseUrl?: string;
}

const DEFAULT_EMBED_BASE_URL = 'https://calk.kz';

const normalizeBaseUrl = (url: string) =>
  url.replace('kzcalk.kz', 'calk.kz').replace('kzcalc.kz', 'calk.kz');

export function EmbedWidget({ 
  calculatorId, 
  calculatorTitle,
  baseUrl = DEFAULT_EMBED_BASE_URL
}: EmbedWidgetProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    width: '100%',
    height: '600',
    showHeader: true,
    theme: 'light'
  });

  const embedBaseUrl = normalizeBaseUrl(baseUrl);
  const embedPath = `/embed/${calculatorId}?theme=${settings.theme}&header=${settings.showHeader}`;
  const embedUrl = `${embedBaseUrl}${embedPath}`;
  const previewUrl = `${typeof window !== 'undefined' ? window.location.origin : embedBaseUrl}${embedPath}`;

  const iframeCode = `<iframe
  src="${embedUrl}"
  width="${settings.width}"
  height="${settings.height}px"
  frameborder="0"
  style="border: 1px solid #e5e7eb; border-radius: 12px;"
  title="${calculatorTitle}"
  loading="lazy"
></iframe>`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="mt-6 print:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left shadow-sm transition-colors ${
          isOpen
            ? 'bg-blue-100 border-blue-200'
            : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
            <Code className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-blue-800">{t('embed.embedOnSite')}</div>
            <div className="text-xs text-blue-600">{t('embed.htmlCode')}</div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-blue-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="mt-4 bg-gray-50 rounded-xl p-5 border border-gray-200">
          <div className="flex items-start gap-6">
            {/* Настройки */}
            <div className="flex-shrink-0 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Settings className="w-4 h-4" />
                <span>{t('embed.settings')}</span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{t('embed.width')}</label>
                  <select
                    value={settings.width}
                    onChange={(e) => setSettings({ ...settings, width: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="100%">{t('embed.widthAdaptive')}</option>
                    <option value="400px">400px</option>
                    <option value="500px">500px</option>
                    <option value="600px">600px</option>
                    <option value="800px">800px</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{t('embed.height')}</label>
                  <input
                    type="number"
                    value={settings.height}
                    onChange={(e) => setSettings({ ...settings, height: e.target.value })}
                    min="400"
                    max="1200"
                    step="50"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 block mb-1">{t('embed.theme')}</label>
                  <select
                    value={settings.theme}
                    onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">{t('embed.themeLight')}</option>
                    <option value="dark">{t('embed.themeDark')}</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showHeader}
                    onChange={(e) => setSettings({ ...settings, showHeader: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">{t('embed.showHeader')}</span>
                </label>
              </div>
            </div>
            
            {/* Код */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{t('embed.htmlCode')}</span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white 
                           rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t('embed.copied')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t('embed.copy')}</span>
                    </>
                  )}
                </button>
              </div>
              
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                <code>{iframeCode}</code>
              </pre>
              
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                <ExternalLink className="w-3 h-3" />
                <span>{t('embed.preview')}: </span>
                <a 
                  href={embedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {embedUrl}
                </a>
              </div>
            </div>
          </div>
          
          {/* Предпросмотр */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-3">{t('embed.preview')}</div>
            <div
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              style={{
                width: settings.width === '100%' ? '100%' : settings.width,
                maxWidth: '100%'
              }}
            >
              <iframe
                src={previewUrl}
                title={calculatorTitle}
                loading="lazy"
                style={{
                  width: '100%',
                  height: `${settings.height}px`,
                  border: '0'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmbedWidget;


