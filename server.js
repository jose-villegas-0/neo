import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');

const app = express();

// Long cache for hashed assets, short for HTML.
app.use(
  express.static(dist, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}_astro${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      }
    },
  })
);

// SPA-style fallback to the generated 404 page.
app.use((req, res) => {
  res.status(404).sendFile(path.join(dist, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`is-neo-human serving on :${port}`);
});
