# calk.kz — Constants pilot & 2026 (НК РК) corrections (handoff)

Session log + living reference for the regulatory-constants pilot run on 2026-06-10/11
from the DATA_HUB session. Repo: `github.com/CryptoAgent666/calk-kz` (private), Vite SPA,
117 calculators, ru+kk. Third fleet site on the full pipeline (after calk24.de, calk-usa.com).

---

## TL;DR — current state

| Thing | State |
|---|---|
| Constants | **300** canonical hardcoded (`src/data/regulatory-constants.canonical.json`), completeness re-audit found 0 missed |
| Freshness | Verified vs **НК РК 2026** (new code K2500000214) on 2026-06-10: 263 checked → 170 current / 37 stale |
| Fixes | **23 high-conf applied** across 22 calculators (54 changes) + 8 content-file fixes |
| **VAT/НДС** | **16% confirmed CURRENT** (raised 12→16 on 01.01.2026) — sources saying 12% are stale |
| ЕСП | **Abolished 01.01.2024** — calculator delisted, URL redirects (public/), all orphaned data purged |
| Monitoring | Weekly server monitor (config `calk-kz-monitor-config.json`, 137 source pages) + quarterly fleet LLM verify — both live |
| **Deployed?** | ⚠️ **NOT deployed in this session** — all fixes committed + build green, production deploy pending (`npm run publish:app`) |

## 1. Inventory (what & where)

- **`src/data/regulatory-constants.canonical.json`** — 300 canonical constants (key, value,
  unit KZT/percent/МРП, law = НК РК article / Закон РК, change_frequency, used_by).
  Built via full 117-component sweep + 15-file gap pass + thematic canonicalization;
  13 recovered from estimates (ДУМК fidya/fitr, ПМ, regional heating tariffs, НК penalty,
  EV reg-fee, moral-damage ranges). 10 true estimates excluded.
- **`src/data/regulatory-constants.freshness-2026-06.json`** — verification snapshot
  (263 verdicts with official values + adilet/kgd sources).
- Key 2026 anchors: МРП **4325**, МЗП **85000**, ПМ **50851**, НДС **16%**, ИПН 10%
  (+15% over 8500 МРП/yr), ОПВ 10%, ЕП (единый платёж) 24.8%, НДС-порог **10000 МРП**,
  упрощёнка 4%, КПН 20% (с/х **3%**), patent regime **abolished** → СНР для самозанятых
  (ИПН 0% + 4% соцплатёж, ≤300 МРП/мес).
- NB: constants live hardcoded in components; `src/data/*.ts` are CONTENT files
  (methodology/examples/sources text) that EMBED regulatory numbers — they are part of
  the audit surface too (97 regulatory mentions verified there).

## 2. What was corrected (2026-06-10/11)

**Calculators (22 files, 54 changes; commit 93ad4dc):**
- Patent СНР abolished 2026 → replaced with self-employed regime (BusinessROI; i18n ru/kk).
- Notary tariffs restructured to party-based МРП (близкие родственники 4 / прочие физлица
  10 / юрлица 12 МРП за авто и т.п.) per Minjust order №957 (27.09.2025) — NotaryServices,
  CarTransfer.
- Traffic fines: DUI / oncoming lane → administrative arrest / licence revocation (not a
  МРП fine) — TrafficFines.
- КПН с/х 10→3% (ст.700), base pension max 110→**118% ПМ**, «7-20-25» limit 25→**30 млн**,
  overtime ×2→**×1.5**, property-sale ИПН exemption 1→**2 years**, unemployment coef
  40→**45%**, statute of limitations (tax 5→3 yrs; acquisitive 10→7/5), business-trip
  taxation moved to per-diem limits (6/8 МРП, ст.366), customs fee → 6 МРП fixed, etc.

**Content files (8 changes; commit 2dd0491):** court fee 0.5 МРП recalc 1731→**2162 ₸**;
patent examples → СНР для самозанятых / упрощёнка; КПН с/х example 10%→3%; НБРК base rate
in penalty formulas 16.5→**18%** (current 2026; пеня = 1.25 × ставка / 365, ст.121 НК РК).

