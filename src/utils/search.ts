import i18n from '../i18n';
import { calculatorCategories } from '../data/calculators';
import { searchKeywords } from '../data/searchKeywords';
import { POPULAR_CALCULATOR_IDS } from '../data/popularCalculators';
import type { CalculatorCategory } from '../types/calculator';

type Calculator = CalculatorCategory['calculators'][number];

/**
 * Поиск калькуляторов по сайту.
 *
 * Ищет по русским И казахским заголовкам/описаниям (i18n) независимо от языка
 * интерфейса, плюс по словарю синонимов (data/searchKeywords.ts). Слова
 * сравниваются по началу с отсечением окончания, поэтому «учитель» находит
 * «учителя», «мұғалімдерге» — «мұғалім», а «уч» при наборе — уже «учителя».
 * Раньше поиск был подстрокой только по русскому заголовку — и по «мұғалім»,
 * «учитель», «зарплата учителя» выдавал «Ничего не найдено».
 */

export interface SearchHit {
  calculator: Calculator;
  category: CalculatorCategory;
  score: number;
}

interface IndexedCalculator {
  calculator: Calculator;
  category: CalculatorCategory;
  /** Слова каждого поля с весом поля */
  fields: { words: string[]; weight: number }[];
  titles: string[];
}

const WEIGHT_TITLE = 10;
const WEIGHT_KEYWORD = 8;
const WEIGHT_DESCRIPTION = 3;
const WEIGHT_CATEGORY = 1;
// Популярные поднимаются над равными по совпадению («зарплата» → сначала зарплатный калькулятор)
const POPULAR_BONUS = 2;
const POPULAR = new Set(POPULAR_CALCULATOR_IDS);

// Служебные слова запроса, которые есть почти в каждом заголовке или ничего не уточняют
const STOP_WORDS = new Set([
  'калькулятор', 'калькулятора', 'калькуляторы', 'калькуляторов', 'онлайн', 'расчет', 'рассчитать',
  'посчитать', 'подсчет', 'как', 'для', 'в', 'во', 'на', 'по', 'и', 'с', 'со', 'от', 'до', 'за',
  'сколько', 'рк', 'казахстан', 'казахстане', 'кз', 'kz', 'calk', 'calkkz', 'год', 'году',
  'калькуляторы', 'калькуляторлар', 'есептеу', 'есептегіш', 'қанша', 'үшін', 'және', 'жыл', 'жылы',
  'жылғы', 'қазақстан', 'қазақстанда', 'қр',
]);

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function toWords(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(' ') : [];
}

/** Грубое отсечение окончания: работает и для русского, и для казахского */
function stem(word: string): string {
  if (word.length >= 7) return word.slice(0, -2);
  if (word.length >= 5) return word.slice(0, -1);
  return word;
}

function wordMatches(token: string, tokenStem: string, word: string): boolean {
  // Набор по началу слова / форма слова: «учит» → «учителя», «учитель» → «учителей»
  if (word.startsWith(tokenStem)) return true;
  // Запрос длиннее слова из индекса: «мұғалімдерге» → «мұғалім», «налоговый» → «налог»
  const wordStem = stem(word);
  return wordStem.length >= 4 && token.startsWith(wordStem);
}

function resource(lang: string, ns: string, key: string): string {
  const value = i18n.getResource(lang, ns, key);
  return typeof value === 'string' ? value : '';
}

let cachedIndex: IndexedCalculator[] | null = null;

function buildIndex(): IndexedCalculator[] {
  const seen = new Set<string>();
  const index: IndexedCalculator[] = [];

  for (const category of calculatorCategories) {
    for (const calculator of category.calculators) {
      // Кросс-листинг (vehicle-tax, teacher-salary): берём первую, основную категорию
      if (seen.has(calculator.id)) continue;
      seen.add(calculator.id);

      const titles = [
        calculator.title,
        resource('ru', 'calculators', `${calculator.id}.title`),
        resource('kk', 'calculators', `${calculator.id}.title`),
      ].filter(Boolean);
      const descriptions = [
        calculator.description,
        resource('ru', 'calculators', `${calculator.id}.description`),
        resource('kk', 'calculators', `${calculator.id}.description`),
        resource('ru', 'calculators', `${calculator.id}.subtitle`),
        resource('kk', 'calculators', `${calculator.id}.subtitle`),
      ].filter(Boolean);
      const categoryTexts = [
        category.title,
        resource('ru', 'categories', `${category.id}.title`),
        resource('kk', 'categories', `${category.id}.title`),
      ].filter(Boolean);

      index.push({
        calculator,
        category,
        titles: titles.map(normalizeText),
        fields: [
          { words: titles.flatMap(toWords), weight: WEIGHT_TITLE },
          { words: (searchKeywords[calculator.id] || []).flatMap(toWords), weight: WEIGHT_KEYWORD },
          { words: descriptions.flatMap(toWords), weight: WEIGHT_DESCRIPTION },
          { words: categoryTexts.flatMap(toWords), weight: WEIGHT_CATEGORY },
        ],
      });
    }
  }

  return index;
}

function getIndex(): IndexedCalculator[] {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

function queryTokens(searchTerm: string): string[] {
  const all = toWords(searchTerm);
  const meaningful = all.filter(token => !STOP_WORDS.has(token) && !/^\d{4}$/.test(token));
  // Запрос из одних служебных слов («калькулятор») ищем как есть
  return meaningful.length > 0 ? meaningful : all;
}

export function searchCalculators(searchTerm: string): SearchHit[] {
  const tokens = queryTokens(searchTerm);
  if (tokens.length === 0) return [];

  const phrase = normalizeText(searchTerm);
  const scored: (SearchHit & { matched: number })[] = [];

  for (const entry of getIndex()) {
    let score = 0;
    let matched = 0;

    for (const token of tokens) {
      const tokenStem = stem(token);
      // Одна-две буквы (начало набора) сверяем только с заголовками и синонимами
      const fields = token.length < 3 ? entry.fields.slice(0, 2) : entry.fields;
      let best = 0;
      for (const field of fields) {
        if (field.weight > best && field.words.some(word => wordMatches(token, tokenStem, word))) {
          best = field.weight;
        }
      }
      if (best > 0) {
        matched += 1;
        score += best;
      }
    }

    if (matched === 0) continue;
    // Фраза из нескольких слов целиком в заголовке («зарплата учителя»)
    if (tokens.length > 1 && entry.titles.some(title => title.includes(phrase))) score += 20;
    if (POPULAR.has(entry.calculator.id)) score += POPULAR_BONUS;
    scored.push({ calculator: entry.calculator, category: entry.category, score, matched });
  }

  // Сначала — совпавшие по всем словам запроса; если таких нет, лучшие частичные
  const complete = scored.filter(hit => hit.matched === tokens.length);
  const pool = complete.length > 0 ? complete : scored;

  return pool
    .sort((a, b) => b.matched - a.matched || b.score - a.score)
    .map(({ calculator, category, score }) => ({ calculator, category, score }));
}
