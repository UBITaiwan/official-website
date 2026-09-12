// 推送前檢查：連結、資安、無障礙。
//
// 這支腳本存在的理由：這三類檢查每次都要做，但每次手寫檢查邏輯就會重犯
// 同樣的錯——忘記處理 URL 編碼的中文路徑、漏掉 inline style 的 url()、
// 只檢查 href 而漏掉 src。寫成腳本之後，每次的答案都一樣。
//
//   node scripts/check.mjs          檢查 dist/
//   node scripts/check.mjs --strict 警告也視為失敗
//
// 需要先 npm run build 產生 dist/。
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = 'dist';
const STRICT = process.argv.includes('--strict');

if (!existsSync(DIST)) {
  console.error('✗ 找不到 dist/，請先執行 npm run build');
  process.exit(1);
}

const problems = [];   // 一定要修
const warnings = [];   // 建議確認
const fail = (cat, file, msg) => problems.push({ cat, file, msg });
const warn = (cat, file, msg) => warnings.push({ cat, file, msg });

// ── 收集檔案 ──────────────────────────────────────────
const allFiles = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else allFiles.push(p);
  }
})(DIST);

const htmlFiles = allFiles.filter((f) => f.endsWith('.html'));
const rel = (f) => relative(DIST, f);

// 站內可到達的位置：頁面路徑與所有實體檔案
const pages = new Set(
  htmlFiles
    .filter((f) => f.endsWith('index.html'))
    .map((f) => {
      const d = relative(DIST, f).replace(/index\.html$/, '');
      return '/' + d.replace(/\\/g, '/');
    })
);
const assets = new Set(allFiles.map((f) => '/' + relative(DIST, f).replace(/\\/g, '/')));

// 轉址頁不適用部分檢查（它們刻意沒有完整結構）
const isStub = (html) => html.includes('此頁面已移至新網址');

// ── 1. 連結 ───────────────────────────────────────────
let linkCount = 0;
const idsByFile = new Map();

for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  idsByFile.set(rel(f), ids);

  // href / src：站內絕對路徑
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const raw = m[1];
    if (raw.startsWith('//')) continue;          // 協定相對網址，視為外部
    linkCount++;
    const clean = decodeURIComponent(raw.split('#')[0].split('?')[0]);
    if (!clean) continue;
    if (!pages.has(clean) && !assets.has(clean)) {
      fail('連結', rel(f), `連到不存在的位置：${raw}`);
    }
  }

  // CSS 的 url(/...)：inline style 與 <style> 區塊都算。
  // 這一項曾經被漏掉，導致一批底圖靜靜上線 404。
  for (const m of html.matchAll(/url\((['"]?)(\/[^)'"]+)\1\)/g)) {
    linkCount++;
    const clean = decodeURIComponent(m[2]);
    if (!assets.has(clean)) fail('連結', rel(f), `樣式連到不存在的檔案：${m[2]}`);
  }
}

// 同頁錨點是否存在
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const ids = idsByFile.get(rel(f));
  for (const m of html.matchAll(/href="#([^"]+)"/g)) {
    if (m[1] && !ids.has(m[1])) warn('連結', rel(f), `錨點 #${m[1]} 在本頁找不到對應元素`);
  }
}

// ── 2. 資安 ───────────────────────────────────────────
// 掃描的是 dist/，也就是實際會被公開的內容。
const SECRETS = [
  ['手機號碼', /\+?886[\s\-]?9\d{2}[\s\-]?\d{3}[\s\-]?\d{3}|\b09\d{2}[\s\-]?\d{3}[\s\-]?\d{3}\b/g],
  ['私人信箱', /[\w.\-]+@(?:gmail|yahoo|hotmail|outlook|icloud|qq)\.com/gi],
  ['金鑰或密碼', /(?:api[_-]?key|secret|token|password|passwd|bearer)\s*[:=]\s*['"][^'"]{8,}/gi],
  ['雲端憑證', /AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_\-]{35}|ghp_[A-Za-z0-9]{36}|sk-[A-Za-z0-9]{32,}/g],
  ['身分證字號', /\b[A-Z][12]\d{8}\b/g],
  ['本機路徑', /\/Users\/[a-z][\w.\-]*\//gi],
];
const TEXTLIKE = new Set(['.html', '.js', '.css', '.json', '.xml', '.txt', '.svg', '.webmanifest']);

for (const f of allFiles) {
  if (!TEXTLIKE.has(extname(f))) continue;
  const s = readFileSync(f, 'utf8');
  for (const [name, re] of SECRETS) {
    const hits = [...new Set(s.match(re) || [])];
    for (const h of hits) fail('資安', rel(f), `疑似${name}：${h.slice(0, 40)}`);
  }
}

// target="_blank" 必須有 rel，否則新分頁可以操作原分頁
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/\brel="[^"]*noopener/.test(m[0])) {
      fail('資安', rel(f), `target="_blank" 缺少 rel="noopener"：${m[0].slice(0, 70)}`);
    }
  }
}

