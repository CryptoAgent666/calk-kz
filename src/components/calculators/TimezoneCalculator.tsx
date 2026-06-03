import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Clock, Plus, X } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

interface TimezoneInfo {
  id: string;
  name: string;
  tz: string; // IANA
  emoji: string;
}

const TIMEZONES: TimezoneInfo[] = [
  { id: 'almaty', name: 'Алматы', tz: 'Asia/Almaty', emoji: '🇰🇿' },
  { id: 'astana', name: 'Астана', tz: 'Asia/Almaty', emoji: '🇰🇿' },
  { id: 'atyrau', name: 'Атырау', tz: 'Asia/Atyrau', emoji: '🇰🇿' },
  { id: 'moscow', name: 'Москва', tz: 'Europe/Moscow', emoji: '🇷🇺' },
  { id: 'bishkek', name: 'Бишкек', tz: 'Asia/Bishkek', emoji: '🇰🇬' },
  { id: 'tashkent', name: 'Ташкент', tz: 'Asia/Tashkent', emoji: '🇺🇿' },
  { id: 'beijing', name: 'Пекин', tz: 'Asia/Shanghai', emoji: '🇨🇳' },
  { id: 'dubai', name: 'Дубай', tz: 'Asia/Dubai', emoji: '🇦🇪' },
  { id: 'istanbul', name: 'Стамбул', tz: 'Europe/Istanbul', emoji: '🇹🇷' },
  { id: 'london', name: 'Лондон', tz: 'Europe/London', emoji: '🇬🇧' },
  { id: 'paris', name: 'Париж', tz: 'Europe/Paris', emoji: '🇫🇷' },
  { id: 'newyork', name: 'Нью-Йорк', tz: 'America/New_York', emoji: '🇺🇸' },
  { id: 'losangeles', name: 'Лос-Анджелес', tz: 'America/Los_Angeles', emoji: '🇺🇸' },
  { id: 'tokyo', name: 'Токио', tz: 'Asia/Tokyo', emoji: '🇯🇵' },
  { id: 'sydney', name: 'Сидней', tz: 'Australia/Sydney', emoji: '🇦🇺' },
  { id: 'seoul', name: 'Сеул', tz: 'Asia/Seoul', emoji: '🇰🇷' },
  { id: 'singapore', name: 'Сингапур', tz: 'Asia/Singapore', emoji: '🇸🇬' },
  { id: 'delhi', name: 'Дели', tz: 'Asia/Kolkata', emoji: '🇮🇳' },
];

function formatTime(date: Date, tz: string): string {
  return date.toLocaleTimeString('ru-RU', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDate(date: Date, tz: string): string {
  return date.toLocaleDateString('ru-RU', { timeZone: tz, weekday: 'short', day: '2-digit', month: 'short' });
}

function getOffset(tz: string, now: Date): string {
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const target = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diffHours = Math.round((target.getTime() - utc.getTime()) / (60 * 60 * 1000));
  return `UTC${diffHours >= 0 ? '+' : ''}${diffHours}`;
}

export default function TimezoneCalculator() {
  const { t } = useTranslation('calculators');
  const [now, setNow] = useState(new Date());
  const [selected, setSelected] = useState<string[]>(['almaty', 'moscow', 'london', 'newyork']);
  const [baseTz, setBaseTz] = useState<string>('almaty');
  const [customTime, setCustomTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayDate = useMemo(() => {
    if (!customTime) return now;
    try {
      return new Date(customTime);
    } catch {
      return now;
    }
  }, [customTime, now]);

  const toggleTimezone = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const availableToAdd = TIMEZONES.filter(tz => !selected.includes(tz.id));

  return (
    <div className="max-w-5xl mx-auto">
      <QuickAnswer calculatorId="timezone" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('timezone.title')}</h1>
          <p className="text-gray-600">{t('timezone.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('timezone.customTime')}</label>
        <div className="flex gap-2">
          <input type="datetime-local" value={customTime} onChange={e => setCustomTime(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" />
          <button onClick={() => setCustomTime('')}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm">{t('timezone.now')}</button>
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('timezone.customTimeHint')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {selected.map(id => {
          const tz = TIMEZONES.find(x => x.id === id);
          if (!tz) return null;
          return (
            <div key={id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative">
              <button onClick={() => toggleTimezone(id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{tz.emoji}</span>
                <div>
                  <div className="font-semibold text-gray-900">{tz.name}</div>
                  <div className="text-xs text-gray-500">{getOffset(tz.tz, displayDate)}</div>
                </div>
              </div>
              <div className="text-3xl font-bold text-sky-700 font-mono">{formatTime(displayDate, tz.tz)}</div>
              <div className="text-sm text-gray-600">{formatDate(displayDate, tz.tz)}</div>
            </div>
          );
        })}
      </div>

      {availableToAdd.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">{t('timezone.addCity')}</h3>
          <div className="flex flex-wrap gap-2">
            {availableToAdd.map(tz => (
              <button key={tz.id} onClick={() => toggleTimezone(tz.id)}
                className="flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-sky-50 rounded-lg text-sm border border-gray-200">
                <span>{tz.emoji}</span>
                <span>{tz.name}</span>
                <Plus className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
        <Clock className="w-4 h-4 inline mr-1" />
        {t('timezone.info')}
      </div>

      <ExpertBlock />
      <FAQSection items={[
        { question: t('timezone.faq.q1'), answer: t('timezone.faq.a1') },
        { question: t('timezone.faq.q2'), answer: t('timezone.faq.a2') },
        { question: t('timezone.faq.q3'), answer: t('timezone.faq.a3') },
        { question: t('timezone.faq.q4'), answer: t('timezone.faq.a4') },
        { question: t('timezone.faq.q5'), answer: t('timezone.faq.a5') },
      ]} 
          sources={getSources('timezone')}
        />
      <EmbedWidget calculatorId="timezone" calculatorTitle={t('timezone.title')} />
      <LastUpdated calculatorId="timezone" />
    </div>
  );
}