**ЕСП purge (commit ce6de9b):** ЕСП был временным режимом 2019–2023, отменён с 01.01.2024
(КГД). Калькулятор делистнут ранее; URL `/calculator/esp-self-employed/` отдаёт статичный
redirect → tax-regime-comparison (файлы в `public/calculator|embed/esp-self-employed/`).
В этом коммите вычищены осиротевшие данные, подававшие ЕСП как живой «2026»: seoData
title/description, QuickAnswer ru/kk, methodology (4 шага), examples (3), sources,
LastUpdated, i18n ru/kk (по 68 строк). Tombstone-комментарии в methodology/examples.

**Still deferred (38 minor):** i18n placeholders (taxSimplified/taxGeneral RU/KK), exact
new-code article numbers in a few UI texts, foreign per-diem USD table vs FAQ mismatch,
ЕП-vs-ЕСП wording checks. Tracked in the DATA_HUB session workflow outputs.

## 3. Monitoring (lives on the DATA_HUB server)

- **Tier 1 weekly** (Mon 07:13 cron on mydatahub.duckdns.org): multi-site script scans
  `/opt/data_hub/calk-constants/monitor/*-monitor-config.json`; KZ config =
  `calk-kz-monitor-config.json` (287 constants, 137 source pages: adilet.zan.kz,
  kgd.gov.kz, gov.kz/egov.kz; МРП/МЗП/ПМ = annual, rates = occasional, МРП-tariffs = rare).
  Baseline seeded 2026-06-10. Combined dashboard JSON + Telegram alert on change.
- **Tier 2 quarterly** (Claude scheduled task, 8 Jan/Apr/Jul/Oct): fleet-wide LLM
  re-verification (DE+US+**KZ**) → drift report to dashboard + Telegram. No auto-apply.
- Dashboard: mydatahub.duckdns.org/dashboard → 🧮 Calculators (calk.kz = «Полный пилот»).
- The loop: alert → review → fix in THIS repo → build → deploy → (OTA picks it up).

## 4. Build & deploy (this repo's own pipeline)

- `npm run build` — vite build (SPA). `npm run build:prerender` — + static HTML prerender.
- **`npm run publish:app`** — the one-command release: build → zip web bundle → upload
  `bundle-<version>.zip` + `latest.json` to `calk.kz/app-updates/` via **FTP**
  (`.env.deploy`) → installed Android apps pick the new bundle OTA (Capgo self-hosted,
  `src/liveUpdates.ts`). Use this to ship the 2026 fixes.
- ⚠️ A Vite dev-server (PID 3085) was killed during the fix run — restart `npm run dev`
  if needed.
- Untracked android/, ios/, docs/, screenshots (37 files) intentionally left uncommitted;
  `*.keystore` now gitignored (android/calk-kz-upload.keystore stays local).

## 5. Session commits (2026-06-10/11)

```
ce6de9b Purge orphaned ЕСП data (regime abolished 01.01.2024)
2dd0491 Completeness: recover 13 estimates + fix 5 stale numbers in content data files
93ad4dc Adopt verified 2026 (НК РК) values in 22 calculators + freshness snapshot
708c6bc Add regulatory-constants canonical inventory (287 hardcoded KZ constants)
(parallel session: 5664cec LICENSE; d68e960 ЕСП redirects — pre-existing)
```

## 6. Pending / TODO

- [ ] **Deploy to production** (`npm run publish:app`) — ships НК-2026 fixes + ЕСП purge + OTA bundle.
- [ ] 38 deferred minor items (see §2) — next pass.
- [ ] 2 canonical VALUE_CONFLICTs flagged for site-side review: `vehicle_reg_fee_by_age_mrp`
      (conflated registration vs customs-age table), `ogpo_territory_coeff` (АРФР per-region).
- [ ] Quarterly verify next run: 8 Jul 2026 (fleet-wide).
