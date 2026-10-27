import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, Calculator, Languages, Copy, Download, RotateCcw, DollarSign, Info, AlertTriangle, Banknote, BarChart3 } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExportButtons } from '../ui/ExportButtons';
import { QuickAnswer } from '../ui/QuickAnswer';

interface ConversionResult {
  words: string;
  currency: string;
  description: string;
}

type Lang = 'ru' | 'kz' | 'en';
type Gender = 'male' | 'female' | 'neuter';
type CurrencyId = 'kzt' | 'usd' | 'rub' | 'eur';

// Род денежных единиц в русском: «один тенге», «одна копейка», «двадцать один цент»
const CURRENCY_GENDER_RU: Record<CurrencyId, { main: Gender; minor: Gender }> = {
  kzt: { main: 'male', minor: 'male' },
  usd: { main: 'male', minor: 'male' },
  rub: { main: 'male', minor: 'female' },
  eur: { main: 'male', minor: 'male' },
};

// Знаменатели десятичных дробей до 6 знаков: «семь десятых», «четырнадцать сотых»
const RU_FRACTION_NAMES = [
  ['десятая', 'десятых'], ['сотая', 'сотых'], ['тысячная', 'тысячных'],
  ['десятитысячная', 'десятитысячных'], ['стотысячная', 'стотысячных'], ['миллионная', 'миллионных'],
];
// Казахский: знаменатель в исходном падеже перед числителем — «қырық екі бүтін оннан жеті»
const KZ_FRACTION_NAMES = ['оннан', 'жүзден', 'мыңнан', 'он мыңнан', 'жүз мыңнан', 'миллионнан'];
// Английский: после «point» цифры читаются по одной — «three point one four»
const EN_DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const MAX_NUMBER = 1e15;

