# UBI Taiwan 官方網站（Astro）

以 [Astro](https://astro.build) 打造的 UBI Taiwan 官網：純靜態輸出、零前端框架依賴，維護門檻最低，適合 NGO 團隊接手。

## 先讀哪一份

| 你是 | 讀這份 |
|---|---|
| 接手維護的協會成員 | [交接手冊.md](交接手冊.md) —— 不需要會寫程式 |
| AI agent | [AGENTS.md](AGENTS.md) —— 專案規則、不可更動的決定、已知陷阱 |
| 工程人員 | 本文件 ＋ [design-system/DESIGN-SYSTEM.md](design-system/DESIGN-SYSTEM.md) |

## 快速開始

```bash
npm install
npm run dev      # 開發模式 http://localhost:4321
npm run build    # 產出靜態網站至 dist/
npm run preview  # 預覽 build 結果
```

## 專案結構

```
src/
  pages/                              # 網站地圖見「資訊架構」一節
    index.astro                       # 首頁
    articles.astro                    # 認識基本收入 → 基本收入二三事
    life-freedom.astro                # 生活自由計畫（第二階段實驗；網址刻意不搬）
    support.astro                     # 捐款支持
    ubi/                              # 認識基本收入
      index.astro                     #   什麼是基本收入（定義、五大條件、誰在支持）
      world.astro                     #   全球進程（13 個案例）
      faq.astro                       #   基本收入大哉問（14 題）
      reading.astro                   #   延伸閱讀
    experiment/                       # 台灣的實驗
      index.astro                     #   實驗總覽（兩階段時間軸）
      pilot.astro                     #   第一階段：單親家庭實驗
    impact/                           # 我們的行動
      index.astro                     #   行動里程碑
      international/index.astro       #   國際交流列表 ← 新增場次加在這裡
      international/2025-brazil.astro
      international/2024-bath.astro
      international/2023-korea.astro
      annual/index.astro              #   年度報告列表 ← 新增年度加在這裡
      annual/2025.astro, 2024.astro
    about/                            # 關於我們
      index.astro                     #   願景與團隊
      press.astro                     #   媒體專區（媒體報導清單的正本）
      transparency.astro              #   捐款徵信
    （根目錄另有 9 個舊網址的轉址頁，見「網址變更」一節）
  data/                               # 頁面文案（自團隊 docx 逐字轉出，非人工轉錄）
    ubi-content.json                  #   五大條件、支持者、13 案例、14 問答、延伸閱讀
    pilot-content.json                #   第一階段實驗七個區塊
    brazil-content.json               #   2025 巴西 BIEN
  layouts/BaseLayout.astro, RedirectStub.astro
  components/Header.astro, Footer.astro
  styles/tokens.css     # Design tokens（單一來源）
  styles/global.css     # 全站基礎樣式
public/images/          # 自原站下載之圖片素材
design-system/
  DESIGN-SYSTEM.md      # 設計系統規範（可貼入 claude.ai/design）
  tokens.json           # W3C Design Tokens 格式
docs/                   # 內部文件，不進版控（見 .gitignore）
  content-specs/        # 團隊提供內容的規格檔（三個頁面）
  new-input/            # 團隊提供的原始 docx
references-info/
  生活自由計畫-網頁內容素材.md  # 參考資料擷錄整理（內容單一來源）
```

## 首屏（照片底）

協會偏好首屏用真實照片打底。版型收在 `src/components/PageHero.astro`，各頁只給圖與文案，
深色遮罩與對比一致由元件控制；首頁因為含填空與按鈕，就地實作但用同一套規則。

兩個實作重點：

- 圖用 `<img>` 而非 `background-image`，才能給 `alt`、`fetchpriority="high"` 與寬高，
  避免 LCP 被延後、也避免圖載入時版面跳動。這些照片帶有資訊（遊行、首映會、團隊），
  不是純裝飾，因此給實質 alt 而非 `alt=""`。
- 遮罩由上而下加深。**換照片時請重算對比**——白字壓在照片上，最差像素也必須 ≥4.5:1。
  現行四張皆已實測：首頁 4.59、國際交流 4.98、關於我們 5.09、台灣的實驗 6.04。
  文字另加柔和陰影作為保險，比把遮罩加深好——不會犧牲照片本身的可見度。

**已知限制**：現有照片多為 1024px 寬，在 1920px 螢幕上會放大到 1.88 倍、2560px 上 2.5 倍，
首屏會偏軟。若要改善需向團隊索取原始解析度檔案（目前最大的一張是 1600px 的 BIEN 大會開幕照）。

## 資訊架構

2026-08 改版重排。核心原則：**導覽只放「類別」，單筆紀錄一律收進列表頁。**

改版前每一筆紀錄（各年度報告、各場國際交流）都直接掛進下拉選單，
選單長度隨年份線性成長——「我們在做什麼」已有 6 項，每年還會再增加 2～3 項。
現在「國際交流」與「年度報告」各有一個列表頁，**新增年份請加進列表頁的陣列，不要再掛進 `Header.astro`**。

頂層 4 項 + 捐款 CTA。
（「生活自由計畫」原為招募期間的頂層獨立入口，報名 2026/08/31 截止在即，
已於 2026-08 收回「台灣的實驗」底下；網址 `/life-freedom/` 維持不變。）

| 導覽 | 路徑 | 內容 |
|---|---|---|
| 認識基本收入 | `/ubi/` | 什麼是基本收入、全球進程、大哉問、延伸閱讀、二三事 |
| 台灣的實驗 | `/experiment/` | 實驗總覽、第一階段、第二階段 |
| 我們的行動 | `/impact/` | 行動里程碑、國際交流、年度報告 |
| 關於我們 | `/about/` | 願景與團隊、媒體專區、捐款徵信 |
| 捐款支持 | `/support/` | 頂層 CTA |

## 網址變更

改版重排了網址，舊網址皆保留 `noindex` 的 meta refresh 轉址頁（`src/layouts/RedirectStub.astro`）。
純靜態主機沒有伺服器端轉址，只能用這個方式；若部署於支援 301 的環境，
應改以伺服器設定轉址並移除根目錄那 9 個轉址頁，同時清掉 `astro.config.mjs` 的 sitemap 排除清單。

> 這份清單是依協會提供的舊網址整理的，**未必涵蓋舊站的全部網址**。
> 正式切換前建議比對舊站的實際網址清單，見下方「正式上線檢查表」第 5 項。

| 舊網址 | 新網址 |
|---|---|
| `/qa/` | `/ubi/faq/` |
| `/pilot-program/` | `/experiment/pilot/` |
| `/impacts/` | `/impact/` |
| `/press/` | `/about/press/` |
| `/credit-donate/` | `/about/transparency/` |
| `/2024report-impact/` | `/impact/annual/2024/` |
| `/ubi-taiwan/2025report-impact/` | `/impact/annual/2025/` |
| `/2023-korea-basic-income-summit/` | `/impact/international/2023-korea/` |
| `/國際交流-2024英國巴斯bien高峰會/` | `/impact/international/2024-bath/` |

`/life-freedom/` 是唯一不搬的頁面：報名入口在 JUJI 官方活動頁，招募期間（至 2026/08/31）
可能有外部連結指入，改網址風險過高。


## 與原站的差異備註

- 內容自 ubitaiwan.org/zh 原站移植；網站地圖已於 2026-08 重排，見上方「資訊架構」。
- 「基本收入二三事」列表卡片連回原站文章頁（部落格文章本文未搬遷）。
- 「捐款徵信」各月份明細由協會後台維護，頁面連回原站明細。
- 部分素材尚未到位：紀錄片截圖、首映會照片、夥伴 logo、名人頭像。缺漏清單見各頁規格檔的「開發待辦」表。
- 捐款金流連結沿用原站 neticrm 系統。

## 部署

本專案交付時**不含任何部署設定**（無 GitHub Pages、無 GitHub Actions）。
`npm run build` 產出的 `dist/` 可直接部署到任何靜態主機。

### 搜尋引擎收錄：預設關閉

`noindex` 與 sitemap 由同一個旗標控制，預設都是保守的一邊：

| 建置方式 | 結果 |
|---|---|
| `npm run build` | 全站 `noindex, nofollow`、不產生 sitemap |
| `SITE_INDEXABLE=true npm run build` | 開放收錄、產生 sitemap |

**這個預設是刻意的**：忘記設定的後果是「沒被收錄」，而不是「意外公開」。
在正式上線之前不要改動。

實作在 `src/layouts/BaseLayout.astro`（head 的 robots meta）與
`astro.config.mjs`（sitemap 整合）。轉址頁走 `RedirectStub.astro`，
一律輸出 `noindex, follow`，不受旗標影響。

改動 head 或旗標邏輯後，用這兩道指令確認：

```bash
npm run build
grep -L 'content="noindex' dist/**/index.html   # 應無輸出（每頁都有 noindex）

SITE_INDEXABLE=true npm run build
grep -l 'content="noindex' dist/index.html      # 應無輸出（首頁不再有 noindex）
ls dist/sitemap*                                # 應有輸出
```

### 正式上線檢查表

正式站部署於網域根目錄（ubitaiwan.org）時，原始碼皆以根路徑撰寫，
`npm run build` 產出 `dist/` 直接部署即可。另需處理：

1. **在建置環境設定 `SITE_INDEXABLE=true`**，解除全站 noindex 並恢復 sitemap。
   注意只在**正式環境**設定——預覽／分支部署要維持預設，否則會出現重複內容。
2. **改用伺服器端 301 轉址**：把「網址變更」表中的 9 組對應設定到伺服器，
   並刪除 `src/pages/` 根目錄那 9 個轉址頁與 `src/layouts/RedirectStub.astro`。
   meta refresh 只是無伺服器轉址時的替代方案。
3. **清掉 `astro.config.mjs` 的 `redirectStubs` 排除清單**：那份清單只是為了
   讓 sitemap 不收錄 noindex 的轉址頁，改用 301 後就不需要了。
4. **確認 canonical 指向有效網址**：目前各頁 canonical 已指向 ubitaiwan.org
   的新結構，上線後即自動正確。
5. **比對舊站的網址清單**：目前的 9 條轉址是依協會提供的清單建立的。
   切換前建議從舊站的 sitemap 或搜尋引擎收錄清單抓出完整網址，
   確認沒有遺漏——漏掉的舊網址會在切換後變成 404，而且通常兩三個月後才被發現。
