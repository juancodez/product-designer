# SEO Audit — juangomezvara.com
**Date:** 2026-07-03  
**Site:** https://www.juangomezvara.com  
**Type:** Personal Portfolio / Product Designer  
**Working directory:** C:\Users\tn\portfolio-09-SEO

---

## SEO Health Score: 42 / 100

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 40 | 8.8 |
| Content Quality | 23% | 68 | 15.6 |
| On-Page SEO | 20% | 30 | 6.0 |
| Schema / Structured Data | 10% | 0 | 0.0 |
| Performance (CWV) | 10% | 65 | 6.5 |
| AI Search Readiness | 10% | 15 | 1.5 |
| Images | 5% | 72 | 3.6 |
| **Total** | | | **42 / 100** |

---

## Pages Audited

| Page | File | Meta Desc | OG Tags | Twitter Card | Canonical | Schema |
|---|---|---|---|---|---|---|
| Homepage | index.html | ✅ | ⚠️ Partial | ⚠️ Partial | ❌ | ❌ |
| Contact | contact.html | ✅ | ❌ | ❌ | ❌ | ❌ |
| Klaro Case Study | project-klaro.html | ❌ | ❌ | ❌ | ❌ | ❌ |
| Supply Pro Case Study | project-supply-pro.html | ❌ | ❌ | ❌ | ❌ | ❌ |
| Micro-casing Case Study | project-micro-casing.html | ❌ | ❌ | ❌ | ❌ | ❌ |
| AI Playground | ai-playground.html | ❌ | ❌ | ❌ | ❌ | ❌ |
| Imprint | imprint.html | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## CRITICAL — Fix Immediately

### C1. No sitemap.xml
**Observation:** No `sitemap.xml` exists at the root. Search engines must guess site structure.  
**Why it matters:** Sitemaps are the primary signal telling Googlebot which URLs exist and their priority.  
**How we know it failed:** Google Search Console shows "No sitemap submitted" / pages missing from index.  
**Fix:** Generate `sitemap.xml` listing all 7 pages with `<lastmod>` and `<priority>`.

### C2. No robots.txt
**Observation:** No `robots.txt` at root. Crawlers have no directives.  
**Why it matters:** Without it, bots crawl everything including unused pages; also blocks GSC from submitting sitemap URL.  
**Fix:** Add `robots.txt` pointing to sitemap, noindex `imprint.html`.

### C3. Zero structured data on all pages
**Observation:** No `application/ld+json` blocks found in any of the 7 pages.  
**Why it matters:** No Person schema = no knowledge panel signal; no BreadcrumbList = no sitelinks in SERP; no AI citation signal.  
**Fix:** Add `Person` schema to homepage, `BreadcrumbList` to each case study, `WebSite` with sitelinks searchbox.

### C4. Case study pages have no meta description, no OG, no Twitter card
**Observation:** `project-klaro.html`, `project-supply-pro.html`, `project-micro-casing.html`, `ai-playground.html` have **only** `charset` and `viewport` in `<head>`. No title variant, no description, no social sharing metadata.  
**Why it matters:** Zero social preview when shared on LinkedIn/Twitter. Generic Google snippet. These are the portfolio's most important pages.  
**Fix:** Add full meta block to each case study (description, og:title, og:description, og:image, og:url, twitter:card).

### C5. No canonical URLs on any page
**Observation:** Zero `<link rel="canonical">` tags sitewide.  
**Why it matters:** If the site is accessible at both `http://` and `https://` or `www` vs non-www, Google sees duplicate content. Vercel deployments also create preview URLs.  
**Fix:** Add `<link rel="canonical" href="https://www.juangomezvara.com/[page]">` to every page.

---

## HIGH — Fix This Week

### H1. og:image uses a relative path
**Observation:** `<meta property="og:image" content="assets/Thumbnail-Micro-casing.webp" />`  
**Why it matters:** Open Graph requires absolute URLs. Relative paths break previews in Slack, WhatsApp, LinkedIn, Twitter.  
**Fix:** `content="https://www.juangomezvara.com/assets/Thumbnail-Micro-casing.webp"`

### H2. Typo in og:description
**Observation:** `"Thurning complex systems into clear, shipped products."` — **"Thurning"** should be **"Turning"**.  
**Why it matters:** Appears in social card previews and discredits the designer's attention to detail.  
**Fix:** Correct the typo.

