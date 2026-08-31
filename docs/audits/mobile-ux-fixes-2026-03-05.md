# Mobile UX Fixes Implemented (05.03.2026)

## Implemented fixes

1. `rent-vs-buy`: fixed NaN in chart/summary rendering
- File: `src/components/calculators/RentOrBuyCalculator.tsx`
- Changes:
  - Added safe divisor for comparison bar widths (`safeMaxValue`) to avoid division by zero.
  - Added zero-rate mortgage guard (`monthlyRate === 0`) in annuity payment formula.
  - Fixed `additionalCosts` rendering bug where formatted string was multiplied by years, causing `NaN` in UI.

2. Stable IDs for history/items (duplicate React key prevention)
- Added helper: `src/utils/generateStableId.ts`
- Updated:
  - `src/components/calculators/CurrencyConverter.tsx`
  - `src/components/calculators/TimeConverter.tsx`
  - `src/components/calculators/NumberToWordsCalculator.tsx`
  - `src/components/calculators/TimeToWordsCalculator.tsx`
  - `src/components/calculators/VATCalculator.tsx`
  - `src/components/calculators/CasinoWinningsTaxCalculator.tsx`
  - `src/components/calculators/DateCalculator.tsx`

3. Mobile tap-target improvements in shared UI
- Added utility class `.tap-target` (`min-width: 44px; min-height: 44px`) in `src/index.css`
- Applied in shared controls:
  - `src/components/Layout.tsx` (mobile menu open/close)
  - `src/components/LanguageSwitcher.tsx` (language buttons)
  - `src/components/SearchBar.tsx` (clear search button)
  - `src/components/SharePrintButtons.tsx` (copy/download/share buttons)

## Verification

### Build
- Command: `npm run build`
- Result: success.

### Targeted regression check (problem calculators)
- Checked: `rent-vs-buy`, `currency-converter`, `time-converter`, `number-to-words`, `time-to-words`
- Result: no `NaN` warnings, no duplicate-key warnings.

### Full mobile re-audit (57 calculators)
- Before fixes:
  - `jsErrorPages`: 5
  - `calcIssuePages`: 4
  - avg small tap targets/page: 22.98
- After fixes:
  - `jsErrorPages`: 0
  - `calcIssuePages`: 3 (same three known auto-smoke false positives)
  - avg small tap targets/page: 18.40

Notes:
- Remaining `Network request failures: 2` in `date-calculator` are ad-ping aborts (`googlesyndication`) in test environment, not app logic errors.

## Artifacts
- Before log: `docs/audits/mobile-ux-audit-2026-03-05-log.json`
- After log: `docs/audits/mobile-ux-audit-2026-03-05-log-after-fixes.json`
- Before raw report: `docs/audits/mobile-ux-audit-2026-03-05-raw.md`
- After raw report: `docs/audits/mobile-ux-audit-2026-03-05-raw-after-fixes.md`

---

## Continuation (06.03.2026)

### Additional mobile UX pass implemented

1. Global mobile touch targets in shared styles
- File: `src/index.css`
- Added mobile rules:
  - `min-height: 44px` for buttons and non-checkbox/radio form fields
  - `min-width: 44px` for buttons
  - `touch-link` utility for mobile link hit area

2. Header/footer/breadcrumbs touch zones
- Files:
  - `src/components/Layout.tsx`
  - `src/components/Breadcrumbs.tsx`
  - `src/components/CalculatorView.tsx`
- Updated links/buttons with `tap-target` / `touch-link` classes:
  - Header logo/home controls
  - Back button in calculator view
  - Breadcrumb links
  - Footer quick/legal links

### Verification (post-pass)

- Build: `npm run build` — success.
- Spot diagnostics:
  - `time-converter`: reduced to radio/checkbox controls only.
  - `number-to-words`: 0 small tap targets.
  - `vat-threshold`: 0 small tap targets.

### Fast full mobile audit (57 calculators)

Note: this pass used a faster technical runner (`domcontentloaded` + UX metrics) to validate touch-target dynamics after shared CSS updates.

- Fast audit #1:
  - file: `docs/audits/mobile-ux-audit-2026-03-06-fast-log.json`
  - `smallTapPages`: 26
  - average small targets/page: 1.35
  - `jsErrorPages`: 0
  - `nanPages`: 0

- Fast audit #2 (after `button min-width: 44px`):
  - file: `docs/audits/mobile-ux-audit-2026-03-06-fast-log-pass3.json`
  - `smallTapPages`: 24
  - average small targets/page: 1.11
  - `jsErrorPages`: 0
  - `nanPages`: 0

### Remaining residuals

- Main residual source is native `radio/checkbox` controls (16px visual size) in several forms.
- This is flagged by strict geometric heuristic; functional mobile usability remains acceptable because labels/options are clickable.