// 二進位資產無法自動檢查內容
const binaries = allFiles.filter((f) => ['.pdf', '.docx', '.xlsx'].includes(extname(f)));
for (const b of binaries) {
  warn('資安', rel(b), '無法自動檢查內容。新增或更換時請人工確認沒有個人聯絡資訊');
}

// ── 3. 無障礙 ─────────────────────────────────────────
let imgCount = 0;
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const stub = isStub(html);
  const name = rel(f);

  // 語言標示
  if (!/<html[^>]+lang="/.test(html)) fail('無障礙', name, '<html> 缺少 lang 屬性');

  // 圖片替代文字
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    imgCount++;
    if (!/\balt=/.test(m[0])) fail('無障礙', name, `圖片缺少 alt：${m[0].slice(0, 70)}`);
  }

  // SVG 若標示為圖片，就必須有名稱
  for (const m of html.matchAll(/<svg\b[^>]*>/g)) {
    if (/role="img"/.test(m[0]) && !/aria-label|aria-labelledby/.test(m[0])) {
      fail('無障礙', name, 'SVG 標示 role="img" 但沒有 aria-label');
    }
  }

  // 表格需要標題與欄位對應
  for (const m of html.matchAll(/<table\b[\s\S]*?<\/table>/g)) {
    if (!/<caption/.test(m[0])) fail('無障礙', name, '表格缺少 <caption>');
    if (!/scope="/.test(m[0])) fail('無障礙', name, '表格的標題儲存格缺少 scope');
  }

  // 重複的 id 會讓輔助科技與錨點失效
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  for (const d of [...new Set(dup)]) fail('無障礙', name, `id 重複：${d}`);

  if (stub) continue;   // 轉址頁以下不適用

  // 每頁恰好一個 h1
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail('無障礙', name, `應有 1 個 <h1>，實際 ${h1} 個`);

  // 標題層級不應跳號（h2 後面直接出現 h4）
  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) {
      warn('無障礙', name, `標題層級跳號：h${levels[i - 1]} 之後直接出現 h${levels[i]}`);
      break;
    }
  }

  // 連結需要可讀的文字
  for (const m of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g)) {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    const hasLabel = /aria-label=|aria-labelledby=/.test(m[0]);
    const hasImgAlt = /<img[^>]+alt="[^"]+"/.test(m[1]);
    if (!text && !hasLabel && !hasImgAlt) {
      fail('無障礙', name, `連結沒有可讀文字：${m[0].slice(0, 70)}`);
    }
  }
}

// ── 報告 ──────────────────────────────────────────────
const byCat = (list, cat) => list.filter((x) => x.cat === cat);
const CATS = ['連結', '資安', '無障礙'];

console.log('');
console.log(`檢查 ${htmlFiles.length} 個頁面、${linkCount} 個站內連結、${imgCount} 張圖片`);
console.log('');

for (const c of CATS) {
  const p = byCat(problems, c);
  const w = byCat(warnings, c);
  const mark = p.length ? '✗' : w.length ? '!' : '✓';
  const note = p.length ? `${p.length} 個問題` : w.length ? `${w.length} 個提醒` : '通過';
  console.log(`  ${mark} ${c}：${note}`);
  for (const x of p.slice(0, 12)) console.log(`      ✗ ${x.file}  ${x.msg}`);
  if (p.length > 12) console.log(`      … 另有 ${p.length - 12} 個`);
  for (const x of w.slice(0, 6)) console.log(`      ! ${x.file}  ${x.msg}`);
  if (w.length > 6) console.log(`      … 另有 ${w.length - 6} 個提醒`);
}

console.log('');
if (problems.length) {
  console.log(`✗ 有 ${problems.length} 個問題必須修正後才能推送。`);
  process.exit(1);
}
if (STRICT && warnings.length) {
  console.log(`✗ --strict 模式：${warnings.length} 個提醒視為問題。`);
  process.exit(1);
}
console.log(warnings.length ? `✓ 沒有問題。另有 ${warnings.length} 個提醒，請確認過再推送。` : '✓ 全部通過。');
