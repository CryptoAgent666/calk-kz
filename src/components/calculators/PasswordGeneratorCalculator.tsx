import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Key, Copy, RefreshCw, ShieldCheck } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';
import { pluralize } from '../../utils/pluralize';
import { NUMBER_LOCALE } from '../../utils/localeFormat';

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR = 'iIl1Lo0O';

/** Равномерное случайное число 0…max-1 без смещения остатка (отбрасываем «хвост» диапазона). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function charsets(useUpper: boolean, useLower: boolean, useDigits: boolean, useSymbols: boolean, excludeSimilar: boolean): string[] {
  const sets: string[] = [];
  if (useUpper) sets.push(UPPER);
  if (useLower) sets.push(LOWER);
  if (useDigits) sets.push(DIGITS);
  if (useSymbols) sets.push(SYMBOLS);
  return sets.map(set => (excludeSimilar ? set.split('').filter(c => !SIMILAR.includes(c)).join('') : set));
}

// В пароле есть хотя бы по одному символу каждого выбранного набора: иначе в 14,5% паролей
// из 16 символов не было цифры, и сайты с обязательной цифрой их отклоняли.
function generatePassword(
  length: number,
  useUpper: boolean,
  useLower: boolean,
  useDigits: boolean,
  useSymbols: boolean,
  excludeSimilar: boolean
): string {
  const sets = charsets(useUpper, useLower, useDigits, useSymbols, excludeSimilar);
  const chars = sets.join('');
  if (!chars) return '';

  const result: string[] = [];
  if (length >= sets.length) sets.forEach(set => result.push(set[randomIndex(set.length)]));
  while (result.length < length) result.push(chars[randomIndex(chars.length)]);
  // Перемешивание Фишера — Йетса, чтобы обязательные символы не стояли в начале
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result.join('');
}

interface StrengthInfo {
  score: number;
  label: string;
  bg: string;
  border: string;
  text: string;
  icon: string;
  bar: string;
}

/** Энтропия случайного пароля, бит: длина × log2(размер алфавита генератора). */
function passwordEntropy(length: number, alphabetSize: number): number {
  return alphabetSize > 1 ? length * Math.log2(alphabetSize) : 0;
}

