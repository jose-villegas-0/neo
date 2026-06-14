# Is Neo Human?

An SEO-first film-theory site investigating one question: *was Neo from The Matrix ever human — or a machine all along?*

Built to capture organic search traffic (US/English) around Matrix theories, with no social-media dependency.

## Stack
- **Astro** static site → served by a tiny **Express** server (`server.js`) on Railway.
- **@astrojs/sitemap** + dynamic `robots.txt` + RSS feed.
- JSON-LD structured data (`Article`, `FAQPage`, `BreadcrumbList`, `WebSite`) baked into every page via `src/layouts/BaseLayout.astro`.
- **IndexNow** instant indexing (`scripts/indexnow.mjs`).
- Interactive, link-worthy assets: `/evidence` scorecard and `/quiz`.

## Content model
- Articles live in `src/content/articles/*.md` (schema in `src/content.config.ts`).
- Homepage pillar, evidence database, and quiz data live in `src/data/*.json`.

## Develop
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs dist/
npm start        # serve dist/ via Express (PORT env)
```

## Deploy (Railway, all via CLI)
```bash
railway up                       # build + deploy current dir
railway domain                   # generate a public domain
# then, after the build:
SITE_URL=https://<domain> node scripts/indexnow.mjs
```

## SEO operating loop
1. Publish → ping IndexNow → submit sitemap in Google Search Console & Bing Webmaster.
2. Watch which queries surface in Search Console.
3. Add more long-tail articles targeting what's already ranking.

Independent fan project. Not affiliated with Warner Bros. or the creators of The Matrix.
