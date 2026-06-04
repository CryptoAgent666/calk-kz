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
const OUT = path.join(__dirname, '..', 'public', 'llms.txt');

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

const HEADER = `# Calk.kz

> Бесплатные онлайн-калькуляторы для жителей Казахстана. Все расчёты по актуальному законодательству РК 2026 года.

Calk.kz — платформа с онлайн-калькуляторами, охватывающими налоги, финансы, автомобили, социальные выплаты, коммунальные услуги, недвижимость, строительство, образование, религиозные расчёты и другие сферы жизни в Казахстане. Все расчёты выполняются локально в браузере — данные пользователей не передаются на сервер.

## Основатель

Константин Яковлев — основатель Calk.kz, Zanimaem.kz и Profinance.kz. Более 14 лет в маркетинге, свыше 8 лет в финансовой аналитике.

## Актуальные данные на 2026 год

- МРП (Месячный расчётный показатель): 4 325 тенге
- МЗП (Минимальная заработная плата): 85 000 тенге
- НДС: 16% (с 1 января 2025)
- Базовый налоговый вычет по ИПН: 30 МРП (129 750 тенге) в месяц
- ОПВ: 10% · ОПВР: 3.5% · ВОСМС: 2% · СО: 3.5%
- Упрощёнка ИП: 4% ИПН (социальный налог отменён с 2026)
- Пенсионный возраст: мужчины 63, женщины 61
- Базовая ставка НБРК: 15.25%`;

const FOOTER = `## Языки

Сайт доступен на русском (calk.kz) и казахском (calk.kz/__kk/).

## Источники данных

- Налоговый кодекс Республики Казахстан (adilet.zan.kz)
- Трудовой кодекс РК (adilet.zan.kz)
- Данные Национального банка РК (НБРК)
- Закон РК «О пенсионном обеспечении»
- Закон РК «Об обязательном социальном страховании»
- eGov.kz, КГД МФ РК, ЕНПФ, ГФСС

## Контакты

- Email: info@calk.kz
- Сайт: https://calk.kz
- Связанные проекты: https://zanimaem.kz, https://profinance.kz`;

function build() {
  const categories = loadCategories();
  const totalCalcs = categories.reduce((n, c) => n + c.calculators.length, 0);

  const sections = categories
    .map((cat) => {
      const items = cat.calculators
        .map((c) => `- /calculator/${c.id}/ — ${c.title}`)
        .join('\n');
      return `### ${cat.title}\n${items}`;
    })
    .join('\n\n');

  const body = `${HEADER}

## Категории калькуляторов (${totalCalcs} калькуляторов в ${categories.length} категориях)

${sections}

${FOOTER}
`;

  fs.writeFileSync(OUT, body, 'utf-8');
  console.log(`✅ llms.txt: ${totalCalcs} калькуляторов, ${categories.length} категорий → ${path.relative(process.cwd(), OUT)}`);
}

build();
