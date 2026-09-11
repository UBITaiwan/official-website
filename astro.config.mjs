// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// 2026-08 改版後的舊網址，皆為 noindex 的 meta refresh 轉址頁，
// 不應出現在 sitemap（否則等同請搜尋引擎去爬明示不要收錄的頁面）。
const redirectStubs = [
  '/qa/',
  '/pilot-program/',
  '/impacts/',
  '/press/',
  '/credit-donate/',
  '/2024report-impact/',
  '/2023-korea-basic-income-summit/',
  '/ubi-taiwan/2025report-impact/',
  '/國際交流-2024英國巴斯bien高峰會/',
];

// sitemap 與 noindex 由同一個旗標控制，預設都是保守的一邊。
//
// 未設定 SITE_INDEXABLE 時不產生 sitemap。原因：sitemap 內的網址一律以下方
// site 設定為準（正式網域 ubitaiwan.org），但預覽環境部署在別的網址上。
// 若預覽站的 sitemap 被爬蟲取得，會對正式網域發出一批註定 404 的請求。
// 預覽環境本身已全頁 noindex，本來就不需要 sitemap。
//
// 正式上線時在建置環境設定 SITE_INDEXABLE=true，sitemap 與收錄會一起開啟。
const isIndexable = process.env.SITE_INDEXABLE === 'true';

// UBI Taiwan 官網：純靜態輸出，無任何前端框架依賴，維護門檻最低
export default defineConfig({
  site: 'https://ubitaiwan.org',
  output: 'static',
  integrations: !isIndexable
    ? []
    : [
        sitemap({
          filter: (page) => {
            const path = decodeURIComponent(new URL(page).pathname);
            return !redirectStubs.includes(path);
          },
        }),
      ],
});
