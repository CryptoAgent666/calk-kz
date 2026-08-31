import json
import sys
from playwright.sync_api import sync_playwright

OUT = "/Users/konstantin/Projects/KZ-CALK/screenshots/audit-2026-06-04"

URLS = [
    ("home", "https://calk.kz/"),
    ("salary-reverse", "https://calk.kz/calculator/salary-reverse/"),
    ("maternity-benefits", "https://calk.kz/calculator/maternity-benefits/"),
]

VIEWPORTS = [
    ("desktop", 1280, 800, 1.0, False),
    ("mobile", 390, 844, 3.0, True),
]

# JS to analyze the DOM
ANALYZE_JS = r"""
() => {
    const res = {};

    // viewport meta
    const vp = document.querySelector('meta[name="viewport"]');
    res.viewport_meta = vp ? vp.getAttribute('content') : null;

    // title / description / canonical
    res.title = document.title;
    const desc = document.querySelector('meta[name="description"]');
    res.meta_description = desc ? desc.getAttribute('content') : null;
    const canon = document.querySelector('link[rel="canonical"]');
    res.canonical = canon ? canon.getAttribute('href') : null;

    // og:image
    const ogimg = document.querySelector('meta[property="og:image"]');
    res.og_image = ogimg ? ogimg.getAttribute('content') : null;
    const ogimgw = document.querySelector('meta[property="og:image:width"]');
    const ogimgh = document.querySelector('meta[property="og:image:height"]');
    res.og_image_w = ogimgw ? ogimgw.getAttribute('content') : null;
    res.og_image_h = ogimgh ? ogimgh.getAttribute('content') : null;
    const twimg = document.querySelector('meta[name="twitter:image"]');
    res.twitter_image = twimg ? twimg.getAttribute('content') : null;

    // H1
    const h1s = Array.from(document.querySelectorAll('h1'));
    res.h1_count = h1s.length;
    res.h1_texts = h1s.map(h => (h.textContent || '').trim().slice(0,160));
    // H1 vertical position (top offset relative to document)
    res.h1_tops = h1s.map(h => Math.round(h.getBoundingClientRect().top + window.scrollY));

    // headings outline (first 12)
    res.headings = Array.from(document.querySelectorAll('h1,h2,h3'))
        .slice(0, 14)
        .map(h => h.tagName + ': ' + (h.textContent||'').trim().slice(0,70));

    // images
    const imgs = Array.from(document.querySelectorAll('img'));
    res.img_count = imgs.length;
    res.images = imgs.map(img => {
        const r = img.getBoundingClientRect();
        return {
            src: (img.currentSrc || img.src || '').slice(0, 160),
            alt: img.getAttribute('alt'),
            has_alt_attr: img.hasAttribute('alt'),
            w_attr: img.getAttribute('width'),
            h_attr: img.getAttribute('height'),
            loading: img.getAttribute('loading'),
            srcset: img.hasAttribute('srcset'),
            natW: img.naturalWidth,
            natH: img.naturalHeight,
            dispW: Math.round(r.width),
            dispH: Math.round(r.height),
            top: Math.round(r.top + window.scrollY),
        };
    });

    // svg inline
    res.inline_svg_count = document.querySelectorAll('svg').length;
    // picture/source
    res.picture_count = document.querySelectorAll('picture').length;
    const sources = Array.from(document.querySelectorAll('source'));
    res.source_types = sources.map(s => s.getAttribute('type')).filter(Boolean);

    // raw i18n leakage: look for {{ }} or i18n keys in visible body text
    const bodyText = document.body.innerText || '';
    res.has_double_brace = /\{\{[^}]+\}\}/.test(bodyText);
    const braceMatch = bodyText.match(/\{\{[^}]{1,40}\}\}/g);
    res.brace_samples = braceMatch ? braceMatch.slice(0,5) : [];
    // dotted i18n-looking keys e.g. calculator.title shown literally as a whole "word"
    const keyMatch = bodyText.match(/\b[a-z]+(?:[._][a-z]+){2,}\b/g);
    res.dotted_key_samples = keyMatch ? Array.from(new Set(keyMatch)).slice(0,8) : [];

    // horizontal scroll
    res.scrollW = document.documentElement.scrollWidth;
    res.clientW = document.documentElement.clientWidth;
    res.innerW = window.innerWidth;
    res.has_hscroll = document.documentElement.scrollWidth > window.innerWidth + 1;
    res.docHeight = document.documentElement.scrollHeight;

    // Find elements wider than viewport (overflow culprits)
    res.overflow_elems = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
        const r = el.getBoundingClientRect();
        if (r.right > window.innerWidth + 2 && r.width > 30) {
            res.overflow_elems.push({
                tag: el.tagName,
                cls: (el.className && el.className.toString) ? el.className.toString().slice(0,50) : '',
                right: Math.round(r.right),
                width: Math.round(r.width),
            });
        }
        if (res.overflow_elems.length >= 8) break;
    }

    // Interactive elements -> tap target sizing (only those in viewport-ish area, first 60)
    const interactive = Array.from(document.querySelectorAll(
        'a, button, input, select, textarea, [role="button"], [onclick]'
    ));
    res.interactive_count = interactive.length;
    const small = [];
    const fontIssues = [];
    let counted = 0;
    for (const el of interactive) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue; // hidden
        counted++;
        const cs = getComputedStyle(el);
        const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || el.getAttribute('type') || el.tagName).trim().slice(0,40);
        // tap target check
        if ((r.width < 44 || r.height < 44)) {
            small.push({
                tag: el.tagName,
                type: el.getAttribute('type') || '',
                label: label,
                w: Math.round(r.width),
                h: Math.round(r.height),
                top: Math.round(r.top + window.scrollY),
            });
        }
        // font size on inputs (iOS zoom risk if <16px)
        const tag = el.tagName.toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') {
            const fs = parseFloat(cs.fontSize);
            if (fs < 16) {
                fontIssues.push({tag: tag, type: el.getAttribute('type')||'', fontSize: fs, label: label});
            }
        }
    }
    res.interactive_visible = counted;
    res.small_targets = small.slice(0, 40);
    res.small_target_count = small.length;
    res.font_issues = fontIssues.slice(0, 20);
    res.font_issue_count = fontIssues.length;

    // Does a calculator form exist and where is it? (look for form, or inputs)
    const forms = Array.from(document.querySelectorAll('form'));
    res.form_count = forms.length;
    const numInputs = document.querySelectorAll('input[type="number"], input[type="text"], input[inputmode], select');
    res.calc_input_count = numInputs.length;
    if (numInputs.length) {
        const first = numInputs[0].getBoundingClientRect();
        res.first_input_top = Math.round(first.top + window.scrollY);
    } else {
        res.first_input_top = null;
    }
    // first submit/calculate-ish button position
    let calcBtnTop = null;
    for (const b of document.querySelectorAll('button, [role="button"], a.btn, input[type="submit"]')) {
        const t = (b.textContent||'').toLowerCase();
        if (/рассч|посчит|calcul|узнать|расчет|результат/.test(t)) {
            calcBtnTop = Math.round(b.getBoundingClientRect().top + window.scrollY);
            break;
        }
    }
    res.calc_button_top = calcBtnTop;

    return res;
}
"""


