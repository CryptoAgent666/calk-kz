import React, { useState, useEffect } from 'react';
import { Clock, Calculator, Languages, Copy, Download, RotateCcw, Info, AlertTriangle, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';

interface TimeConversionResult {
  words: string;
  formal: string;
  colloquial: string;
  description: string;
}

interface ConversionHistory {
  id: string;
  time: string;
  language: string;
  format: string;
  result: string;
  timestamp: Date;
}

export default function TimeToWordsCalculator() {
  const { t } = useTranslation('calculators');
  const [inputTime, setInputTime] = useState<string>('14:30');
  const [language, setLanguage] = useState<'ru' | 'kz' | 'en'>('ru');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');
  const [includeSeconds, setIncludeSeconds] = useState<boolean>(false);
  const [style, setStyle] = useState<'formal' | 'colloquial' | 'both'>('formal');
  const [history, setHistory] = useState<ConversionHistory[]>([]);

  const [results, setResults] = useState<TimeConversionResult>({
    words: '',
    formal: '',
    colloquial: '',
    description: ''
  });

  // Словари числительных для времени
  const timeNumbers = {
    ru: {
      hours: {
        0: 'ноль', 1: 'один', 2: 'два', 3: 'три', 4: 'четыре', 5: 'пять', 6: 'шесть',
        7: 'семь', 8: 'восемь', 9: 'девять', 10: 'десять', 11: 'одиннадцать', 12: 'двенадцать',
        13: 'тринадцать', 14: 'четырнадцать', 15: 'пятнадцать', 16: 'шестнадцать',
        17: 'семнадцать', 18: 'восемнадцать', 19: 'девятнадцать', 20: 'двадцать',
        21: 'двадцать один', 22: 'двадцать два', 23: 'двадцать три'
      },
      minutes: {
        0: 'ноль', 1: 'одна', 2: 'две', 3: 'три', 4: 'четыре', 5: 'пять', 6: 'шесть',
        7: 'семь', 8: 'восемь', 9: 'девять', 10: 'десять', 11: 'одиннадцать', 12: 'двенадцать',
        13: 'тринадцать', 14: 'четырнадцать', 15: 'пятнадцать', 16: 'шестнадцать',
        17: 'семнадцать', 18: 'восемнадцать', 19: 'девятнадцать', 20: 'двадцать',
        30: 'тридцать', 40: 'сорок', 50: 'пятьдесят'
      },
      forms: {
        hour: ['час', 'часа', 'часов'],
        minute: ['минута', 'минуты', 'минут'],
        second: ['секунда', 'секунды', 'секунд']
      },
      periods: { am: 'утра', pm: 'вечера', noon: 'полдень', midnight: 'полночь' }
    },
    kz: {
      hours: {
        0: 'нөл', 1: 'бір', 2: 'екі', 3: 'үш', 4: 'төрт', 5: 'бес', 6: 'алты',
        7: 'жеті', 8: 'сегіз', 9: 'тоғыз', 10: 'он', 11: 'он бір', 12: 'он екі',
        13: 'он үш', 14: 'он төрт', 15: 'он бес', 16: 'он алты', 17: 'он жеті',
        18: 'он сегіз', 19: 'он тоғыз', 20: 'жиырма', 21: 'жиырма бір',
        22: 'жиырма екі', 23: 'жиырма үш'
      },
      minutes: {
        0: 'нөл', 1: 'бір', 2: 'екі', 3: 'үш', 4: 'төрт', 5: 'бес', 6: 'алты',
        7: 'жеті', 8: 'сегіз', 9: 'тоғыз', 10: 'он', 11: 'он бір', 12: 'он екі',
        13: 'он үш', 14: 'он төрт', 15: 'он бес', 16: 'он алты', 17: 'он жеті',
        18: 'он сегіз', 19: 'он тоғыз', 20: 'жиырма', 30: 'отыз', 40: 'қырық', 50: 'елу'
      },
      forms: {
        hour: 'сағат',
        minute: 'минут',
        second: 'секунд'
      },
      periods: { am: 'таңертең', pm: 'кешкі', noon: 'түс', midnight: 'түн жарысы' }
    },
    en: {
      hours: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six',
        7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve',
        13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen',
        18: 'eighteen', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one',
        22: 'twenty-two', 23: 'twenty-three'
      },
      minutes: {
        0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six',
        7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve',
        13: 'thirteen', 14: 'fourteen', 15: 'fifteen', 16: 'sixteen', 17: 'seventeen',
        18: 'eighteen', 19: 'nineteen', 20: 'twenty', 30: 'thirty', 40: 'forty', 50: 'fifty'
      },
      forms: {
        hour: ['hour', 'hours'],
        minute: ['minute', 'minutes'],
        second: ['second', 'seconds']
      },
      periods: { am: 'AM', pm: 'PM', noon: 'noon', midnight: 'midnight' }
    }
  };

  // Функция для получения правильной формы слова (русский)
  const getWordFormRu = (number: number, forms: string[]): string => {
    const absNumber = Math.abs(number);
    const lastDigit = absNumber % 10;
    const lastTwoDigits = absNumber % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return forms[2]; // множественное число
    }

    if (lastDigit === 1) {
      return forms[0]; // единственное число
    } else if (lastDigit >= 2 && lastDigit <= 4) {
      return forms[1]; // 2-4
    } else {
      return forms[2]; // 5-9, 0
    }
  };

  // Функция для получения правильной формы слова (английский)
  const getWordFormEn = (number: number, forms: string[]): string => {
    return number === 1 ? forms[0] : forms[1];
  };

  // Преобразование числа в слова для минут
  const convertMinutesToWords = (minutes: number, lang: 'ru' | 'kz' | 'en'): string => {
    const dict = timeNumbers[lang];

    if (minutes === 0) {
      return dict.minutes[0];
    }

    if (minutes <= 20 || [30, 40, 50].includes(minutes)) {
      return dict.minutes[minutes] || '';
    }

    // Для чисел больше 20 (составные)
    const tens = Math.floor(minutes / 10) * 10;
    const ones = minutes % 10;

    if (lang === 'en') {
      return ones === 0 ? dict.minutes[tens] : `${dict.minutes[tens]}-${dict.minutes[ones]}`;
    } else if (lang === 'ru') {
      const tensWord = dict.minutes[tens] || '';
      const onesWord = ones === 0 ? '' : dict.minutes[ones] || '';
      return `${tensWord}${onesWord ? ' ' + onesWord : ''}`;
    } else { // kazakh
      const tensWord = dict.minutes[tens] || '';
      const onesWord = ones === 0 ? '' : dict.minutes[ones] || '';
      return `${tensWord}${onesWord ? ' ' + onesWord : ''}`;
    }
  };

  // Основная функция преобразования времени
  const convertTimeToWords = (): TimeConversionResult => {
    if (!inputTime) {
      return { words: '', formal: '', colloquial: '', description: '' };
    }

    // Парсинг времени
    const timeMatch = inputTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) {
      return {
        words: t('time-to-words.invalidFormat'),
        formal: '',
        colloquial: '',
        description: t('time-to-words.useFormat')
      };
    }

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

    // Валидация
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || (timeMatch[3] && (seconds < 0 || seconds > 59))) {
      return {
        words: t('time-to-words.invalidTime'),
        formal: '',
        colloquial: '',
        description: t('time-to-words.checkTime')
      };
    }

    const dict = timeNumbers[language];

    // Формальный стиль (24-часовой формат)
    let formal = '';
    let colloquial = '';

    if (language === 'ru') {
      // Русский язык
      const hoursWord = dict.hours[hours];
      const minutesWord = convertMinutesToWords(minutes, language);
      const hoursForm = getWordFormRu(hours, dict.forms.hour);
      const minutesForm = getWordFormRu(minutes, dict.forms.minute);

      formal = `${hoursWord} ${hoursForm}`;
      if (minutes > 0) {
        formal += ` ${minutesWord} ${minutesForm}`;
      }
      if (includeSeconds && seconds > 0) {
        const secondsWord = dict.minutes[seconds] || convertMinutesToWords(seconds, language);
        const secondsForm = getWordFormRu(seconds, dict.forms.second);
        formal += ` ${secondsWord} ${secondsForm}`;
      }

      // Разговорный стиль
      if (timeFormat === '12h') {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours < 12 ? dict.periods.am : dict.periods.pm;

        if (hours === 0 && minutes === 0) {
          colloquial = dict.periods.midnight;
        } else if (hours === 12 && minutes === 0) {
          colloquial = dict.periods.noon;
        } else {
          const hour12Word = dict.hours[hour12];
          colloquial = `${hour12Word} ${getWordFormRu(hour12, dict.forms.hour)}`;
          if (minutes > 0) {
            colloquial += ` ${minutesWord} ${minutesForm}`;
          }
          colloquial += ` ${period}`;
        }
      } else {
        // Разговорные варианты для 24-часового
        if (minutes === 0) {
          colloquial = `${hoursWord} ${hours === 1 ? 'час ровно' : 'часов ровно'}`;
        } else if (minutes === 15) {
          colloquial = `четверть ${hours + 1 <= 23 ? dict.hours[hours + 1] : 'первого'}`;
        } else if (minutes === 30) {
          colloquial = `половина ${hours + 1 <= 23 ? dict.hours[hours + 1] : 'первого'}`;
        } else if (minutes === 45) {
          colloquial = `без четверти ${hours + 1 <= 23 ? dict.hours[hours + 1] : 'час'}`;
        } else {
          colloquial = formal;
        }
      }
    } else if (language === 'kz') {
      // Казахский язык
      const hoursWord = dict.hours[hours];
      const minutesWord = convertMinutesToWords(minutes, language);

      formal = `${hoursWord} ${dict.forms.hour}`;
      if (minutes > 0) {
        formal += ` ${minutesWord} ${dict.forms.minute}`;
      }
      if (includeSeconds && seconds > 0) {
        const secondsWord = convertMinutesToWords(seconds, language);
        formal += ` ${secondsWord} ${dict.forms.second}`;
      }

      // Разговорный стиль (казахский обычно более формальный)
      if (timeFormat === '12h') {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours < 12 ? dict.periods.am : dict.periods.pm;

        if (hours === 0 && minutes === 0) {
          colloquial = dict.periods.midnight;
        } else if (hours === 12 && minutes === 0) {
          colloquial = dict.periods.noon;
        } else {
          const hour12Word = dict.hours[hour12];
          colloquial = `${period} ${hour12Word} ${dict.forms.hour}`;
          if (minutes > 0) {
            colloquial += ` ${minutesWord} ${dict.forms.minute}`;
          }
        }
      } else {
        colloquial = formal;
      }
    } else {
      // Английский язык
      const hoursWord = dict.hours[hours];
      const minutesWord = convertMinutesToWords(minutes, language);
      const hoursForm = getWordFormEn(hours, dict.forms.hour);
      const minutesForm = getWordFormEn(minutes, dict.forms.minute);

      formal = `${hoursWord} ${hoursForm}`;
      if (minutes > 0) {
        formal += ` ${minutesWord} ${minutesForm}`;
      }
      if (includeSeconds && seconds > 0) {
        const secondsWord = convertMinutesToWords(seconds, language);
        const secondsForm = getWordFormEn(seconds, dict.forms.second);
        formal += ` ${secondsWord} ${secondsForm}`;
      }

      // Разговорный стиль
      if (timeFormat === '12h') {
        const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const period = hours < 12 ? dict.periods.am : dict.periods.pm;

        if (hours === 0 && minutes === 0) {
          colloquial = dict.periods.midnight;
        } else if (hours === 12 && minutes === 0) {
          colloquial = dict.periods.noon;
        } else {
          const hour12Word = dict.hours[hour12];
          colloquial = `${hour12Word} ${getWordFormEn(hour12, dict.forms.hour)}`;
          if (minutes > 0) {
            colloquial += ` ${minutesWord} ${minutesForm}`;
          }
          colloquial += ` ${period}`;
        }
      } else {
        // Разговорные варианты
        if (minutes === 0) {
          colloquial = `${hoursWord} o'clock`;
        } else if (minutes === 15) {
          colloquial = `quarter past ${hoursWord}`;
        } else if (minutes === 30) {
          colloquial = `half past ${hoursWord}`;
        } else if (minutes === 45) {
          const nextHour = hours === 23 ? 0 : hours + 1;
          colloquial = `quarter to ${dict.hours[nextHour]}`;
        } else {
          colloquial = formal;
        }
      }
    }

    const words = style === 'formal' ? formal : style === 'colloquial' ? colloquial : formal;
    const languageName = language === 'ru' ? t('time-to-words.russian') : language === 'kz' ? t('time-to-words.kazakh') : t('time-to-words.english');
    const description = `${t('time-to-words.time')} ${inputTime} ${t('time-to-words.in')} ${languageName}`;

    return { words, formal, colloquial, description };
  };

  const addToHistory = (result: TimeConversionResult) => {
    if (result.words && inputTime) {
      const newEntry: ConversionHistory = {
        id: Date.now().toString(),
        time: inputTime,
        language,
        format: timeFormat,
        result: result.words,
        timestamp: new Date()
      };

      setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
    }
  };

  const setQuickTime = (time: string) => {
    setInputTime(time);
  };

  const setCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    if (includeSeconds) {
      setInputTime(`${hours}:${minutes}:${seconds}`);
    } else {
      setInputTime(`${hours}:${minutes}`);
    }
  };

  const clearAll = () => {
    setInputTime('');
    setResults({ words: '', formal: '', colloquial: '', description: '' });
  };

  const copyResult = () => {
    if (results.words) {
      navigator.clipboard.writeText(results.words);
    }
  };

  const downloadResult = () => {
    if (results.words) {
      const languageName = language === 'ru' ? t('time-to-words.russian') : language === 'kz' ? t('time-to-words.kazakh') : t('time-to-words.english');
      const formatName = timeFormat === '24h' ? t('time-to-words.format24h') : t('time-to-words.format12h');

      let content = `${t('time-to-words.downloadTitle')}\n\n`;
      content += `${t('time-to-words.originalTime')}: ${inputTime}\n`;
      content += `${t('time-to-words.languageLabel')}: ${languageName}\n`;
      content += `${t('time-to-words.formatLabel')}: ${formatName}\n`;
      content += `${t('time-to-words.styleLabel')}: ${style === 'formal' ? t('time-to-words.formal') : style === 'colloquial' ? t('time-to-words.colloquial') : t('time-to-words.bothStyles')}\n\n`;

      if (style === 'both') {
        content += `${t('time-to-words.formal')}: ${results.formal}\n`;
        content += `${t('time-to-words.colloquial')}: ${results.colloquial}\n`;
      } else {
        content += `${t('time-to-words.result')}: ${results.words}\n`;
      }

      content += `\n${t('time-to-words.createdAt')}: ${new Date().toLocaleString('ru-RU')}`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('time-to-words.downloadFilename');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  useEffect(() => {
    const result = convertTimeToWords();
    setResults(result);
    if (result.words && !result.words.includes(t('time-to-words.invalidFormat').substring(0, 10))) {
      addToHistory(result);
    }
  }, [inputTime, language, timeFormat, includeSeconds, style]);

  const languages = [
    { id: 'ru', name: t('time-to-words.russian'), flag: '🇷🇺' },
    { id: 'kz', name: t('time-to-words.kazakh'), flag: '🇰🇿' },
    { id: 'en', name: t('time-to-words.english'), flag: '🇺🇸' }
  ];

  const timeFormats = [
    { id: '24h', name: t('time-to-words.format24h'), description: t('time-to-words.format24hDesc') },
    { id: '12h', name: t('time-to-words.format12h'), description: t('time-to-words.format12hDesc') }
  ];

  const styles = [
    { id: 'formal', name: t('time-to-words.formal'), description: t('time-to-words.formalDesc') },
    { id: 'colloquial', name: t('time-to-words.colloquial'), description: t('time-to-words.colloquialDesc') },
    { id: 'both', name: t('time-to-words.bothStyles'), description: t('time-to-words.bothStylesDesc') }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('time-to-words.title')}</h1>
            <p className="text-gray-600">{t('time-to-words.description')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Main Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.timeParameters')}</h2>

            <div className="space-y-6">
              {/* Time Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="inputTime" className="block text-sm font-medium text-gray-700">
                    {t('time-to-words.timeToConvert')}
                  </label>
                  <button
                    onClick={setCurrentTime}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    {t('time-to-words.currentTime')}
                  </button>
                </div>
                <input
                  type="time"
                  id="inputTime"
                  value={inputTime}
                  onChange={(e) => setInputTime(e.target.value)}
                  step={includeSeconds ? "1" : "60"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('time-to-words.formatLabel')}: {includeSeconds ? t('time-to-words.formatHHMMSS') : t('time-to-words.formatHHMM')}
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('time-to-words.languageSelection')}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        language === lang.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="text-lg mb-1">{lang.flag}</div>
                      <div className="text-sm font-medium">{lang.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('time-to-words.timeFormat')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {timeFormats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => setTimeFormat(format.id as any)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        timeFormat === format.id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      <div className="font-medium mb-1">{format.name}</div>
                      <div className="text-xs text-gray-600">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('time-to-words.writingStyle')}
                </label>
                <div className="space-y-2">
                  {styles.map((styleOption) => (
                    <label key={styleOption.id} className="flex items-center">
                      <input
                        type="radio"
                        name="style"
                        value={styleOption.id}
                        checked={style === styleOption.id}
                        onChange={(e) => setStyle(e.target.value as any)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{styleOption.name}</div>
                        <div className="text-xs text-gray-600">{styleOption.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Options */}
              <div className="border-t pt-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includeSeconds"
                    checked={includeSeconds}
                    onChange={(e) => setIncludeSeconds(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includeSeconds" className="ml-2 block text-sm text-gray-700">
                    {t('time-to-words.includeSeconds')}
                  </label>
                </div>
              </div>

              {/* Quick Time Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('time-to-words.quickTimeSelect')}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['09:00', '12:00', '15:30', '18:45', '20:15', '00:00', '23:59', '12:30'].map((time) => (
                    <button
                      key={time}
                      onClick={() => setQuickTime(time)}
                      className="p-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={clearAll}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{t('time-to-words.clear')}</span>
                  </button>

                  <button
                    onClick={copyResult}
                    disabled={!results.words}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      results.words
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('time-to-words.copy')}</span>
                  </button>

                  <button
                    onClick={downloadResult}
                    disabled={!results.words}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      results.words
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('time-to-words.download')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.conversionResult')}</h2>

            {results.words ? (
              <div className="space-y-6">
                {/* Main Display */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('time-to-words.timeInWords')}
                      </h3>
                      <div className="text-blue-900 font-medium text-lg leading-relaxed">
                        {results.words}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 border-t border-blue-200 pt-3">
                    {results.description} • {t('time-to-words.formatLabel')}: {timeFormat === '24h' ? t('time-to-words.format24h') : t('time-to-words.format12h')}
                  </div>
                </div>

                {/* Both Styles Display */}
                {style === 'both' && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h4 className="text-sm font-medium text-green-900 mb-2">{t('time-to-words.formalStyle')}</h4>
                      <div className="text-green-800 font-medium">{results.formal}</div>
                    </div>

                    <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                      <h4 className="text-sm font-medium text-teal-900 mb-2">{t('time-to-words.colloquialStyle')}</h4>
                      <div className="text-teal-800 font-medium">{results.colloquial}</div>
                    </div>
                  </div>
                )}

                {/* Original Time Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{t('time-to-words.originalTime')}:</span>
                    <span className="text-lg font-bold text-gray-900 font-mono">{inputTime}</span>
                  </div>
                </div>

                {/* Examples in Other Languages */}
                {inputTime && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {t('time-to-words.sameTimeOtherLangs')}
                    </h4>
                    <div className="space-y-2">
                      {languages.filter(l => l.id !== language).map((lang) => {
                        // Быстрый пересчет для других языков
                        const currentLang = language;
                        // Временно меняем язык для получения результата
                        const timeMatch = inputTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
                        if (!timeMatch) return null;

                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;

                        const dict = timeNumbers[lang.id as keyof typeof timeNumbers];
                        let otherLangResult = '';

                        try {
                          if (lang.id === 'ru') {
                            const hoursWord = dict.hours[hours];
                            const minutesWord = convertMinutesToWords(minutes, lang.id as any);
                            const hoursForm = getWordFormRu(hours, dict.forms.hour);
                            const minutesForm = getWordFormRu(minutes, dict.forms.minute);

                            otherLangResult = `${hoursWord} ${hoursForm}`;
                            if (minutes > 0) {
                              otherLangResult += ` ${minutesWord} ${minutesForm}`;
                            }
                          } else if (lang.id === 'kz') {
                            const hoursWord = dict.hours[hours];
                            const minutesWord = convertMinutesToWords(minutes, lang.id as any);

                            otherLangResult = `${hoursWord} ${dict.forms.hour}`;
                            if (minutes > 0) {
                              otherLangResult += ` ${minutesWord} ${dict.forms.minute}`;
                            }
                          } else {
                            const hoursWord = dict.hours[hours];
                            const minutesWord = convertMinutesToWords(minutes, lang.id as any);
                            const hoursForm = getWordFormEn(hours, dict.forms.hour);
                            const minutesForm = getWordFormEn(minutes, dict.forms.minute);

                            otherLangResult = `${hoursWord} ${hoursForm}`;
                            if (minutes > 0) {
                              otherLangResult += ` ${minutesWord} ${minutesForm}`;
                            }
                          }
                        } catch (error) {
                          otherLangResult = t('time-to-words.conversionError');
                        }

                        return (
                          <div key={lang.id} className="flex items-center space-x-3 py-2 px-3 bg-gray-50 rounded">
                            <span className="text-lg">{lang.flag}</span>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{lang.name}:</div>
                              <div className="text-sm text-gray-700">{otherLangResult}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('time-to-words.enterTimeToConvert')}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('time-to-words.conversionHistory')}</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('time-to-words.clearHistory')}
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900 font-mono">{item.time}</span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">{item.result}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {languages.find(l => l.id === item.language)?.name} • {item.format}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Languages className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <div className="text-sm">{t('time-to-words.historyEmpty')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.conversionExamples')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">🇷🇺</span>
              <span>{t('time-to-words.russian')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-blue-600">14:30</div>
                <div className="text-gray-600 mt-1"><strong>{t('time-to-words.formally')}:</strong> {t('time-to-words.example1Formal')}</div>
                <div className="text-gray-600"><strong>{t('time-to-words.colloquially')}:</strong> {t('time-to-words.example1Colloquial')}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-blue-600">09:15</div>
                <div className="text-gray-600 mt-1"><strong>{t('time-to-words.formally')}:</strong> {t('time-to-words.example2Formal')}</div>
                <div className="text-gray-600"><strong>{t('time-to-words.colloquially')}:</strong> {t('time-to-words.example2Colloquial')}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">🇰🇿</span>
              <span>{t('time-to-words.kazakhTitle')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-green-600">16:45</div>
                <div className="text-gray-600 mt-1">{t('time-to-words.example3')}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-green-600">08:00</div>
                <div className="text-gray-600 mt-1">{t('time-to-words.example4')}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">🇺🇸</span>
              <span>{t('time-to-words.english')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-teal-600">21:00</div>
                <div className="text-gray-600 mt-1"><strong>{t('time-to-words.formalEn')}:</strong> {t('time-to-words.example5Formal')}</div>
                <div className="text-gray-600"><strong>{t('time-to-words.casualEn')}:</strong> {t('time-to-words.example5Casual')}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-teal-600">12:30</div>
                <div className="text-gray-600 mt-1"><strong>{t('time-to-words.formalEn')}:</strong> {t('time-to-words.example6Formal')}</div>
                <div className="text-gray-600"><strong>{t('time-to-words.casualEn')}:</strong> {t('time-to-words.example6Casual')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Language Rules */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.languageRules')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">🇷🇺 {t('time-to-words.russian')}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>{t('time-to-words.features')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('time-to-words.feature1Ru')}</li>
                <li>{t('time-to-words.feature2Ru')}</li>
                <li>{t('time-to-words.feature3Ru')}</li>
                <li>{t('time-to-words.feature4Ru')}</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2">
                {t('time-to-words.exampleRu')}
              </p>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">🇰🇿 {t('time-to-words.kazakhTitle')}</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>{t('time-to-words.featuresKz')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('time-to-words.feature1Kz')}</li>
                <li>{t('time-to-words.feature2Kz')}</li>
                <li>{t('time-to-words.feature3Kz')}</li>
                <li>{t('time-to-words.feature4Kz')}</li>
              </ul>
              <p className="text-xs text-green-700 mt-2">
                {t('time-to-words.exampleKz')}
              </p>
            </div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-3">🇺🇸 {t('time-to-words.english')}</h3>
            <div className="text-sm text-teal-800 space-y-2">
              <p><strong>{t('time-to-words.featuresEn')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('time-to-words.feature1En')}</li>
                <li>{t('time-to-words.feature2En')}</li>
                <li>{t('time-to-words.feature3En')}</li>
                <li>{t('time-to-words.feature4En')}</li>
              </ul>
              <p className="text-xs text-teal-700 mt-2">
                {t('time-to-words.exampleEn')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Guidelines */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.usageGuidelines')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('time-to-words.practicalTips')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('time-to-words.applications')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.app1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.app2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.app3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('time-to-words.app4')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('time-to-words.culturalFeatures')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('time-to-words.culturalFeaturesText')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Format Reference */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.formatReference')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('time-to-words.format24hTitle')}</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between py-1">
                <span>00:00 → </span>
                <span className="font-medium">{t('time-to-words.midnight')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>06:00 → </span>
                <span className="font-medium">{t('time-to-words.sixAM')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>12:00 → </span>
                <span className="font-medium">{t('time-to-words.noon')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>18:00 → </span>
                <span className="font-medium">{t('time-to-words.sixPM')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">{t('time-to-words.colloquialFormsRu')}</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between py-1">
                <span>XX:15 → </span>
                <span className="font-medium">{t('time-to-words.quarter')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>XX:30 → </span>
                <span className="font-medium">{t('time-to-words.half')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>XX:45 → </span>
                <span className="font-medium">{t('time-to-words.quarterTo')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>XX:00 → </span>
                <span className="font-medium">{t('time-to-words.exactly')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('time-to-words.importantPoints')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• {t('time-to-words.point1')}</p>
                <p>• {t('time-to-words.point2')}</p>
                <p>• {t('time-to-words.point3')}</p>
                <p>• {t('time-to-words.point4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cultural Context */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('time-to-words.culturalContext')}</h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-red-50 rounded-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📻</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('time-to-words.radioTV')}</h3>
            <p className="text-gray-600 text-sm">
              {t('time-to-words.radioTVText')}
            </p>
          </div>

          <div className="text-center p-6 bg-green-50 rounded-lg">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('time-to-words.education')}</h3>
            <p className="text-gray-600 text-sm">
              {t('time-to-words.educationText')}
            </p>
          </div>

          <div className="text-center p-6 bg-blue-50 rounded-lg">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('time-to-words.automation')}</h3>
            <p className="text-gray-600 text-sm">
              {t('time-to-words.automationText')}
            </p>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {results && results.words && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: 'Время прописью',
              subtitle: 'Конвертация времени',
              sections: [
                {
                  title: 'Результат',
                  data: [
                    { label: 'Время прописью', value: results.words },
                    { label: 'Формальное', value: results.formal },
                    { label: 'Разговорное', value: results.colloquial },
                  ]
                }
              ],
              footer: 'Расчёт выполнен на calk.kz'
            }}
            filename="time-to-words-result"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('time-to-words.faq.q1'), answer: t('time-to-words.faq.a1') },
          { question: t('time-to-words.faq.q2'), answer: t('time-to-words.faq.a2') },
          { question: t('time-to-words.faq.q3'), answer: t('time-to-words.faq.a3') },
          { question: t('time-to-words.faq.q4'), answer: t('time-to-words.faq.a4') },
          { question: t('time-to-words.faq.q5'), answer: t('time-to-words.faq.a5') }
        ]}
        sources={[
          { title: 'Правила произношения времени', url: 'https://gramota.ru/' },
        ]}
      />

      {/* Виджет для встраивания */}
      <EmbedWidget
        calculatorId="time-to-words"
        calculatorTitle="Время прописью"
      />
    </div>
  );
}
