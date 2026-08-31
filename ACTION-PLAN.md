# SEO Action Plan — calk.kz

**Health Score: 78/100 (Good)** · Generated 2026-06-04 from the 7-dimension audit (`FULL-AUDIT-REPORT.md`).
Ordered by impact/effort. Tags: **[server]** nginx/Plesk/CDN config · **[code]** React/build · **[content]** copy/schema.

---

## 🔴 CRITICAL — fix immediately (indexing / trust / penalties)

1. **Fix the soft-404 / SPA catch-all** **[server]**
   Unknown, uppercase, and stale paths (`/calculator/does-not-exist/`, `/Calculator/Salary-Reverse/`, `/contacts/`, `/about/`, `/kk/…`, `/sitemap_index.xml`) all return **HTTP 200 + the homepage shell**.
   - Serve real **404/410** for non-existent routes (not the 200 homepage).
   - **301** uppercase/mixed-case → lowercase canonical.
   - Make `/sitemap-index.xml` return 404 **or** a real `<sitemapindex>` pointing at `sitemap.xml`.
   *Why:* crawl-budget waste + duplicate-homepage soft-404s across the ~117-calculator namespace.

2. **Ship real, crawlable `/contacts/` and `/about/` pages** **[content]**
   YMYL trust requires verifiable operator/legal identity + contact method + editorial/sourcing policy. (Verify whether the canonical pages already live under `/legal/*` and just fix the footer links + soft-404 fallback.)

3. **Tame the mobile homepage ad** **[server/AdSense]**
   A full-screen AdSense vignette/video can push H1 + all category cards off the mobile fold (non-deterministic). Disable the large vignette/anchor format on the mobile home route or pin ads to a fixed, reserved below-fold slot.

---

## 🟠 HIGH — within 1 week (significant ranking impact)

4. **Add the 6 security headers** **[server]** — one nginx/Plesk block, site-wide:
   `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: SAMEORIGIN`, a `Permissions-Policy` denying unused APIs, and a `Content-Security-Policy` (start in `-Report-Only`; allow self + `pagead2.googlesyndication.com` + `*.gstatic.com` + `fonts.googleapis.com` so AdSense/fonts don't break). Also suppress `x-powered-by: PleskLin`.

5. **Resolve dangling schema `@id`** **[code]**
   Inline the full `Person`, `WebSite`, and `Organization` nodes into **every** calculator/category page's `@graph` (currently only `@id` stubs that point at homepage-only definitions). Restores author E-E-A-T + `isPartOf` on the pages that rank. *(Highest-value schema fix.)*

6. **Performance: stop eager-preloading post-interaction chunks** **[code]**
   Convert `<link rel="modulepreload">` for `export-tools` (238 KB-gz, PDF/Excel) and `ChartComponentsImpl` (114 KB-gz, charts) into on-demand `import()` (on Export click / chart view). Removes ~352 KB-gz from every calculator's initial load → direct LCP + INP win. Follow-up: split the 486 KB-gz main entry bundle.

7. **Front the site with a CDN (Cloudflare free)** **[server]**
   Cuts the ~1.18s origin TTFB to edge latency, and auto-adds **Brotli** + healthy HTTP/2/3. Set HTML `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` (short browser `max-age`). Biggest single LCP lever for every page.

8. **FAQPage schema consistency** **[code]**
   Add FAQPage JSON-LD to `tax-regime-comparison` (visible FAQ already exists, just unschemaed) and any other calc with an on-page FAQ. Rewrite `maternity-benefits` FAQ answers from one-line stubs to 2–3 substantive sentences. *(Helps AI Overviews / Bing Copilot / AI citation — note Google FAQ rich snippets themselves are gov/health-restricted.)*

9. **Tap targets ≥ 44×44px** **[code]** — one CSS pass: header logo/hamburger, language switch, breadcrumb home icon, source/footer links, range thumb, checkboxes; ≥8px spacing. Site-wide mobile-usability + a11y win.

---

## 🟡 MEDIUM — within 1 month (optimization)

10. **Per-URL `lastmod` in sitemap** **[code]** — real content-change dates, not the single global `2026-05-22`. Improves recrawl prioritization for rate-tracking calculators.
11. **Upgrade citations to primary + linked** **[content]** — link "Налоговый кодекс РК" to **adilet.zan.kz with article numbers (ст. X)**; add `ст. X НК РК` into each "Быстрый ответ" (Perplexity per-claim citability). Add 60–100-word unique intros + authority links to homepage & `category/*` (currently zero authority links, thin prose).
12. **Strengthen entity authority graph** **[code]** — add LinkedIn (founder) + any YouTube/Wikidata/Crunchbase to `Organization.sameAs` / `Person.sameAs`; add `areaServed: "KZ"` + `knowsAbout` to Organization. Raises AI-trust ceiling.
13. **Category pages → real `ItemList`** **[code]** — replace `hasPart` stubs with positioned `ListItem` (name + url) for rich-eligibility + AI parsing; add `item` URL to the last breadcrumb.
14. **Right-size raster images** **[code]** — 400×400 JPEG avatar → 96×96 @2x WebP/AVIF + `srcset`; same for partner logo (~70 KB saved, unify formats). Consider per-calculator `og:image`.
15. **HTML caching + inline critical CSS** **[server/code]** — short `max-age` + `stale-while-revalidate` on HTML; inline ~2–4 KB above-the-fold CSS + non-blocking main CSS; reserve AdSense slot height (CLS); preload primary font.
16. **De-duplicate the unique per-calc expert line** **[content]** — keep the named expert but add a calculator-specific methodology sentence per page (the verbatim finance block on tax/maternity pages reads as templated).
17. **Complete + auto-generate llms.txt** **[code]** — list all 118+ calculators (currently ~70; salary-reverse and tax-regime themselves are missing); regenerate from the live registry.

---

## 🟢 LOW — backlog

18. Drop `<priority>`/`<changefreq>` from sitemap (Google ignores; ~30% bloat) — optional, keep for Bing/Yandex.
19. Remove `maximum-scale=5.0` from viewport (allow free zoom; a11y).
20. Add explicit `OAI-SearchBot` allow to robots.txt (currently inherits `*`).
21. Suppress duplicate AdSense `<script>` tags (2–3× per calc page; harmless).
22. Static `softwareVersion: "1.0"` / `operatingSystem: "Any"` on every WebApplication — populate meaningfully or drop.
23. Host the author E-E-A-T image on-domain (currently cross-domain `profinance.kz`).
24. Verify HTTP/2 health on origin (a curl h2 read quirk was observed; h2/h3 helps with 15+ JS chunks).

---

### Effort vs. impact snapshot
- **Biggest wins, lowest effort:** #4 (security headers), #6 (drop eager preload), #7 (CDN), #8 (FAQPage), #1 (404 status).
- **Code-side (next deploy):** #5, #6, #8, #9, #13, #14, #17.
- **Server/hosting (no deploy):** #1, #3, #4, #7, #10, #15.
- **Content:** #2, #11, #16.

*No project files were changed by the audit. This plan is advisory — apply on your schedule.*
