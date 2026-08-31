# Full SEO Audit — calk.kz

**Date:** 2026-06-04 · **Method:** 7 specialist subagents (technical, content/E-E-A-T, schema, sitemap, performance, visual/image, GEO) over live URLs.
**Business type:** Network of online calculators for Kazakhstan (tax / finance / legal / construction / health) — bilingual ru + kk (`/__kk/`), KZT, prerendered React SPA, ~117 calculators + 14 categories.

## Executive Summary

### SEO Health Score: **78 / 100** — Good

| Category | Score | Weight | Weighted |
|---|---|---|---|
| Technical SEO | 78 | 25% | 19.5 |
| Content Quality / E-E-A-T | 76 | 25% | 19.0 |
| On-Page SEO | 82 | 20% | 16.4 |
| Schema / Structured Data | 86 | 10% | 8.6 |
| Performance (CWV) | 64 | 10% | 6.4 |
| Images / Visual | 78 | 5% | 3.9 |
| AI Search Readiness | 81 | 5% | 4.05 |
| **TOTAL** | | | **≈ 78** |

**Verdict:** technically strong, genuinely useful YMYL calculator network with real prerendering, correct canonicals/hreflang, rich schema, exemplary crawler governance, and **arithmetically verified** calculator results (a strong Trust signal). Held back by a recurring **soft-404 / SPA catch-all** infrastructure flaw, **missing security headers**, **cross-page schema `@id` that doesn't resolve**, and **performance** (heavy JS + no CDN + ~1.18s origin TTFB).

### Top 5 Critical / High Issues
1. **Soft-404 everywhere** — unknown, uppercase, `/contacts/`, `/about/`, clean `/kk/…`, and `/sitemap-index.xml` all return **HTTP 200 + the homepage shell** instead of 404. Crawl-budget waste, no real Contacts/About page on a YMYL site, misleading sitemap-index stub. *(technical H2, content Critical, sitemap High)*
2. **All 6 security headers missing** — HSTS, CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy absent site-wide (TLS 1.3 itself is fine). *(technical H1)*
3. **Schema `@id` dangling** — `author` (Person) and `isPartOf` (WebSite) on every calculator reference nodes defined **only on the homepage** → the E-E-A-T author attribution is invisible on the pages that need it. *(schema C-1)*
4. **Performance** — 486 KB-gz main bundle + ~352 KB-gz of eagerly-preloaded post-interaction chunks (export/charts) on calc routes + no CDN (~1.18s TTFB) + gzip-only (no Brotli). LCP ~2.6–3.4s mobile, INP at risk during hydration. *(performance C1/H1/H2/H3)*
5. **Mobile homepage ad can bury above-the-fold** — a full-screen AdSense vignette/video can push H1 + all category cards off-screen on mobile (non-deterministic but high-impact). Plus pervasive sub-44px tap targets. *(visual Critical/High)*

### Top 5 Quick Wins
1. **Add the 6 security headers** at nginx/Plesk (one config block) + suppress `x-powered-by: PleskLin`.
2. **Convert `export-tools` (238 KB) + `ChartComponentsImpl` (114 KB) from `modulepreload` to on-demand `import()`** — removes ~352 KB-gz from every calculator's initial load.
3. **Add FAQPage JSON-LD to `tax-regime-comparison`** (visible FAQ already exists, just unschemaed) — and inline the `Person`/`WebSite`/`Organization` nodes into each page's `@graph` (fixes schema C-1).
4. **Make unknown routes return 404** (not 200 homepage) + **301 uppercase → lowercase**; ship real crawlable `/contacts/` + `/about/`.
5. **Front the site with a CDN** (Cloudflare free) — cuts ~1.18s TTFB to edge latency, adds Brotli + healthy HTTP/2/3 for free.

---

## Technical SEO — 78/100

**Strengths:** Exemplary `robots.txt` (allows Googlebot + GPTBot/Google-Extended/ClaudeBot/PerplexityBot/Applebot-Extended; blocks CCBot, Bytespider, MJ12bot, Semrush/Ahrefs/Dot/Petal/MegaIndex; `Allow: /__kk/`; sitemap referenced). Self-referencing absolute-https canonicals correct on all URLs (params stripped). Reciprocal ru/kk/x-default hreflang (in HTML + sitemap). Genuinely prerendered HTML (real content, not an empty shell), ru and kk. TLS 1.3 (cert valid to 2026-07-26). Clean redirects: http→https, www→apex, non-slash→slash (all 301).

