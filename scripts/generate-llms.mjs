#!/usr/bin/env node
/**
 * Генератор public/llms.txt из реестра калькуляторов (src/data/calculators.ts).
 * Гарантирует, что в llms.txt перечислены ВСЕ калькуляторы (а не подмножество),
 * чтобы LLM-краулеры (ChatGPT/Perplexity/AI Overviews) видели полный каталог.
 *
 * Запуск: node scripts/generate-llms.mjs   (также вызывается из build:prerender)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, '..', 'src', 'data', 'calculators.ts');
const LEDGER = path.join(__dirname, '..', 'src', 'data', 'regulatory-constants.canonical.json');
const OUT = path.join(__dirname, '..', 'public', 'llms.txt');

const YEAR = 2026;

/**
 * Константы шапки берутся из реестра, а не хардкодом: реестр сверяется с
 * первоисточниками, а хардкод здесь не видел никто — до 18.09.2026 в llms.txt
 * висели ставка НБРК 15.25% (нижняя граница коридора, действовала 16,25%),
 * СО 3.5% (5% с 2025) и «НДС 16% с 1 января 2025» (с 2026).
 * Нет ключа или статус не current — сборка падает, а не пишет старое число.
 */
function loadLedger() {
  const entries = JSON.parse(fs.readFileSync(LEDGER, 'utf-8')).hardcoded_canonical;
  const byKey = new Map(entries.map((e) => [e.key, e]));
  return (key) => {
    const e = byKey.get(key);
    if (!e) throw new Error(`llms.txt: в реестре нет константы ${key}`);
    if (e.status !== 'current') throw new Error(`llms.txt: ${key} в реестре со статусом ${e.status}`);
    if (e.value === null || e.value === undefined) throw new Error(`llms.txt: у ${key} пустое value`);
    return e;
  };
}

/** 4325 → «4 325», 3.5 → «3,5» */
const fmt = (n) => {
  if (typeof n !== 'number') throw new Error(`llms.txt: ожидалось число, получено ${JSON.stringify(n)}`);
  const [int, frac] = String(n).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (frac ? `,${frac}` : '');
};

/** Парсит calculators.ts → [{ id, title, calculators: [{ id, title }] }] по отступам. */
function loadCategories() {
  const lines = fs.readFileSync(DATA, 'utf-8').split('\n');
  const categories = [];
  let pending = null; // { indent, id }
  let currentCategory = null;

  for (const line of lines) {
    const idM = line.match(/^(\s*)id:\s*'([^']+)'/);
    if (idM) {
      const indent = idM[1].length;
      pending = { indent, id: idM[2] };
      if (indent === 4) {
        currentCategory = { id: idM[2], title: idM[2], calculators: [] };
        categories.push(currentCategory);
      } else if (indent === 8 && currentCategory) {
        currentCategory.calculators.push({ id: idM[2], title: idM[2] });
      }
      continue;
    }
    const titleM = line.match(/^(\s*)title:\s*'((?:[^'\\]|\\.)*)'/);
    if (titleM && pending && titleM[1].length === pending.indent) {
      const title = titleM[2].replace(/\\'/g, "'");
      if (pending.indent === 4 && currentCategory && currentCategory.id === pending.id) {
        currentCategory.title = title;
      } else if (pending.indent === 8 && currentCategory) {
        const calc = currentCategory.calculators.find((c) => c.id === pending.id);
        if (calc) calc.title = title;
      }
      pending = null;
    }
  }
  return categories;
}

