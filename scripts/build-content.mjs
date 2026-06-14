// Turn the workflow output into article .md files + data JSON.
// Usage: node scripts/build-content.mjs <path-to-task-output.json>
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Pass the task output file path.');
  process.exit(1);
}

const raw = await readFile(src, 'utf8');
let wrapper = JSON.parse(raw);
let data = wrapper.result ?? wrapper;
if (typeof data === 'string') data = JSON.parse(data);

const { articles, pillar, evidence, quiz } = data;

// --- HTML entity decode (agents sometimes emit &gt; &#39; etc.) ----
function decode(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&');
}
function deepDecode(v) {
  if (typeof v === 'string') return decode(v);
  if (Array.isArray(v)) return v.map(deepDecode);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = deepDecode(v[k]);
    return o;
  }
  return v;
}

// --- safe YAML emit using JSON-string scalars (YAML is a JSON superset) ---
const q = (s) => JSON.stringify(decode(String(s)));

function frontmatter(d) {
  const lines = ['---'];
  lines.push(`title: ${q(d.title)}`);
  lines.push(`description: ${q(d.description)}`);
  lines.push(`pubDate: ${d.pubDate}`);
  if (d.updatedDate) lines.push(`updatedDate: ${d.updatedDate}`);
  lines.push(`category: ${q(d.category)}`);
  lines.push('keywords:');
  for (const k of d.keywords || []) lines.push(`  - ${q(k)}`);
  if (d.heroQuestion) lines.push(`heroQuestion: ${q(d.heroQuestion)}`);
  if (d.evidenceStrength != null) lines.push(`evidenceStrength: ${d.evidenceStrength}`);
  lines.push(`order: ${d.order ?? 100}`);
  lines.push(`featured: ${d.featured ? 'true' : 'false'}`);
  lines.push('faqs:');
  for (const f of d.faqs || []) {
    lines.push(`  - question: ${q(f.question)}`);
    lines.push(`    answer: ${q(f.answer)}`);
  }
  lines.push('---');
  return lines.join('\n');
}

const PUB = '2026-06-14';
const dir = 'src/content/articles';
await mkdir(dir, { recursive: true });

// clean any prior generated articles
for (const f of await readdir(dir).catch(() => [])) {
  if (f.endsWith('.md')) await unlink(path.join(dir, f));
}

const FEATURED = new Set(['neo-not-human-evidence-ranked']);

let n = 0;
for (const a of articles) {
  if (!a || !a.slug) continue;
  const fm = frontmatter({ ...a, pubDate: PUB, featured: FEATURED.has(a.slug) });
  const body = decode(a.bodyMarkdown).trim();
  await writeFile(path.join(dir, `${a.slug}.md`), `${fm}\n\n${body}\n`, 'utf8');
  n++;
}

// mark the listicle as featured if present
await mkdir('src/data', { recursive: true });
await writeFile('src/data/pillar.json', JSON.stringify(deepDecode(pillar), null, 2));
await writeFile('src/data/evidence.json', JSON.stringify(deepDecode(evidence), null, 2));
await writeFile('src/data/quiz.json', JSON.stringify(deepDecode(quiz), null, 2));

console.log(`Wrote ${n} articles + pillar/evidence/quiz data.`);
console.log('Evidence items:', evidence.items?.length, '| Quiz Qs:', quiz.questions?.length);