**Issues:**
- **HIGH — 0 of 6 security headers** (HSTS / CSP / X-Content-Type-Options / X-Frame-Options / Referrer-Policy / Permissions-Policy). Not a direct ranking factor but table-stakes for a finance/tax property and flagged by trust scanners.
- **HIGH — Soft-404 / case-insensitivity.** `/calculator/does-not-exist/` → 200 + indexable homepage shell; `/Calculator/Salary-Reverse/` (uppercase) → 200 homepage (no 301 to canonical); `/sitemap_index.xml` → 200 homepage HTML. Status should be 404/410; uppercase should 301.
- **MEDIUM** — no `X-Robots-Tag` (defense-in-depth); `x-powered-by: PleskLin` leak; `cache-control: max-age=0, must-revalidate` on HTML (revalidate every hit — add short `max-age` + `stale-while-revalidate`).
- **LOW** — viewport `maximum-scale=5.0` (allow free zoom); `/__kk/` non-human-readable locale token (no penalty); empty `<title>` strings are decorative inline-SVG titles (false alarm, no action).

## Content Quality & E-E-A-T — 76/100 (E-E-A-T weighted ≈73, AI-citation ≈78)

**Strengths:** Real expertise — named practitioner byline (Арнур Еркенбаев, Zanimaem.kz), "Обновлено" dates, hyperlinked KZ-gov sources (enpf.kz, kgd.gov.kz, egov.kz, gfss.kz), and **arithmetically exact** worked examples (salary-reverse independently re-derived to the tenge: gross 299 274 → ОПВ 29 927 + ВОСМС 5 985 + ИПН 13 361 → net 250 000). "Быстрый ответ" TL;DR blocks, question-style H2/H3, real (non-duplicate) Kazakh translations. Not scaled-content-abuse — each calculator's how-it-works + FAQ + examples are uniquely written.

**Issues:**
- **CRITICAL — no crawlable `/contacts/` or `/about/`** (footer links soft-404 to the homepage) — a Trust gap on a YMYL site. *(Note: `/legal/*` pages do exist in the sitemap — verify the footer links point there.)*
- **HIGH — inconsistent FAQ depth/schema:** `maternity-benefits` FAQ answers are one-line stubs; `tax-regime-comparison` has an excellent on-page FAQ **with no FAQPage schema**.
- **HIGH — thin listing/home content:** homepage + `category/tax/` are 28–32% anchor text, ~4 mostly-boilerplate paragraphs, no unique editorial intro.
- **MEDIUM** — identical "Экспертное участие" block verbatim on every calculator (finance framing even on tax/maternity pages); sources sometimes named-not-linked and secondary-tier (`zakon.kz` instead of primary `adilet.zan.kz` with article numbers); AdSense on every YMYL money page.

## On-Page SEO — 82/100 (derived)

Unique, optimized `<title>` per page (2026 + `| Calk.kz` suffix), meta descriptions present, exactly one H1/page, clean H1→H2→H3 outline, strong internal linking ("Другие калькуляторы", related-calculator blocks), reciprocal hreflang. Deductions: soft-404 dilutes On-Page signals; thin category/home intros; heading list polluted by off-canvas mobile-menu items (DOM order, harmless).

## Schema / Structured Data — 86/100

**Strengths:** JSON-LD only (no Microdata/RDFa), `https://schema.org` context, ISO-8601 dates, absolute URLs, valid `SearchAction`. Homepage = rich 4-node `@graph` (WebSite + Organization + Person + ItemList). Calculator pages = WebPage + WebApplication (`FinanceApplication`, `offers` price 0 KZT) + BreadcrumbList (+ FAQPage on some). kk variant correctly emits `inLanguage: kk-KZ`. **No deprecated types** (no HowTo/SpecialAnnouncement). All blocks valid JSON.

**Issues:**
- **CRITICAL C-1 — dangling `@id`:** calculator pages reference `#website` and `#konstantin-yakovlev` (author) but those nodes are defined **only on the homepage** → cross-page `@id` doesn't resolve → author E-E-A-T invisible on calc pages. **Inline the full Person/WebSite/Organization nodes into each page's `@graph`.**
- **HIGH H-1 — FAQPage rich results restricted to gov/health since 2023** → calk.kz won't get Google FAQ rich snippets (keep the markup for AI/GEO value, just don't expect rich results).
- **HIGH H-2 — WebApplication has `offers` but no `aggregateRating`** → no Software-App rich result. Add ratings **only if genuine** (never fabricate).
- **MEDIUM** — last BreadcrumbList item missing `item` URL (tolerated); category page uses `hasPart` (not rich-eligible) instead of a positioned `ItemList`; Organization `sameAs` weak.

## XML Sitemap — 88/100

**Strengths:** Valid XML, 274 `<loc>` (137 ru + 137 kk), **all 274 return HTTP 200** (0 redirects/errors), perfect ru↔kk hreflang reciprocity (822 alternates, 0 gaps), 0 duplicates, trailing-slash consistent, no future-dated lastmod. Full coverage of 117 calculators + categories + legal pages × 2 locales.

