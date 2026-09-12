// GitHub Pages 預覽部署用：把 dist/ 內的站內絕對路徑加上 repo 子路徑前綴。
// 正式站部署於網域根目錄時不需要此步驟——原始碼保持根路徑寫法。
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BASE = process.env.PAGES_BASE; // 例如 "/ubi-taiwan-website"
if (!BASE) {
  console.log('PAGES_BASE 未設定，略過路徑改寫');
  process.exit(0);
}

const ESC = BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, fn) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, fn);
    else fn(p, name);
  }
}

function rewrite(file) {
  let s = readFileSync(file, 'utf8');
  // href="/..." 與 src="/..."（排除 //、http、已含前綴者）
  s = s.replaceAll(/(href|src)="\/(?!\/)/g, `$1="${BASE}/`);
  // meta refresh 的 content="0; url=/..."（轉址頁用，不走 href/src）
  s = s.replaceAll(/(content="\d+;\s*url=)\/(?!\/)/g, `$1${BASE}/`);
  // CSS 的 url(/...)：inline style 屬性與 <style> 區塊都算。
  // 翻卡與政策頁摘要的底圖是用 inline style 指定的，先前沒改寫，
  // 在子路徑下全部 404——只改 href/src 並不夠。
  s = s.replaceAll(/url\((['"]?)\/(?!\/)/g, `url($1${BASE}/`);
  writeFileSync(file, s);
}

walk('dist', (p, name) => {
  if (/\.(html|xml|txt)$/.test(name)) rewrite(p);
});

// 改寫後自我檢查：站內絕對路徑一律應以 BASE 開頭。
// 有漏網就讓部署失敗，而不是靜靜上線一批 404 的資源。
//
// 注意 lookahead 的位置：BASE 本身含開頭斜線，因此不能先把 `/` 消耗掉
// 再檢查，否則已正確加上前綴的路徑會被誤判為漏網。
const leaks = [];
const PATTERNS = [
  new RegExp(`(?:href|src)="(?!//|${ESC}/)/[^"]*`, 'g'),
  new RegExp(`url\\((?:['"])?(?!//|${ESC}/)/[^)]*`, 'g'),
];

walk('dist', (p, name) => {
  if (!/\.(html|xml)$/.test(name)) return;
  const s = readFileSync(p, 'utf8');
  for (const re of PATTERNS) {
    for (const m of s.match(re) || []) leaks.push(`${p}  ${m.slice(0, 90)}`);
  }
});

if (leaks.length) {
  console.error(`✗ 有 ${leaks.length} 處站內路徑未加前綴，部署中止：`);
  for (const l of leaks.slice(0, 20)) console.error('   ', l);
  process.exit(1);
}

console.log('已將站內路徑加上前綴:', BASE, '（自我檢查通過）');