// Метка — по той же энтропии, что и время взлома: раньше 4 символа были «Средним» при «мгновенно»
function calculateStrength(bits: number): StrengthInfo {
  const score = Math.min(bits / 100, 1);
  if (bits < 40) return { score, label: 'weak', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600', bar: 'bg-red-500' };
  if (bits < 60) return { score, label: 'medium', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-600', bar: 'bg-amber-500' };
  if (bits < 80) return { score, label: 'strong', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', icon: 'text-green-600', bar: 'bg-green-500' };
  return { score, label: 'veryStrong', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-600', bar: 'bg-emerald-500' };
}

// Офлайн-перебор быстрого хеша на одной видеокарте: RTX 4090 по hashcat — MD5 164 млрд/с,
// NTLM 288 млрд/с. Берём 100 млрд/с; в среднем пароль находится за половину перебора.
const GUESSES_PER_SECOND = 1e11;

function estimateCrackTime(bits: number, lang: string): string {
  if (bits <= 0) return '—';
  const seconds = Math.pow(2, bits - 1) / GUESSES_PER_SECOND;
  const kk = lang === 'kk';
  const unit = (n: number, one: string, few: string, many: string) => `${n.toLocaleString(NUMBER_LOCALE)} ${pluralize(lang, n, one, few, many)}`;

  if (seconds < 1) return kk ? 'лезде' : 'мгновенно';
  if (seconds < 60) {
    const n = Math.round(seconds);
    return kk ? `${n} секунд` : unit(n, 'секунда', 'секунды', 'секунд');
  }
  if (seconds < 3600) {
    const n = Math.round(seconds / 60);
    return kk ? `${n} минут` : unit(n, 'минута', 'минуты', 'минут');
  }
  if (seconds < 86400) {
    return unit(Math.round(seconds / 3600), 'час', 'часа', 'часов');
  }
  if (seconds < 31536000) {
    return unit(Math.round(seconds / 86400), 'день', 'дня', 'дней');
  }
  if (seconds < 31536000 * 1e6) {
    // до миллиона лет — целым числом («16 000 лет»), иначе выходило «0 млн лет»
    return unit(Math.round(seconds / 31536000), 'год', 'года', 'лет');
  }
  if (seconds < 31536000 * 1e9) {
    const n = parseFloat((seconds / 31536000 / 1e6).toFixed(1));
    return `${n.toLocaleString(NUMBER_LOCALE)} млн ${pluralize(lang, n, 'год', 'года', 'лет')}`;
  }
  return kk ? 'миллиардтаған жыл' : 'миллиарды лет';
}

export default function PasswordGeneratorCalculator() {
  const { t, i18n } = useTranslation('calculators');
  const [length, setLength] = useState<number>(16);
  const [useUpper, setUseUpper] = useState<boolean>(true);
  const [useLower, setUseLower] = useState<boolean>(true);
  const [useDigits, setUseDigits] = useState<boolean>(true);
  const [useSymbols, setUseSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [count, setCount] = useState<number>(1);
  const [multiple, setMultiple] = useState<string[]>([]);

  const regenerate = () => {
    setPassword(generatePassword(length, useUpper, useLower, useDigits, useSymbols, excludeSimilar));
    const arr: string[] = [];
    for (let i = 0; i < count; i++) {
      arr.push(generatePassword(length, useUpper, useLower, useDigits, useSymbols, excludeSimilar));
    }
    setMultiple(arr);
  };

  useEffect(() => {
    // Не генерируем при пререндере: иначе один и тот же «случайный» пароль попадал в статический HTML
    if ((window as unknown as { __PRERENDER__?: boolean }).__PRERENDER__) return;
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, useUpper, useLower, useDigits, useSymbols, excludeSimilar, count]);

  const bits = useMemo(
    () => passwordEntropy(length, charsets(useUpper, useLower, useDigits, useSymbols, excludeSimilar).join('').length),
    [length, useUpper, useLower, useDigits, useSymbols, excludeSimilar]
  );
  const strength = useMemo(() => calculateStrength(bits), [bits]);
  const crackTime = useMemo(() => estimateCrackTime(bits, i18n.language), [bits, i18n.language]);

  const handleCopy = async (pw: string) => {
    await navigator.clipboard.writeText(pw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <QuickAnswer calculatorId="password-generator" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
          <Key className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('password-gen.title')}</h1>
          <p className="text-gray-600">{t('password-gen.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="bg-gray-900 rounded-lg p-5 flex items-center gap-3">
          <div className="flex-1 font-mono text-lg text-green-400 break-all">{password || '...'}</div>
          <button onClick={() => handleCopy(password)}
            className="p-3 bg-green-600 rounded-lg text-white hover:bg-green-700">
            <Copy className="w-5 h-5" />
          </button>
          <button onClick={regenerate}
            className="p-3 bg-gray-700 rounded-lg text-white hover:bg-gray-600">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        {copied && <div className="text-sm text-green-600">{t('password-gen.copied')}</div>}

        <div className={`p-4 rounded-lg border ${strength.bg} ${strength.border}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${strength.icon}`} />
              <span className={`font-semibold ${strength.text}`}>{t(`password-gen.strength.${strength.label}`)}</span>
            </div>
            <span className="text-sm text-gray-600">{t('password-gen.entropy', { bits: Math.round(bits) })} · {t('password-gen.crackTime')}: {crackTime}</span>
          </div>
          <div className="w-full bg-white rounded-full h-2">
            <div className={`${strength.bar} h-2 rounded-full`} style={{ width: `${strength.score * 100}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">{t('password-gen.crackNote')}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('password-gen.length')}: {length}</label>
            <input type="range" min="4" max="64" value={length}
              onChange={e => setLength(parseInt(e.target.value))}
              className="w-full" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={useUpper} onChange={e => setUseUpper(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('password-gen.upper')} (A-Z)</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={useLower} onChange={e => setUseLower(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('password-gen.lower')} (a-z)</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={useDigits} onChange={e => setUseDigits(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('password-gen.digits')} (0-9)</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
              <input type="checkbox" checked={useSymbols} onChange={e => setUseSymbols(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm">{t('password-gen.symbols')} (!@#...)</span>
            </label>
          </div>

          <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input type="checkbox" checked={excludeSimilar} onChange={e => setExcludeSimilar(e.target.checked)} className="h-4 w-4" />
            <span className="text-sm">{t('password-gen.excludeSimilar')}</span>
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('password-gen.count')}: {count}</label>
            <input type="range" min="1" max="20" value={count}
              onChange={e => setCount(parseInt(e.target.value))}
              className="w-full" />
          </div>
        </div>

        {count > 1 && multiple.length > 1 && (
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-3">{t('password-gen.multiple')}</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {multiple.map((pw, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <div className="flex-1 font-mono text-sm break-all">{pw}</div>
                  <button onClick={() => handleCopy(pw)} className="p-1 hover:bg-gray-200 rounded">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
          <strong>🔒 {t('password-gen.privacy')}</strong> {t('password-gen.privacyText')}
        </div>
      </div>

      <ExpertBlock />
      <FAQSection items={[
        { question: t('password-gen.faq.q1'), answer: t('password-gen.faq.a1') },
        { question: t('password-gen.faq.q2'), answer: t('password-gen.faq.a2') },
        { question: t('password-gen.faq.q3'), answer: t('password-gen.faq.a3') },
        { question: t('password-gen.faq.q4'), answer: t('password-gen.faq.a4') },
        { question: t('password-gen.faq.q5'), answer: t('password-gen.faq.a5') },
      ]} 
          sources={getSources('password-generator')}
        />
      <EmbedWidget calculatorId="password-generator" calculatorTitle={t('password-gen.title')} />
      <LastUpdated calculatorId="password-generator" />
    </div>
  );
}