**Issues:**
- **HIGH — `/sitemap-index.xml` is a misleading HTML stub** (byte-identical to homepage, 90 KB, `text/html`, HTTP 200, fails XML parse). robots.txt doesn't reference it (mitigates), but any tool guessing the filename is misled. Return 404 or make it a real `<sitemapindex>`.
- **MEDIUM** — all 274 `lastmod` identical (`2026-05-22`) → no per-URL freshness signal; emit real per-page dates.
- **LOW** — `<priority>`/`<changefreq>` on every URL (Google ignores; ~30% bloat; safe to drop, optional for Bing/Yandex).

## Performance / Core Web Vitals — 64/100 (estimated from static evidence)

> CWV are reasoned from curl timing + HTML (no Lighthouse/CrUX lab run) — validate in PageSpeed Insights / CrUX.

| Metric | Estimate | Rating |
|---|---|---|
| LCP | ~2.6–3.4s mobile / ~2.0–2.5s desktop | Needs Improvement |
| INP | ~150–350ms post-hydration | Needs Improvement (Poor risk on low-end) |
| CLS | ~0.0–0.05 | Good |

**Strengths:** Prerendered first paint (H1 text in HTML, no JS-blocked LCP). `/assets/*` carry `max-age=31536000, immutable` + hashed names. Good code-splitting (per-calc chunks ~3 KB). Entry is `<script type=module>` (deferred). `font-display:swap`. Only one third-party (AdSense, async) — **no GTM/GA4/Metrika/Hotjar bloat**. The one image has width/height + lazy. Calculator results pre-render with defaults → **0px layout shift** on recompute (verified).

**Issues:**
- **CRITICAL C1 — main bundle 486 KB-gz / 1.91 MB decompressed** — dominant LCP-delay + INP-risk.
- **HIGH H1 — eager `modulepreload`** of `export-tools` (238 KB, PDF/Excel) + `ChartComponentsImpl` (114 KB, charts) on calc routes — needed only after click; ~352 KB-gz wasted up front.
- **HIGH H2/H3 — ~1.18s TTFB, no CDN/edge** (`nginx`/`PleskLin`, no cache headers); HTML `max-age=0, must-revalidate` → full origin round-trip every navigation.
- **MEDIUM** — no Brotli (gzip only, ~15–20% larger); render-blocking CSS with no inline critical CSS; AdSense slots have no reserved height (the only CLS risk); no LCP-resource preload.

## Images / Visual / Mobile — 78/100 (Playwright-verified)

**Strengths:** Clean render (no broken layout, no raw i18n leakage), exactly one H1/page, all `<img>` have alt + width/height + lazy + modern formats via `<picture>` (AVIF/WebP). Valid 1200×630 og-image. Inputs ≥16px font (no iOS zoom). No horizontal scroll. **Zero CLS** when results appear. Calculator mobile above-the-fold is exemplary (clear H1 + value prop + inputs at fold).

**Issues:**
- **CRITICAL — mobile homepage ad can consume 100% of above-the-fold** (full-screen AdSense vignette/video pushed H1 to scrollY≈557px; non-deterministic across loads). Cap/anchor this format on mobile.
- **HIGH — pervasive sub-44px tap targets:** header logo 40×40, hamburger 36×36, language switch 44×28, breadcrumb home 16×16, source links ~30px, footer links 20px, range track 8px, checkboxes 16×16. (14–25 distinct sub-44px interactive elements per page.)
- **MEDIUM** — raster avatar served 400×400 JPEG rendered at 48×48 (8× oversized, only JPEG on site), no `srcset`; og:image generic/identical site-wide (per-calculator cards would lift social CTR); `maximum-scale=5.0`.

## AI Search Readiness (GEO) — 81/100

**Strengths:** Prerendering verified for GPTBot/ClaudeBot/PerplexityBot (full answer text in static HTML, incl. kk locale). robots.txt is near-model AI policy. **llms.txt well-formed (~7 KB)** with 2026 constants + calculator map. "Быстрый ответ" 35–37-word liftable passages (definition + concrete number). FAQPage with 43–54-word answers (optimal citation band). Gov source attribution + named expert + consistent "Calk.kz" entity.

**Issues:**
- **HIGH** — FAQPage schema inconsistent (tax-regime has visible FAQ, no schema); weak entity authority graph (no Wikipedia/Wikidata/LinkedIn/YouTube in `sameAs`).
- **MEDIUM** — static Quick-Answer example numbers can desync from live constants after a rate change; llms.txt lists ~70 of 118+ calculators and isn't referenced from HTML; homepage `ItemList` exposes only 14 calculators; Quick Answers cite % but not specific `ст. X НК РК` (Perplexity rewards per-claim citations).
- Platform read: **Google AIO** strong; **ChatGPT search** strong (consider naming `OAI-SearchBot` explicitly); **Perplexity** capped by missing article-level citations; **Bing Copilot** good where schema exists.

---

*Generated by /seo-audit — 7 specialist subagents. Audit only; no project files were modified by the audit. Screenshots: `screenshots/audit-2026-06-04/`.*
