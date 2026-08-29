#!/usr/bin/env node
/**
 * Гард прозы: ищет в исходниках КОНКРЕТНЫЕ устаревшие значения («было»),
 * которые когда-то были верны. Один факт живёт в 5+ местах (компонент, ставки,
 * статья, FAQ, worked example, локали) — правка регулярно доезжает не до всех;
 * августовский обход calk.uz показал, что ВЕСЬ класс реальных ошибок — именно
 * такой рассинхрон, а не формулы.
 *
 * Список пар — scripts/stale-values.json (генерится из drift-отчётов флота:
 * DATA_HUB/tools/gen_stale_values.py; пополняется при каждом phase4 — «добавили
 * новое значение — впишите старое»).
 *
 * Запись с pending_fix:true — ИЗВЕСТНЫЙ незакрытый хвост (см. apply-план):
 * печатается как warning и деплой НЕ блокирует; после починки флаг снять —
 * дальше значение охраняется блокирующе. Ложное срабатывание на легитимной
 * истории («ставка выросла с X») — сузьте запись полем ctx (regex по строке),
 * не удаляйте её.
 *
 * Тираж по флоту 29.08.2026; оригинал идеи — calk-uz/scripts/check-stale-prose.mjs.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const CFG = JSON.parse(readFileSync(new URL('./stale-values.json', import.meta.url), 'utf8'))

function* walk(dir) {
  let names
  try { names = readdirSync(dir) } catch { return }
  for (const n of names) {
    const p = join(dir, n)
    if (CFG.skip.some((s) => p.includes(s))) continue
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) yield* walk(p)
    else if (CFG.extensions.some((e) => n.endsWith(e))) yield p
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// целое ≥4 цифр ловим и в вариантах с разделителями тысяч: 1902 | 1,902 | 1 902 | 1_902
function patternFor(was) {
  const raw = String(was)
  if (/^\d{4,}$/.test(raw)) {
    const grouped = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '[,_\\s ]?')
    return new RegExp(`(?<![\\d.,])(?:${grouped})(?![\\d])`)
  }
  return new RegExp(`(?<![\\d])${esc(raw)}(?![\\d])`)
}

let errors = 0, warns = 0
for (const root of CFG.roots) {
  for (const file of walk(root)) {
    let lines
    try { lines = readFileSync(file, 'utf8').split('\n') } catch { continue }
    lines.forEach((line, i) => {
      for (const e of CFG.entries) {
        if (!patternFor(e.was).test(line)) continue
        if (e.ctx && !new RegExp(e.ctx, 'i').test(line)) continue
        // старое И новое значение в одной строке («808.70 … was $795.20») —
        // это починенное место с историей в комменте, не хвост
        const nowTok = String(e.now).match(/\d[\d.,_ ]*/)?.[0]?.trim()
        if (nowTok && nowTok !== String(e.was) && line.includes(nowTok)) continue
        const tag = e.pending_fix ? '⚠ известный хвост (apply-план)' : '✗ УСТАРЕВШЕЕ'
        e.pending_fix ? warns++ : errors++
        console.log(`${tag} ${file}:${i + 1}  «${e.was}» → ${e.now}  [${e.what}]`)
        console.log(`   ${line.trim().slice(0, 150)}`)
      }
    })
  }
}
if (errors) {
  console.log(`\n✗ устаревших значений: ${errors}${warns ? ` (+${warns} известных хвостов)` : ''}`)
  console.log('Чинить текст ИЛИ (легитимная история) сузить запись полем ctx в scripts/stale-values.json.')
} else {
  console.log(`\n✓ блокирующих устареваний нет${warns ? ` (${warns} известных хвостов ждут apply-сессию)` : ''}`)
}
process.exit(errors ? 1 : 0)