def run():
    summary = {}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for label, url in URLS:
            summary[label] = {"url": url, "viewports": {}}
            for vname, vw, vh, dsf, mobile in VIEWPORTS:
                ctx = browser.new_context(
                    viewport={"width": vw, "height": vh},
                    device_scale_factor=dsf,
                    is_mobile=mobile,
                    user_agent=(
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
                        if mobile else None
                    ),
                )
                page = ctx.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=45000)
                except Exception as e:
                    print(f"[warn] {url} {vname} networkidle: {e}", file=sys.stderr)
                    try:
                        page.goto(url, wait_until="load", timeout=45000)
                    except Exception as e2:
                        print(f"[err] {url} {vname} load: {e2}", file=sys.stderr)
                page.wait_for_timeout(1500)  # let hydration settle

                # above-the-fold screenshot (viewport only)
                atf_path = f"{OUT}/{label}-{vname}-atf.png"
                page.screenshot(path=atf_path, full_page=False)

                # full page screenshot
                full_path = f"{OUT}/{label}-{vname}-full.png"
                try:
                    page.screenshot(path=full_path, full_page=True)
                except Exception as e:
                    full_path = None
                    print(f"[warn] full screenshot failed {url} {vname}: {e}", file=sys.stderr)

                data = page.evaluate(ANALYZE_JS)
                data["viewport_h"] = vh
                data["atf_screenshot"] = atf_path
                data["full_screenshot"] = full_path
                summary[label]["viewports"][vname] = data

                ctx.close()
        browser.close()

    with open(f"{OUT}/data.json", "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    print("DONE")


if __name__ == "__main__":
    run()