function buildHeader() {
  const c = loadLedger();
  const v = (key) => fmt(c(key).value);
  const mrp = c(`mrp_${YEAR}`).value;
  const deductionMrp = c('ipn_standard_deduction_mrp').value;
  const nbrk = c('nbrk_base_rate');
  // Дата установления ставки живёт только в тексте law («…ставка установлена с 07.09.2026»);
  // не распознали — пишем ставку без даты, но не чужую дату.
  const nbrkSince = nbrk.law.match(/установлена с (\d{2}\.\d{2}\.\d{4})/)?.[1];
  if (!nbrkSince) console.warn('⚠️  llms.txt: не нашёл дату установления базовой ставки в nbrk_base_rate.law');

  return `# Calk.kz

> Бесплатные онлайн-калькуляторы для жителей Казахстана. Все расчёты по актуальному законодательству РК ${YEAR} года.

Calk.kz — платформа с онлайн-калькуляторами, охватывающими налоги, финансы, автомобили, социальные выплаты, коммунальные услуги, недвижимость, строительство, образование, религиозные расчёты и другие сферы жизни в Казахстане. Все расчёты выполняются локально в браузере — данные пользователей не передаются на сервер.

## Основатель

Константин Яковлев — основатель Calk.kz, Zanimaem.kz и Profinance.kz. Более 14 лет в маркетинге, свыше 8 лет в финансовой аналитике.

## Актуальные данные на ${YEAR} год

- МРП (Месячный расчётный показатель): ${fmt(mrp)} тенге
- МЗП (Минимальная заработная плата): ${v('mzp_min_wage')} тенге
- НДС: ${v('nds_vat_rate')}% (с 1 января 2026 года, новый Налоговый кодекс)
- Базовый налоговый вычет по ИПН: ${fmt(deductionMrp)} МРП (${fmt(deductionMrp * mrp)} тенге) в месяц
- ОПВ: ${v('opv_rate')}% · ОПВР: ${v('opvr_rate')}% · ВОСМС: ${v('vosms_employee_rate')}% · СО: ${v('so_rate')}%
- Упрощёнка (ИП и ТОО): ${v('snr_simplified_rate')}% ИПН/КПН с дохода, маслихат может менять ставку в пределах ${c('simplified_rate_local_adjustment_range_pct').value}%; социальный налог на упрощёнке не уплачивается
- Пенсионный возраст: мужчины ${v('retirement_age_male')}, женщины ${v('retirement_age_female')}
- Базовая ставка НБРК: ${v('nbrk_base_rate')}%${nbrkSince ? ` (с ${nbrkSince})` : ''}`;
}

const FOOTER = `## Языки

Сайт доступен на русском (calk.kz) и казахском (calk.kz/__kk/).

## Источники данных

- Налоговый кодекс Республики Казахстан от 18.07.2025 № 214-VIII, действует с 01.01.2026 (adilet.zan.kz)
- Социальный кодекс РК от 20.04.2023 № 224-VII — пенсионные взносы, социальные отчисления, пенсионный возраст (adilet.zan.kz)
- Трудовой кодекс РК (adilet.zan.kz)
- Закон РК «Об обязательном социальном медицинском страховании»
- Закон о республиканском бюджете (МРП, МЗП)
- Данные Национального банка РК (НБРК)
- eGov.kz, КГД МФ РК, ЕНПФ, ГФСС

## Контакты

- Email: info@calk.kz
- Сайт: https://calk.kz
- Связанные проекты: https://zanimaem.kz, https://profinance.kz`;

function build() {
  const categories = loadCategories();
  // Уникальные id: vehicle-tax и teacher-salary кросс-листятся в две категории
  const totalCalcs = new Set(categories.flatMap((c) => c.calculators.map((calc) => calc.id))).size;

  const sections = categories
    .map((cat) => {
      const items = cat.calculators
        .map((c) => `- /calculator/${c.id}/ — ${c.title}`)
        .join('\n');
      return `### ${cat.title}\n${items}`;
    })
    .join('\n\n');

  const body = `${buildHeader()}

## Категории калькуляторов (${totalCalcs} калькуляторов в ${categories.length} категориях)

${sections}

${FOOTER}
`;

  fs.writeFileSync(OUT, body, 'utf-8');
  console.log(`✅ llms.txt: ${totalCalcs} калькуляторов, ${categories.length} категорий → ${path.relative(process.cwd(), OUT)}`);
}

build();