### H3. Homepage og:url, og:locale, og:site_name, twitter:title, twitter:description, twitter:image missing
**Observation:** Only `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` are present.  
**Missing:** `og:url`, `og:locale`, `og:site_name`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:creator`.  
**Fix:** Add the 7 missing tags.

### H4. contact.html has no OG or Twitter meta
**Observation:** Contact page only has `<title>` and `<meta name="description">`. No social cards.  
**Why it matters:** Any recruiter or PM who shares the contact page link sees a blank preview.  
**Fix:** Add OG + Twitter block.

### H5. imprint.html should be noindexed
**Observation:** Legal/imprint page has no `<meta name="robots" content="noindex">`.  
**Why it matters:** It wastes crawl budget and can surface in SERPs for name-brand queries instead of the homepage.  
**Fix:** Add `<meta name="robots" content="noindex, follow">` to `imprint.html`.

### H6. H1 on homepage is not keyword-targeted
**Observation:** `<h1>Connecting dots creates great products.</h1>` — creative but contains zero searchable terms.  
**Why it matters:** The H1 is the highest-weight on-page signal. "Product Designer Berlin" or "Juan Gomez Vara Product Designer" appear nowhere in the H1 or its immediate context.  
**Note:** H1 is rendered inside JS animation (typewriter + reveal). Google reads it, but it's not in the static HTML on first load.  
**Fix options:**
- Keep creative H1 visually, add keyword-rich `<title>` and `<meta name="description">` (already done).
- OR add a visually-hidden `<span>` with "Product Designer in Berlin" for accessibility + crawlability.
- OR replace/complement with subtitle containing keywords.

---

## MEDIUM — Fix Within 1 Month

### M1. No Person schema (knowledge graph)
**Why:** Juan Gomez Vara is not associated in Google's knowledge graph with "Product Designer" or "Berlin". Person schema with `sameAs` links (LinkedIn, GitHub) builds this.  
**Fix:** Add JSON-LD `Person` to `index.html`.

### M2. No WebSite schema
**Why:** Missing sitelinks search box signal and site identity markup.  
**Fix:** Add `WebSite` JSON-LD to `index.html`.

### M3. No BreadcrumbList on case studies
**Why:** SERPs for case study pages show no breadcrumb trail, reducing SERP real estate and trust.  
**Fix:** Add `BreadcrumbList` JSON-LD to each case study: `Home > Projects > [Project Name]`.

### M4. About section photo alt text is minimal
**Observation:** `alt="Juan Gomez Vara"` — correct but weak.  
**Fix:** `alt="Juan Gomez Vara, Product Designer based in Berlin"` — adds context without over-stuffing.

### M5. No `<meta name="author">` on any page
**Fix:** Add `<meta name="author" content="Juan Gomez Vara">` sitewide.

### M6. No `llms.txt` for AI crawler readiness
**Why:** AI search engines (Perplexity, ChatGPT, Bing AI) increasingly use `/llms.txt` to understand site identity and expertise. With no structured data and no `llms.txt`, the site is invisible to AI citation.  
**Fix:** Add `/llms.txt` with biography, projects, contact, expertise signals.

### M7. External links may lack rel="noopener noreferrer"
**Fix:** Audit all `<a target="_blank">` and add `rel="noopener noreferrer"`.

---

## LOW — Backlog

### L1. No OpenGraph video for case studies
Case study pages have `<video>` elements but no `<meta property="og:video">`. Low ROI for current distribution.

### L2. ai-playground.html has no meta description or OG
Not linked from main nav — lower priority but still worth fixing.

### L3. No favicon for modern formats
Only `LogoJGV_favicon-32px.svg` present. No `apple-touch-icon`, no 192px or 512px PNG for PWA manifest. Low priority.

---

## What's Already Good

- ✅ All images use `.webp` format (modern, efficient)
- ✅ Images use `loading="lazy"` correctly (eager only on hero)
- ✅ `decoding="async"` on images
- ✅ Font preconnects in place (`fontshare`, `googleapis`, `gstatic`)
- ✅ `lang="en"` on `<html>`
- ✅ Viewport meta is correct
- ✅ Alt texts are descriptive on case study images
- ✅ Semantic HTML structure (h1 > h2 > h3 hierarchy respected)
- ✅ HTTPS on live site (Vercel)
- ✅ Mobile viewport configured

---

## Prioritized Action Plan

**Phase 1 — Infrastructure (do first, everything depends on this)**
1. [ ] C2: Add `robots.txt`
2. [ ] C1: Add `sitemap.xml`
3. [ ] C5: Add canonical URLs to all pages
4. [ ] H5: Noindex `imprint.html`

**Phase 2 — On-Page Meta (highest ROI for SEO + social sharing)**
5. [ ] H2: Fix "Thurning" typo in og:description
6. [ ] H1: Fix og:image to absolute URL
7. [ ] H3: Add missing OG + Twitter tags to `index.html`
8. [ ] H4: Add OG + Twitter block to `contact.html`
9. [ ] C4: Add full meta block to all 4 case study / playground pages
10. [ ] M5: Add `<meta name="author">` sitewide

**Phase 3 — Structured Data**
11. [ ] M1+M2: Add `Person` + `WebSite` JSON-LD to `index.html`
12. [ ] M3: Add `BreadcrumbList` JSON-LD to each case study

**Phase 4 — AI Readiness**
13. [ ] M6: Add `llms.txt`
14. [ ] H6: Decide on H1 keyword strategy

---

## Files to Create/Modify

| Action | File |
|---|---|
| CREATE | `robots.txt` |
| CREATE | `sitemap.xml` |
| CREATE | `llms.txt` |
| MODIFY | `index.html` — canonical, OG fix, Twitter tags, JSON-LD |
| MODIFY | `contact.html` — canonical, OG, Twitter |
| MODIFY | `project-klaro.html` — full meta + canonical + JSON-LD |
| MODIFY | `project-supply-pro.html` — full meta + canonical + JSON-LD |
| MODIFY | `project-micro-casing.html` — full meta + canonical + JSON-LD |
| MODIFY | `ai-playground.html` — full meta + canonical |
| MODIFY | `imprint.html` — noindex, canonical |

---

*Audit generated by claude-seo · juangomezvara.com · 2026-07-03*
