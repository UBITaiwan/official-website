// 推送前檢查：連結、資安、無障礙、文字。
//
// 這支腳本存在的理由：這幾類檢查每次都要做，但每次手寫檢查邏輯就會重犯
// 同樣的錯——忘記處理 URL 編碼的中文路徑、漏掉 inline style 的 url()、
// 只檢查 href 而漏掉 src。寫成腳本之後，每次的答案都一樣。
//
//   node scripts/check.mjs          檢查 dist/
//   node scripts/check.mjs --strict 警告也視為失敗
//   node scripts/check.mjs --all    列出全部問題與提醒（預設每類只列前幾個）
//
// 需要先 npm run build 產生 dist/。
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = 'dist';
const STRICT = process.argv.includes('--strict');
const ALL = process.argv.includes('--all');     // 列出全部，不截斷

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

// ── 4. 文字 ───────────────────────────────────────────
// 規則的正本在 寫作規範.md，這裡只自動檢查「機器判斷得出來」的部分。
// 只看讀者看得到的字：內文、<title>、描述、alt、aria-label、title 屬性。
// 程式碼、網址、樣式不檢查。<cite> 裡的外部作品標題照原文，也不檢查。
//
// 會擋下來的（error）：判斷不需要上下文，錯了就是錯了。
// 只提醒的（warn）：有正當的例外，要人看上下文決定。

// 簡體字：只列「繁體中文裡不會出現」的字，避免誤判。
// 不要加入 后、里、划、台、干 這類繁體中文本來就有的字。
const SIMPLIFIED = '这们个为说时会来对发经过关还进现动实体么开问让应该给从资讯网络级业东车长门间无条见视频质币设计认识语议论读谁调谈国学习区务员产万与两总机构';

// 中國用語：繁體字形但不是台灣的說法。只提醒，因為少數有正當用法
// （例如物理的「質量」、引述對岸原文）。
const MAINLAND_TERMS = [
  ['視頻', '影片'], ['質量', '品質'], ['信息', '資訊、訊息'], ['默認', '預設'],
  // 不列「網絡」：「基本收入全球網絡（BIEN）」是正式譯名，「支持網絡」也是台灣慣用說法
  ['屏幕', '螢幕'], ['軟件', '軟體'], ['硬件', '硬體'],
  ['互聯網', '網際網路、網路'], ['渠道', '管道'], ['舉措', '措施'], ['激活', '啟用'],
  ['點擊', '點選'], ['鏈接', '連結'], ['登錄', '登入'], ['文檔', '文件'],
  ['反饋', '回饋'], ['調研', '調查'], ['智能', '智慧'], ['賦能', '（換個具體的說法）'],
  ['抓手', '（換個具體的說法）'], ['閉環', '（換個具體的說法）'], ['賽道', '領域'],
  ['頂層設計', '整體規劃'], ['短板', '弱點、不足'],
];

// 用詞：以「基本收入」為主。協會全名裡的「無條件」不算。
const TERM_WARNINGS = [
  [/無條件基本收入(?!協會)/g, '「無條件基本收入」只在講定義時使用，其他地方用「基本收入」'],
  [/全民基本收入/g, '「全民基本收入」只在必要時使用（例如外國政策的正式名稱），其他地方用「基本收入」'],
];

// 區塊元素換成換行，行內元素直接拿掉，這樣 <strong>UBI</strong>台灣
// 會被正確判定為「UBI台灣」（中英文沒有空格）。
const BLOCK_TAGS = 'address|article|aside|blockquote|br|dd|details|div|dl|dt|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|summary|table|tbody|td|tfoot|th|thead|tr|ul|option|button|label|caption|tspan|text';
const decode = (s) => s
  .replace(/&nbsp;/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function visibleText(html) {
  const parts = [];
  // 屬性裡的文字（替代文字、標籤、提示）
  for (const m of html.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]*)"/g)) parts.push(m[1]);
  for (const m of html.matchAll(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/g)) parts.push(m[1]);
  // 內文
  const body = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, '\n')
    // 引用的外部作品標題照原文呈現，不套用寫作規範
    .replace(/<cite\b[\s\S]*?<\/cite>/gi, '\n')
    .replace(/<head\b[\s\S]*?<\/head>/i, (h) => (h.match(/<title>[\s\S]*?<\/title>/) || [''])[0])
    .replace(new RegExp(`</?(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<[^>]+>/g, '');
  parts.push(body);
  return parts.map(decode).join('\n');
}

// 取出問題前後幾個字，方便回到原始檔搜尋
const around = (text, i, len) =>
  text.slice(Math.max(0, i - 8), i + len + 8).replace(/\s+/g, ' ').trim();

const HAN = '\\p{Script=Han}';
const NO_SPACE = new RegExp(`${HAN}[A-Za-z0-9]|[A-Za-z0-9]${HAN}`, 'gu');

let textChars = 0;
for (const f of htmlFiles) {
  const name = rel(f);
  const text = visibleText(readFileSync(f, 'utf8'));
  textChars += text.length;

  for (const m of text.matchAll(/—+/g)) {
    fail('文字', name, `使用了破折號（請改用「，」「。」「：」）：${around(text, m.index, m[0].length)}`);
  }
  for (const m of text.matchAll(NO_SPACE)) {
    fail('文字', name, `中英文或數字之間缺少空格：${around(text, m.index, 2)}`);
  }
  for (const m of text.matchAll(new RegExp(`[${SIMPLIFIED}]`, 'g'))) {
    fail('文字', name, `疑似簡體字「${m[0]}」：${around(text, m.index, 1)}`);
  }
  for (const [term, tw] of MAINLAND_TERMS) {
    for (const m of text.matchAll(new RegExp(term, 'g'))) {
      warn('文字', name, `「${term}」不是台灣慣用說法，建議改為${tw}：${around(text, m.index, term.length)}`);
    }
  }
  for (const [re, msg] of TERM_WARNINGS) {
    for (const m of text.matchAll(re)) {
      warn('文字', name, `${msg}：${around(text, m.index, m[0].length)}`);
    }
  }
}

// ── 報告 ──────────────────────────────────────────────
const byCat = (list, cat) => list.filter((x) => x.cat === cat);
const CATS = ['連結', '資安', '無障礙', '文字'];

console.log('');
console.log(`檢查 ${htmlFiles.length} 個頁面、${linkCount} 個站內連結、${imgCount} 張圖片`);
console.log('');

for (const c of CATS) {
  const p = byCat(problems, c);
  const w = byCat(warnings, c);
  const mark = p.length ? '✗' : w.length ? '!' : '✓';
  const note = p.length ? `${p.length} 個問題` : w.length ? `${w.length} 個提醒` : '通過';
  console.log(`  ${mark} ${c}：${note}`);
  const pn = ALL ? Infinity : 12, wn = ALL ? Infinity : 6;
  for (const x of p.slice(0, pn)) console.log(`      ✗ ${x.file}  ${x.msg}`);
  if (p.length > pn) console.log(`      … 另有 ${p.length - 12} 個（加上 --all 看全部）`);
  for (const x of w.slice(0, wn)) console.log(`      ! ${x.file}  ${x.msg}`);
  if (w.length > wn) console.log(`      … 另有 ${w.length - 6} 個提醒（加上 --all 看全部）`);
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
