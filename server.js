import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');

// --- Persistent poll storage (file on a Railway volume) ---------------
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '.data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const POLL_FILE = path.join(DATA_DIR, 'poll.json');

let counts = { machine: 0, human: 0 };
try {
  counts = { ...counts, ...JSON.parse(fs.readFileSync(POLL_FILE, 'utf8')) };
} catch {
  /* first run — file doesn't exist yet */
}
function persist() {
  try {
    fs.writeFileSync(POLL_FILE, JSON.stringify(counts));
  } catch (e) {
    console.error('poll persist failed:', e.message);
  }
}

// Light per-IP cooldown so one client can't spam the tally (best-effort,
// resets on redeploy — the real dedupe is the client localStorage flag).
const lastVote = new Map();
const COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6h

const app = express();
app.use(express.json());

app.get('/api/results', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ ...counts, total: counts.machine + counts.human });
});

app.post('/api/vote', (req, res) => {
  const choice = req.body && req.body.choice;
  if (choice !== 'machine' && choice !== 'human') {
    return res.status(400).json({ error: 'choice must be "machine" or "human"' });
  }
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')
    .toString()
    .split(',')[0]
    .trim();
  const now = Date.now();
  const prev = lastVote.get(ip) || 0;
  if (ip && now - prev < COOLDOWN_MS) {
    return res
      .status(200)
      .json({ ...counts, total: counts.machine + counts.human, throttled: true });
  }
  if (ip) lastVote.set(ip, now);

  counts[choice] += 1;
  persist();
  res.set('Cache-Control', 'no-store');
  res.json({ ...counts, total: counts.machine + counts.human });
});

// --- Static site -------------------------------------------------------
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

app.use((req, res) => {
  res.status(404).sendFile(path.join(dist, '404.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`is-neo-human serving on :${port} (data: ${DATA_DIR})`);
});