/** «1 234 567,89», «-0.5» → знак, целая и дробная часть строками; иначе null. */
function parseNumberInput(raw: string): { negative: boolean; intStr: string; fracStr: string } | null {
  const normalized = raw.replace(/[\s\u00a0\u202f']/g, '').replace(',', '.');
  const m = /^(-?)(\d*)(?:\.(\d+))?$/.exec(normalized);
  if (!m || (!m[2] && !m[3])) return null;
  return { negative: m[1] === '-', intStr: m[2] || '0', fracStr: m[3] || '' };
}

interface ConversionHistory {
  id: string;
  number: string;
  language: string;
  format: string;
  result: string;
  timestamp: Date;
}

export default function NumberToWordsCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [inputNumber, setInputNumber] = useState<string>('123456');
  const [language, setLanguage] = useState<Lang>(i18n.language === 'kk' ? 'kz' : 'ru');
  const [format, setFormat] = useState<'number' | 'currency'>('number');
  const [currency, setCurrency] = useState<'kzt' | 'usd' | 'rub' | 'eur'>('kzt');
  const [gender, setGender] = useState<'male' | 'female' | 'neuter'>('male');
  const [history, setHistory] = useState<ConversionHistory[]>([]);

  // Результат считается СИНХРОННО (useMemo ниже), а не через
  // useState(пустые) + useEffect: пререндер сохраняет страницу уже с текстом,
  // и если первый клиентский рендер отдаёт пустые блоки — гидратация падает
  // (#418/#425). См. эталонный рефакторинг BMICalculator.
  const EMPTY_RESULTS: ConversionResult = {
    words: '',
    currency: '',
    description: ''
  };

  // Словари для русского языка
  const ruNumbers = {
    ones: {
      male: ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
      female: ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'],
      neuter: ['', 'одно', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
    },
    tens: ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'],
    teens: ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'],
    hundreds: ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'],
    scales: [
      { name: ['', '', ''], power: 0 },
      { name: ['тысяча', 'тысячи', 'тысяч'], power: 1000 },
      { name: ['миллион', 'миллиона', 'миллионов'], power: 1000000 },
      { name: ['миллиард', 'миллиарда', 'миллиардов'], power: 1000000000 },
      { name: ['триллион', 'триллиона', 'триллионов'], power: 1000000000000 }
    ]
  };

  // Словари для казахского языка
  const kzNumbers = {
    ones: ['', 'бір', 'екі', 'үш', 'төрт', 'бес', 'алты', 'жеті', 'сегіз', 'тоғыз'],
    tens: ['', 'он', 'жиырма', 'отыз', 'қырық', 'елу', 'алпыс', 'жетпіс', 'сексен', 'тоқсан'],
    hundreds: ['', 'жүз', 'екі жүз', 'үш жүз', 'төрт жүз', 'бес жүз', 'алты жүз', 'жеті жүз', 'сегіз жүз', 'тоғыз жүз'],
    scales: [
      { name: '', power: 0 },
      { name: 'мың', power: 1000 },
      { name: 'миллион', power: 1000000 },
      { name: 'миллиард', power: 1000000000 },
      { name: 'триллион', power: 1000000000000 }
    ]
  };

  // Словари для английского языка
  const enNumbers = {
    ones: ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'],
    teens: ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'],
    tens: ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    hundreds: ['', 'one hundred', 'two hundred', 'three hundred', 'four hundred', 'five hundred', 'six hundred', 'seven hundred', 'eight hundred', 'nine hundred'],
    scales: [
      { name: '', power: 0 },
      { name: 'thousand', power: 1000 },
      { name: 'million', power: 1000000 },
      { name: 'billion', power: 1000000000 },
      { name: 'trillion', power: 1000000000000 }
    ]
  };

  // Валюты
  const currencies = {
    kzt: {
      ru: { main: ['тенге', 'тенге', 'тенге'], minor: ['тиын', 'тиына', 'тиынов'], ratio: 100 },
      kz: { main: ['теңге', 'теңге', 'теңге'], minor: ['тиын', 'тиын', 'тиын'], ratio: 100 },
      en: { main: ['tenge', 'tenge', 'tenge'], minor: ['tiyin', 'tiyin', 'tiyin'], ratio: 100 }
    },
    usd: {
      ru: { main: ['доллар', 'доллара', 'долларов'], minor: ['цент', 'цента', 'центов'], ratio: 100 },
      kz: { main: ['доллар', 'доллар', 'доллар'], minor: ['цент', 'цент', 'цент'], ratio: 100 },
      en: { main: ['dollar', 'dollars', 'dollars'], minor: ['cent', 'cents', 'cents'], ratio: 100 }
    },
    rub: {
      ru: { main: ['рубль', 'рубля', 'рублей'], minor: ['копейка', 'копейки', 'копеек'], ratio: 100 },
      kz: { main: ['рубль', 'рубль', 'рубль'], minor: ['копейка', 'копейка', 'копейка'], ratio: 100 },
      en: { main: ['ruble', 'rubles', 'rubles'], minor: ['kopeck', 'kopecks', 'kopecks'], ratio: 100 }
    },
    eur: {
      ru: { main: ['евро', 'евро', 'евро'], minor: ['цент', 'цента', 'центов'], ratio: 100 },
      kz: { main: ['евро', 'евро', 'евро'], minor: ['цент', 'цент', 'цент'], ratio: 100 },
      en: { main: ['euro', 'euros', 'euros'], minor: ['cent', 'cents', 'cents'], ratio: 100 }
    }
  };

  // Функция для определения правильной формы слова (русский)
  const getWordForm = (number: number, forms: string[]): string => {
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

  // Преобразование числа до 999 в слова (русский)
  const convertHundredsRu = (num: number, gender: 'male' | 'female' | 'neuter' = 'male'): string => {
    if (num === 0) return '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;

    let result = '';

    if (hundreds > 0) {
      result += ruNumbers.hundreds[hundreds];
    }

    if (remainder >= 10 && remainder < 20) {
      if (result) result += ' ';
      result += ruNumbers.teens[remainder - 10];
    } else {
      if (tens > 0) {
        if (result) result += ' ';
        result += ruNumbers.tens[tens];
      }
      if (ones > 0) {
        if (result) result += ' ';
        result += ruNumbers.ones[gender][ones];
      }
    }

    return result;
  };

  // Преобразование числа до 999 в слова (казахский)
  const convertHundredsKz = (num: number): string => {
    if (num === 0) return '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;

    let result = '';

    if (hundreds > 0) {
      result += kzNumbers.hundreds[hundreds];
    }

    if (tens > 0) {
      if (result) result += ' ';
      result += kzNumbers.tens[tens];
    }

    if (ones > 0) {
      if (result) result += ' ';
      result += kzNumbers.ones[ones];
    }

    return result;
  };

  // Преобразование числа до 999 в слова (английский)
  const convertHundredsEn = (num: number): string => {
    if (num === 0) return '';

    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;

    let result = '';

    if (hundreds > 0) {
      result += enNumbers.hundreds[hundreds];
    }

    if (remainder >= 10 && remainder < 20) {
      if (result) result += ' ';
      result += enNumbers.teens[remainder - 10];
    } else if (tens > 0 || ones > 0) {
      if (result) result += ' ';
      result += tens > 0 ? enNumbers.tens[tens] + (ones > 0 ? '-' + enNumbers.ones[ones] : '') : enNumbers.ones[ones];
    }

    return result;
  };

  // Целое неотрицательное число словами; g — род последней группы (русский)
  const numberToWords = (num: number, lang: Lang, g: Gender = 'male'): string => {
    if (num === 0) return lang === 'ru' ? 'ноль' : lang === 'kz' ? 'нөл' : 'zero';
    if (num >= MAX_NUMBER) {
      return lang === 'ru' ? 'число слишком большое' : lang === 'kz' ? 'сан тым үлкен' : 'number too large';
    }

    const scales = lang === 'ru' ? ruNumbers.scales :
                  lang === 'kz' ? kzNumbers.scales :
                  enNumbers.scales;

    let result = '';
    let remaining = Math.floor(num);

    for (let i = scales.length - 1; i >= 1; i--) {
      const scale = scales[i];
      const scaleValue = scale.power;
      if (remaining >= scaleValue) {
        const count = Math.floor(remaining / scaleValue);
        // тысяча — женского рода: «одна тысяча», «две тысячи»
        const countWords = lang === 'ru' ? convertHundredsRu(count, i === 1 ? 'female' : 'male') :
                           lang === 'kz' ? convertHundredsKz(count) : convertHundredsEn(count);
        if (result) result += ' ';
        result += countWords;
        const scaleName = typeof scale.name === 'object' ? getWordForm(count, scale.name) : scale.name;
        if (scaleName) result += ' ' + scaleName;
        remaining %= scaleValue;
      }
    }

    if (remaining > 0) {
      const remainderWords = lang === 'ru' ? convertHundredsRu(remaining, g) :
                             lang === 'kz' ? convertHundredsKz(remaining) : convertHundredsEn(remaining);
      if (result) result += ' ';
      result += remainderWords;
    }

    return result.trim();
  };

  const minusWord = (lang: Lang) => (lang === 'en' ? 'minus' : 'минус');

  // Число с дробью: «сорок две целых семь десятых», «қырық екі бүтін оннан жеті», «forty-two point seven»
  const convertNumber = (raw: string, lang: Lang): { words: string; rounded: boolean } | null => {
    const parsed = parseNumberInput(raw);
    if (!parsed) return null;
    let intNum = Number(parsed.intStr);
    let frac = parsed.fracStr;
    let rounded = false;
    if (frac.length > 6) {
      const r = Math.round(Number('0.' + frac) * 1e6);
      rounded = true;
      if (r >= 1e6) { intNum += 1; frac = ''; } else { frac = String(r).padStart(6, '0').replace(/0+$/, ''); }
    }
    const fracNum = frac ? Number(frac) : 0;
    let words: string;
    if (intNum >= MAX_NUMBER) {
      words = numberToWords(intNum, lang);
    } else if (!fracNum) {
      words = numberToWords(intNum, lang, gender);
    } else if (lang === 'ru') {
      const [one, many] = RU_FRACTION_NAMES[frac.length - 1];
      words = `${numberToWords(intNum, 'ru', 'female')} ${getWordForm(intNum, ['целая', 'целых', 'целых'])} ` +
        `${numberToWords(fracNum, 'ru', 'female')} ${getWordForm(fracNum, [one, many, many])}`;
    } else if (lang === 'kz') {
      words = `${numberToWords(intNum, 'kz')} бүтін ${KZ_FRACTION_NAMES[frac.length - 1]} ${numberToWords(fracNum, 'kz')}`;
    } else {
      words = `${numberToWords(intNum, 'en')} point ${frac.split('').map(d => EN_DIGITS[Number(d)]).join(' ')}`;
    }
    if (parsed.negative && (intNum > 0 || fracNum > 0) && intNum < MAX_NUMBER) words = `${minusWord(lang)} ${words}`;
    return { words, rounded };
  };

  // Сумма: копейки/тиыны округляются до 2 знаков с переносом (1,999 → два тенге)
  const convertCurrency = (raw: string, curr: CurrencyId, lang: Lang): string | null => {
    const parsed = parseNumberInput(raw);
    if (!parsed) return null;
    let major = Number(parsed.intStr);
    const frac3 = (parsed.fracStr + '000').slice(0, 3);
    let minor = Number(frac3.slice(0, 2)) + (Number(frac3[2]) >= 5 ? 1 : 0);
    if (minor === 100) { major += 1; minor = 0; }
    if (major >= MAX_NUMBER) return numberToWords(major, lang);

    const data = currencies[curr][lang];
    const g = CURRENCY_GENDER_RU[curr];
    const form = (n: number, forms: string[]) => (lang === 'en' ? (n === 1 ? forms[0] : forms[1]) : getWordForm(n, forms));
    const parts: string[] = [];
    if (major > 0 || minor === 0) parts.push(`${numberToWords(major, lang, g.main)} ${form(major, data.main)}`);
    if (minor > 0) parts.push(`${numberToWords(minor, lang, g.minor)} ${form(minor, data.minor)}`);
    const words = parts.join(' ');
    return parsed.negative && (major > 0 || minor > 0) ? `${minusWord(lang)} ${words}` : words;
  };

  const convertValue = (raw: string, lang: Lang): string | null => (
    format === 'currency' ? convertCurrency(raw, currency, lang) : convertNumber(raw, lang)?.words ?? null
  );

  // Основная функция конвертации (чистая: запись в историю — отдельным useEffect)
  const computeConversion = (): ConversionResult => {
    if (inputNumber.trim() === '') {
      return EMPTY_RESULTS;
    }

    if (format === 'currency') {
      const words = convertCurrency(inputNumber, currency, language);
      if (words === null) return { words: t('number-to-words.invalidInput'), currency: '', description: '' };
      return { words, currency: words, description: t('number-to-words.currencyRecordDescription', { number: inputNumber }) };
    }

    const converted = convertNumber(inputNumber, language);
    if (!converted) return { words: t('number-to-words.invalidInput'), currency: '', description: '' };
    const description = t('number-to-words.numberRecordDescription', { number: inputNumber }) +
      (converted.rounded ? ` • ${t('number-to-words.roundedTo6')}` : '');
    return { words: converted.words, currency: '', description };
  };

  const addToHistory = (number: string, result: string) => {
    const newEntry: ConversionHistory = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      number,
      language,
      format,
      result,
      timestamp: new Date()
    };

    setHistory(prev => [newEntry, ...prev.slice(0, 9)]);
  };

  const copyResult = () => {
    if (results.words) {
      navigator.clipboard.writeText(results.words);
    }
  };

  const downloadResult = () => {
    if (results.words) {
      const languageName = language === 'ru' ? t('number-to-words.russian') : language === 'kz' ? t('number-to-words.kazakh') : t('number-to-words.english');
      const formatName = format === 'currency' ? t('number-to-words.currencyFormat') : t('number-to-words.numberFormat');

      const content = t('number-to-words.downloadHeader') + '\n\n';
      const details = t('number-to-words.originalNumber') + ': ' + inputNumber + '\n';
      const langDetails = t('number-to-words.language') + ': ' + languageName + '\n';
      const formatDetails = t('number-to-words.format') + ': ' + formatName + '\n';
      const resultText = t('number-to-words.result') + ': ' + results.words + '\n\n';
      const timestamp = t('number-to-words.createdAt') + ': ' + new Date().toLocaleString('ru-RU');

      const blob = new Blob([content + details + langDetails + formatDetails + resultText + timestamp], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t('number-to-words.downloadFilename');
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const clearAll = () => {
    setInputNumber('');
  };

  const setQuickNumber = (number: string) => {
    setInputNumber(number);
  };

  // Синхронный расчёт: значения готовы уже на ПЕРВОМ рендере, поэтому
  // клиентская разметка совпадает с пререндеренной и гидратация проходит.
  const results = useMemo(
    computeConversion,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputNumber, language, format, currency, gender, i18n.language]
  );

  // Запись в историю — побочный эффект (Date.now/Math.random внутри
  // addToHistory), поэтому НЕ переносится в useMemo и остаётся в useEffect.
  useEffect(() => {
    if ((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) return; // история не должна попадать в статику
    if (inputNumber !== '') {
      addToHistory(inputNumber, results.words);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputNumber, language, format, currency, gender]);

  const languages = [
    { id: 'ru', name: t('number-to-words.russianLanguage'), flag: '🇷🇺' },
    { id: 'kz', name: t('number-to-words.kazakhLanguage'), flag: '🇰🇿' },
    { id: 'en', name: t('number-to-words.englishLanguage'), flag: '🇺🇸' }
  ];

  const currencyOptions = [
    { id: 'kzt', name: t('number-to-words.tenge'), symbol: '₸', flag: '🇰🇿' },
    { id: 'usd', name: t('number-to-words.dollar'), symbol: '$', flag: '🇺🇸' },
    { id: 'rub', name: t('number-to-words.ruble'), symbol: '₽', flag: '🇷🇺' },
    { id: 'eur', name: t('number-to-words.euro'), symbol: '€', flag: '🇪🇺' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="number-to-words" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('number-to-words.title')}</h1>
            <p className="text-gray-600">{t('number-to-words.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-8">
          {/* Main Input */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.conversionParams')}</h2>

            <div className="space-y-6">
              {/* Number Input */}
              <div>
                <label htmlFor="inputNumber" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('number-to-words.numberToConvert')}
                </label>
                <input
                  type="text"
                  id="inputNumber"
                  value={inputNumber}
                  onChange={(e) => setInputNumber(e.target.value)}
                  placeholder={t('number-to-words.inputPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('number-to-words.inputHelp')}
                </p>
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('number-to-words.writingLanguage')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as 'ru' | 'kz' | 'en')}
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

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('number-to-words.writingFormat')}
                </label>
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                  <button
                    onClick={() => setFormat('number')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      format === 'number'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Type className="w-5 h-5 mb-2" />
                    <div className="font-medium">{t('number-to-words.numeral')}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('number-to-words.regularNumber')}</div>
                  </button>
                  <button
                    onClick={() => setFormat('currency')}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      format === 'currency'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Banknote className="w-5 h-5 mb-2" />
                    <div className="font-medium">{t('number-to-words.currencyWriting')}</div>
                    <div className="text-xs text-gray-600 mt-1">{t('number-to-words.withCurrency')}</div>
                  </button>
                </div>
              </div>

              {/* Currency Selection */}
              {format === 'currency' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('number-to-words.currency')}
                  </label>
                  <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
                    {currencyOptions.map((curr) => (
                      <button
                        key={curr.id}
                        onClick={() => setCurrency(curr.id as 'kzt' | 'usd' | 'rub' | 'eur')}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                          currency === curr.id
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span>{curr.flag}</span>
                          <span className="font-medium">{curr.symbol}</span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">{curr.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Numbers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('number-to-words.quickSelect')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Без текущего года: new Date() при рендере расходится с пререндером после Нового года. */}
                  {['4', '21', '100', '1000', '12345', '1000000', '42.7', '3.14'].map((number) => (
                    <button
                      key={number}
                      onClick={() => setQuickNumber(number)}
                      className="p-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-blue-100 hover:text-blue-700 transition-colors"
                    >
                      {number}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={clearAll}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t('number-to-words.clear')}</span>
                </button>

                <button
                  onClick={copyResult}
                  disabled={!results.words}
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    results.words
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('number-to-words.copy')}</span>
                </button>

                <button
                  onClick={downloadResult}
                  disabled={!results.words}
                  className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    results.words
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{t('number-to-words.download')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          {language === 'ru' && format === 'number' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.advancedSettings')}</h2>

              <div className="space-y-4">
                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('number-to-words.numeralGender')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    <button
                      onClick={() => setGender('male')}
                      className={`p-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                        gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {t('number-to-words.masculine')}
                    </button>
                    <button
                      onClick={() => setGender('female')}
                      className={`p-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                        gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {t('number-to-words.feminine')}
                    </button>
                    <button
                      onClick={() => setGender('neuter')}
                      className={`p-2 text-xs sm:text-sm rounded-lg border transition-colors ${
                        gender === 'neuter' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {t('number-to-words.neuter')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Main Result */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.conversionResult')}</h2>

            {results.words ? (
              <div className="space-y-6">
                {/* Result Display */}
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Type className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('number-to-words.numberInWords')}
                      </h3>
                      <div className="text-blue-900 font-medium text-base sm:text-lg leading-relaxed break-words">
                        {results.words}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 border-t border-blue-200 pt-3">
                    {results.description} • {t('number-to-words.language')}: {languages.find(l => l.id === language)?.name}
                  </div>
                </div>

                {/* Original Number Display */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{t('number-to-words.originalNumber')}:</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900 font-mono break-all">{inputNumber}</span>
                  </div>
                </div>

                {/* Examples in Other Languages */}
                {inputNumber && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      {t('number-to-words.sameNumberOtherLanguages')}
                    </h4>
                    <div className="space-y-2">
                      {languages.filter(l => l.id !== language).map((lang) => {
                        const otherLangResult = convertValue(inputNumber, lang.id as Lang) ?? '';

                        return (
                          <div key={lang.id} className="flex items-center space-x-3 py-2 px-3 bg-gray-50 rounded">
                            <span className="text-lg">{lang.flag}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{lang.name}:</div>
                              <div className="text-sm text-gray-700 break-words">{otherLangResult}</div>
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
                {t('number-to-words.enterNumberPrompt')}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">{t('number-to-words.conversionHistory')}</h2>
              {history.length > 0 && (
                <button
                  onClick={() => setHistory([])}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {t('number-to-words.clearHistory')}
                </button>
              )}
            </div>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {history.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-medium text-gray-900 font-mono break-all">{item.number}</span>
                      <span className="text-xs text-gray-500">
                        {item.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed break-words">{item.result}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {languages.find(l => l.id === item.language)?.name} • {item.format === 'currency' ? t('number-to-words.currencyLabel') : t('number-to-words.numberLabel')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <div className="w-8 h-8 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                  <Languages className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-sm">{t('number-to-words.historyEmpty')}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.usageExamples')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">📋</span>
              <span>{t('number-to-words.documentFlow')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-blue-600 text-sm">1234567</div>
                <div className="text-gray-600 mt-1 text-xs leading-relaxed break-words">{t('number-to-words.example1')}</div>
              </div>
              <p className="text-xs text-gray-500">{t('number-to-words.example1Description')}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">💰</span>
              <span>{t('number-to-words.financialDocuments')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-green-600 text-sm">15750.25</div>
                <div className="text-gray-600 mt-1 text-xs leading-relaxed break-words">{t('number-to-words.example2')}</div>
              </div>
              <p className="text-xs text-gray-500">{t('number-to-words.example2Description')}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <span className="text-xl">🔢</span>
              <span>{t('number-to-words.decimalNumbers')}</span>
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="bg-gray-50 p-3 rounded">
                <div className="font-mono text-teal-600 text-sm">42.7</div>
                <div className="text-gray-600 mt-1 text-xs leading-relaxed">{t('number-to-words.example3')}</div>
              </div>
              <p className="text-xs text-gray-500">{t('number-to-words.example3Description')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Language Rules */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.writingRules')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">🇷🇺 {t('number-to-words.russianLanguage')}</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p><strong>{t('number-to-words.features')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('number-to-words.russianFeature1')}</li>
                <li>{t('number-to-words.russianFeature2')}</li>
                <li>{t('number-to-words.russianFeature3')}</li>
                <li>{t('number-to-words.russianFeature4')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">🇰🇿 {t('number-to-words.kazakhLanguage')}</h3>
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>{t('number-to-words.kazakhFeaturesTitle')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('number-to-words.kazakhFeature1')}</li>
                <li>{t('number-to-words.kazakhFeature2')}</li>
                <li>{t('number-to-words.kazakhFeature3')}</li>
                <li>{t('number-to-words.kazakhFeature4')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-teal-50 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-3">🇺🇸 {t('number-to-words.englishLanguage')}</h3>
            <div className="text-sm text-teal-800 space-y-2">
              <p><strong>{t('number-to-words.featuresEn')}:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t('number-to-words.englishFeature1')}</li>
                <li>{t('number-to-words.englishFeature2')}</li>
                <li>{t('number-to-words.englishFeature3')}</li>
                <li>{t('number-to-words.englishFeature4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Supported Ranges */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.supportedRanges')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📊 {t('number-to-words.numberRanges')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex justify-between py-1">
                <span>{t('number-to-words.minNumber')}:</span>
                <span className="font-mono text-xs">−999 999 999 999 999</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{t('number-to-words.maxNumber')}:</span>
                <span className="font-mono text-xs">999 999 999 999 999</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{t('number-to-words.fractionalPart')}:</span>
                <span className="font-mono text-xs">{t('number-to-words.upTo6Digits')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>{t('number-to-words.currencyPrecision')}:</span>
                <span className="font-mono text-xs">{t('number-to-words.twoDigits')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">⚠️ {t('number-to-words.importantNotes')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>{t('number-to-words.largeNumbersWarning')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{t('number-to-words.separatorsInfo')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <Languages className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{t('number-to-words.kazakhOrthography')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <DollarSign className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                <span>{t('number-to-words.currencyRounding')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                {t('number-to-words.practicalApplication')}
              </h3>
              <p className="text-blue-800 text-sm">
                {t('number-to-words.practicalApplicationDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tips and Tricks */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.usageTips')}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">💡 {t('number-to-words.helpfulTips')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.tip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.tip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.tip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.tip4')}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🎯 {t('number-to-words.inputFormats')}</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.formatTip1')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.formatTip2')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.formatTip3')}</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <span>{t('number-to-words.formatTip4')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Documents Usage */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('number-to-words.documentUsage')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">✅ {t('number-to-words.requiredFor')}</h4>
            <div className="space-y-1 text-sm text-green-800">
              <div>• {t('number-to-words.requiredDoc1')}</div>
              <div>• {t('number-to-words.requiredDoc2')}</div>
              <div>• {t('number-to-words.requiredDoc3')}</div>
              <div>• {t('number-to-words.requiredDoc4')}</div>
              <div>• {t('number-to-words.requiredDoc5')}</div>
              <div>• {t('number-to-words.requiredDoc6')}</div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3">📝 {t('number-to-words.standardPhrases')}</h4>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="bg-white p-2 rounded text-xs">
                <strong>{t('number-to-words.example')}:</strong> {t('number-to-words.phraseExample1')}
              </div>
              <div className="bg-white p-2 rounded text-xs">
                <strong>{t('number-to-words.example')}:</strong> {t('number-to-words.phraseExample2')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900 mb-1">
                {t('number-to-words.officialDocsRecommendations')}
              </h3>
              <div className="text-amber-800 text-sm space-y-1">
                <p>• {t('number-to-words.recommendation1')}</p>
                <p>• {t('number-to-words.recommendation2')}</p>
                <p>• {t('number-to-words.recommendation3')}</p>
                <p>• {t('number-to-words.recommendation4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Экспорт результатов */}
      {results && results.words && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('number-to-words.title'),
              subtitle: results.currency || t('number-to-words.noCurrency'),
              sections: [
                {
                  title: t('number-to-words.resultLabel'),
                  data: [
                    { label: t('number-to-words.resultLabel'), value: results.words },
                  ]
                }
              ],
              footer: t('number-to-words.exportFooter')
            }}
            filename="number-to-words-result"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('number-to-words.faq.q1'), answer: t('number-to-words.faq.a1') },
          { question: t('number-to-words.faq.q2'), answer: t('number-to-words.faq.a2') },
          { question: t('number-to-words.faq.q3'), answer: t('number-to-words.faq.a3') },
          { question: t('number-to-words.faq.q4'), answer: t('number-to-words.faq.a4') },
          { question: t('number-to-words.faq.q5'), answer: t('number-to-words.faq.a5') }
        ]}
        sources={[
          // Стандарта РК о записи сумм прописью нет (СТ РК 1042-2001 отменён, ГОСТ Р 7.0.97 — российский).
          { title: i18n.language === 'kk' ? '«Қазақстан Республикасындағы вексель айналысы туралы» Заң, 6-бап — сома жазумен және цифрмен' : 'Закон РК «О вексельном обращении в РК», ст. 6 — сумма прописью и цифрами', url: `https://adilet.zan.kz/${i18n.language === 'kk' ? 'kaz' : 'rus'}/docs/Z970000097_` },
          { title: i18n.language === 'kk' ? 'ҚР ҚМ 2012 ж. 20.12. № 562 бұйрығы — бастапқы есепке алу құжаттарының нысандары (кассалық ордерлер)' : 'Приказ МФ РК от 20.12.2012 № 562 — формы первичных учётных документов (кассовые ордера)', url: `https://adilet.zan.kz/${i18n.language === 'kk' ? 'kaz' : 'rus'}/docs/V1200008265` },
        ]}
      />

      {/* Виджет для встраивания */}
      <ExpertBlock />
      <EmbedWidget
        calculatorId="number-to-words"
        calculatorTitle={t('number-to-words.title')}
      />
      <LastUpdated calculatorId="number-to-words" />
    </div>
  );
}
