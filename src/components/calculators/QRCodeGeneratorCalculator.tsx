import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, Download, Copy, Info } from 'lucide-react';
import QRCode from 'qrcode';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

type QRType = 'text' | 'url' | 'phone' | 'email' | 'wifi' | 'vcard';

export default function QRCodeGeneratorCalculator() {
  const { t } = useTranslation('calculators');
  const [type, setType] = useState<QRType>('url');
  const [text, setText] = useState<string>('https://calk.kz/');
  const [phone, setPhone] = useState<string>('+77001234567');
  const [email, setEmail] = useState<string>('info@calk.kz');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [wifiSSID, setWifiSSID] = useState<string>('MyNetwork');
  const [wifiPass, setWifiPass] = useState<string>('password123');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [vcName, setVcName] = useState<string>('Иван Иванов');
  const [vcPhone, setVcPhone] = useState<string>('+77001234567');
  const [vcEmail, setVcEmail] = useState<string>('ivan@example.com');
  const [size, setSize] = useState<number>(300);
  const [color, setColor] = useState<string>('000000');
  const [bgColor, setBgColor] = useState<string>('ffffff');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const qrData = useMemo(() => {
    switch (type) {
      case 'url':
      case 'text':
        return text;
      case 'phone':
        return `tel:${phone}`;
      case 'email':
        return `mailto:${email}${emailSubject ? `?subject=${encodeURIComponent(emailSubject)}` : ''}`;
      case 'wifi':
        return `WIFI:T:${wifiType};S:${wifiSSID};P:${wifiPass};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcName}\nTEL:${vcPhone}\nEMAIL:${vcEmail}\nEND:VCARD`;
      default:
        return '';
    }
  }, [type, text, phone, email, emailSubject, wifiSSID, wifiPass, wifiType, vcName, vcPhone, vcEmail]);

  // Локальная генерация QR через библиотеку qrcode — полностью офлайн, никаких внешних запросов
  useEffect(() => {
    if (!qrData) {
      setQrDataUrl('');
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(qrData, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: `#${color}`,
        light: `#${bgColor}`,
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('');
      });
    return () => {
      cancelled = true;
    };
  }, [qrData, size, color, bgColor]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!qrDataUrl) return;
    try {
      // Современный API: копируем PNG-картинку в буфер обмена
      const blob = await (await fetch(qrDataUrl)).blob();
      if (navigator.clipboard && 'write' in navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      } else {
        // Фолбэк: копируем data URL как текст
        await navigator.clipboard.writeText(qrDataUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Фолбэк: копируем data URL как текст
      try {
        await navigator.clipboard.writeText(qrDataUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* noop */
      }
    }
  };

  const types: { id: QRType; emoji: string }[] = [
    { id: 'url', emoji: '🔗' }, { id: 'text', emoji: '📝' },
    { id: 'phone', emoji: '📞' }, { id: 'email', emoji: '✉️' },
    { id: 'wifi', emoji: '📶' }, { id: 'vcard', emoji: '👤' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <QuickAnswer calculatorId="qr-code-generator" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-slate-700 to-gray-900 rounded-lg flex items-center justify-center">
          <QrCode className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('qr-code.title')}</h1>
          <p className="text-gray-600">{t('qr-code.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.type')}</label>
            <div className="grid grid-cols-3 gap-2">
              {types.map(tp => (
                <button key={tp.id} onClick={() => setType(tp.id)}
                  className={`p-3 rounded-lg border text-sm ${type === tp.id ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-gray-700 border-gray-300'}`}>
                  <div className="text-xl mb-1">{tp.emoji}</div>
                  <div className="text-xs">{t(`qr-code.types.${tp.id}`)}</div>
                </button>
              ))}
            </div>
          </div>

          {(type === 'url' || type === 'text') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'url' ? t('qr-code.url') : t('qr-code.text')}
              </label>
              <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}

          {type === 'phone' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.phone')}</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          )}

          {type === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.subject')}</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}

          {type === 'wifi' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.ssid')}</label>
                <input type="text" value={wifiSSID} onChange={e => setWifiSSID(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.password')}</label>
                <input type="text" value={wifiPass} onChange={e => setWifiPass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.encryption')}</label>
                <select value={wifiType} onChange={e => setWifiType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{t('qr-code.nopass')}</option>
                </select>
              </div>
            </>
          )}

          {type === 'vcard' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.name')}</label>
                <input type="text" value={vcName} onChange={e => setVcName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('qr-code.phone')}</label>
                <input type="tel" value={vcPhone} onChange={e => setVcPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" value={vcEmail} onChange={e => setVcEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
            </>
          )}

          <div className="border-t pt-4 space-y-3">
            <h3 className="font-medium text-gray-900">{t('qr-code.appearance')}</h3>
            <div>
              <label className="block text-sm text-gray-700 mb-1">{t('qr-code.size')}: {size}px</label>
              <input type="range" min="100" max="600" step="50" value={size}
                onChange={e => setSize(parseInt(e.target.value))}
                className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('qr-code.color')}</label>
                <input type="color" value={`#${color}`}
                  onChange={e => setColor(e.target.value.slice(1))}
                  className="w-full h-10 rounded" />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('qr-code.bgcolor')}</label>
                <input type="color" value={`#${bgColor}`}
                  onChange={e => setBgColor(e.target.value.slice(1))}
                  className="w-full h-10 rounded" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold self-start">{t('qr-code.result')}</h2>
          {qrDataUrl && (
            <>
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                <img src={qrDataUrl} alt="QR" style={{ width: size, height: size, maxWidth: '100%' }} />
              </div>
              <div className="flex gap-2 w-full">
                <button onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800">
                  <Download className="w-4 h-4" /> {t('qr-code.download')}
                </button>
                <button onClick={handleCopyImage}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                  <Copy className="w-4 h-4" /> {t('qr-code.copyImage')}
                </button>
              </div>
              {copied && <div className="text-sm text-green-600 self-stretch text-center">{t('qr-code.copied')}</div>}
              <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-900 self-stretch flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>{t('qr-code.offlineNote')}</div>
              </div>
            </>
          )}
        </div>
      </div>

      <ExpertBlock />
      <FAQSection items={[
        { question: t('qr-code.faq.q1'), answer: t('qr-code.faq.a1') },
        { question: t('qr-code.faq.q2'), answer: t('qr-code.faq.a2') },
        { question: t('qr-code.faq.q3'), answer: t('qr-code.faq.a3') },
        { question: t('qr-code.faq.q4'), answer: t('qr-code.faq.a4') },
        { question: t('qr-code.faq.q5'), answer: t('qr-code.faq.a5') },
      ]} 
          sources={getSources('qr-code-generator')}
        />
      <EmbedWidget calculatorId="qr-code-generator" calculatorTitle={t('qr-code.title')} />
      <LastUpdated calculatorId="qr-code-generator" />
    </div>
  );
}
