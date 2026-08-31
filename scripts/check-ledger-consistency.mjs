#!/usr/bin/env node
/**
 * Гард реестра: значение константы не должно расходиться со своим official_value.
 *
 * Зачем. В canonical.json у записи два числа: `value` — то, что стоит на сайте,
 * и `official_value` — то, что говорит первоисточник. Когда правишь константу,
 * двигать нужно ОБА. 30.08.2026 я свёл семь записей (топливо, золото закята) с
 * кодом, но official_value не тронул — и создал пять расхождений, которые нашёл
 * внешний loop_closer, а не мы сами. Этот скрипт закрывает именно тот разрыв.
 *
 * Что проверяется:
 *  1. Числовые value vs official_value — расходятся ⇒ ошибка.
 *  2. Единицы: при unit=percent значение хранится САМИМ числом процентов
 *     (customs_duty_* = 15/20), а не долей. Запись value=0.02/official=2 у
 *     patent_vs_single_tax_comparison_rate выглядела дрейфом ровно из-за этого.
 *  3. status=current без verified_date — предупреждение: «текущей» запись
 *     называть нельзя, если никто не помнит, когда её сверяли.
 *
 * official_value в свободной форме («потолки ГАМС, действуют 25.05–30.09») не
 * сравнивается автоматически — только перечисляется в конце как список для
 * ручного взгляда: именно в таком поле и протухло утверждение про потолки.
 *
 * Запуск: node scripts/check-ledger-consistency.mjs
 * Код возврата 1 — есть блокирующие расхождения.
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const LEDGERS = [
  'src/data/regulatory-constants.canonical.json',
  'lib/data/regulatory-constants.canonical.json',
  'src/lib/data/regulatory-constants.canonical.json',
]
const ledgerPath = LEDGERS.map((p) => join(root, p)).find((p) => existsSync(p))
if (!ledgerPath) {
  console.log('реестр не найден — пропускаю'); process.exit(0)
}
const raw = JSON.parse(readFileSync(ledgerPath, 'utf8'))
// Записи лежат под разными ключами: `constants` (calk.kg) или `hardcoded_canonical`
// (calk.kz, calk-au, calks.uk…). Берём первый список объектов с полем key.
const items = Array.isArray(raw)
  ? raw
  : Object.values(raw).find((v) => Array.isArray(v) && v.length && typeof v[0] === 'object' && 'key' in v[0]) ?? []

// Известные расхождения на момент внедрения гарда: печатаются как предупреждения
// и деплой НЕ блокируют (идиома pending_fix из check-stale-values). Починил —
// удали ключ из baseline, дальше он охраняется блокирующе.
const baselinePath = join(root, 'scripts/ledger-consistency-baseline.json')
const baseline = existsSync(baselinePath)
  ? new Set(JSON.parse(readFileSync(baselinePath, 'utf8')).known_mismatches ?? [])
  : new Set()

const num = (x) => {
  if (x === null || x === undefined) return null
  const s = String(x).replace(/[\s ]/g, '').replace(',', '.')
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : null
}

let errors = 0, warns = 0
const freeform = []
const noDate = []

for (const c of items) {
  if (c.status === 'removed') continue

  const v = num(c.value)
  const o = num(c.official_value)

  if (c.official_value != null && o === null) {
    freeform.push(c.key)
  } else if (v !== null && o !== null && Math.abs(v - o) > 1e-9) {
    const known = baseline.has(c.key)
    if (known) warns++; else errors++
    const ratio = o !== 0 ? v / o : NaN
    const hint =
      Math.abs(ratio - 0.01) < 1e-6 ? '  ← похоже на единицы: доля вместо процентов (×100)'
      : Math.abs(ratio - 100) < 1e-6 ? '  ← похоже на единицы: проценты вместо доли (÷100)'
      : ''
    console.log(`${known ? '⚠ известное' : '✗ НОВОЕ'} ${c.key}: value=${c.value} ≠ official_value=${c.official_value}${hint}`)
    if (!known) console.log(`   правил value — подвинь official_value и official_checked, либо объясни расхождение в verify_note`)
  }

  if (c.status === 'current' && !c.verified_date) noDate.push(c.key)
}

if (freeform.length) {
  console.log(`\nℹ official_value в свободной форме (автосверке не поддаётся, глянуть глазами): ${freeform.length}`)
}
if (noDate.length) {
  console.log(`⚠ status=current без verified_date: ${noDate.length} — например ${noDate.slice(0, 3).join(', ')}`)
}

if (errors) {
  console.log(`\n✗ НОВЫХ расхождений value vs official_value: ${errors}${warns ? ` (+${warns} известных из baseline)` : ''}`)
  process.exit(1)
}
console.log(`\n✓ реестр согласован: ${items.length} записей, новых расхождений нет${warns ? ` (${warns} известных ждут разбора)` : ''}`)
