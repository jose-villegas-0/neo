import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Resolve the canonical production URL.
// On Railway, RAILWAY_PUBLIC_DOMAIN is injected automatically once a domain is assigned.
// SITE_URL can override (e.g. a custom domain later).
const SITE =
  process.env.SITE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'http://localhost:4321');

export default defineConfig({
  site: SITE,
  trailingSlash: 'never',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],
  build: {
    inlineStylesheets: 'auto',
    format: 'file',
  },
});
