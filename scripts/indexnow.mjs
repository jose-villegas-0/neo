// Ping IndexNow (Bing, Yandex, Brave, DuckDuckGo, Seznam) with every URL in the sitemap.
// Usage: SITE_URL=https://your-domain node scripts/indexnow.mjs
import { readFile } from 'node:fs/promises';

const KEY = '606b26a7f867997b887741724f2f0b10';
const site = (process.env.SITE_URL || '').replace(/\/$/, '');
if (!site) {
  console.error('Set SITE_URL=https://your-domain');
  process.exit(1);
}
const host = new URL(site).host;

// Collect URLs from the built sitemap(s).
async function urlsFromSitemap() {
  const urls = new Set();
  try {
    const index = await readFile('dist/sitemap-index.xml', 'utf8');
    const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const m of maps) {
      const file = 'dist/' + m.split('/').pop();
      try {
        const xml = await readFile(file, 'utf8');
        for (const u of [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]) urls.add(u[1]);
      } catch {}
    }
  } catch {
    console.error('No sitemap found — run `npm run build` first.');
  }
  return [...urls];
}

const urlList = await urlsFromSitemap();
if (urlList.length === 0) {
  console.error('No URLs to submit.');
  process.exit(1);
}

const payload = { host, key: KEY, keyLocation: `${site}/${KEY}.txt`, urlList };

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(payload),
});

console.log(`IndexNow: submitted ${urlList.length} URLs → HTTP ${res.status}`);
