# UBI Taiwan Design System v1.0

> 本文件為 UBI Taiwan 官網的完整設計系統規範。
> 結構刻意設計為可直接貼入 **claude.ai/design**（或任何 AI 設計工具）作為 design system context 使用：
> 所有 token 皆以 CSS 自訂屬性命名，並附語意用途說明；元件規範以「何時使用／怎麼用／禁止事項」描述。
> 機器可讀版本見同目錄 `tokens.json`（W3C Design Tokens 格式）；
> 實作版本見 `src/styles/tokens.css`（網站唯一引用來源）。

---

## 1. 品牌人格（Brand Personality）

- **溫暖而理性**：談的是社會制度，語氣卻是人與人的對話。
- **樂觀但務實**：相信更好的未來，同時用數據與實驗說話。
- **平易近人**：NGO 網站的讀者是所有人——用字避免術語，設計避免華麗。

一句話定調：**「像一位可靠的朋友，跟你聊一個更好的社會。」**

## 2. 色彩（Color）

### 2.1 品牌色階 Brand（UBI 天空藍）

| Token | 值 | 用途 |
|---|---|---|
| `--color-brand-50`  | `#F0F7FC` | 區塊淺背景（section subtle） |
| `--color-brand-100` | `#DCEDF8` | hover 背景、標籤底色 |
| `--color-brand-200` | `#B8DAF0` | 分隔線、時間軸、深色區塊上的文字 |
| `--color-brand-300` | `#8FC3E4` | 裝飾圖形 |
| `--color-brand-400` | `#62A9D4` | 圖示輔助色 |
| `--color-brand-500` | `#3E8FC4` | **品牌主色**：圖示、裝飾主色 |
| `--color-brand-600` | `#2B72A4` | 連結、主要按鈕（對白底對比 4.9:1）|
| `--color-brand-700` | `#225A83` | hover 深色、標題強調 |
| `--color-brand-800` | `#1C4867` | 深色標題 |
| `--color-brand-900` | `#163A54` | 深色表面（footer、inverse 區塊）|

### 2.2 輔助色

| Token | 值 | 用途 |
|---|---|---|
| `--color-accent-500` | `#1D5FD0` | 資料視覺化、數據強調、焦點環 |
| `--color-accent-700` | `#143F8C` | 資料視覺化深色 |
| `--color-warm-500` | `#E8834A` | 行動呼籲：捐款、報名（僅限 CTA）|
| `--color-warm-600` | `#CF6A31` | CTA hover |

### 2.3 分類用色（Categorical）

用於「同一組互斥類別」的區分，例如全球進程的三種案例類型。
**與語意色分開**：語意色表達狀態（成功／警告／錯誤），分類色只表達「不同類」。

| Token | 值 | 用途 |
|---|---|---|
| `--color-cat-policy` | `#6B4E9B` | 已實施的政策制度 |
| `--color-cat-advocacy` | `#C2601F` | 倡議行動 |
| `--color-cat-experiment` | `#2E7D4F` | 帶對照組的實驗 |

用法：卡片以 13% 淡染為底、實色作上緣邊與圓點。
`--color-cat-advocacy` 刻意比 `--color-warm-500` 深，避免與捐款 CTA 的橘混淆。
新增分類時往這組加，**不要借用語意色或 CTA 色**。

### 2.4 中性色與語意色

| Token | 值 | 用途 |
|---|---|---|
| `--color-ink-900` | `#1A2430` | 主要文字（對白底 15.2:1）|
| `--color-ink-700` | `#3D4B5C` | 次要文字（9.0:1）|
| `--color-ink-500` | `#64748B` | 說明文字（4.8:1，禁用於小於 14px）|
| `--color-ink-300` | `#C3CDD9` | 邊線（不可作為文字色）|
| `--color-ink-100` | `#EEF2F6` | 淺灰背景 |
| `--color-success` | `#2E7D4F` | 成功狀態 |
| `--color-warning` | `#B45309` | 警告狀態 |
| `--color-danger`  | `#B3261E` | 錯誤狀態 |

**色彩規則**
1. 一個畫面只能出現一個暖色 CTA（`warm-500`）；它是唯一的橘色，保留給「捐款／報名」等最重要行動。
2. 文字一律使用 `ink` 色階；品牌藍只用於連結、標題強調與互動元素。
3. 深色表面（`brand-900`）上的內文用 `brand-100`/`brand-200`，標題用白色。
4. 不得引入此表以外的顏色；資料視覺化優先用 `brand` + `accent` 色階。

## 3. 字體排印（Typography）

- 字族：`--font-sans`＝Noto Sans TC → PingFang TC → Microsoft JhengHei → system-ui。
- 內文 16px（`--text-base`）、行高 1.6；長文區塊行高 1.85。
- 中文標題不使用斜體；強調用字重或品牌色。

| Token | 值 | 用途 |
|---|---|---|
| `--text-4xl` | 2.75rem | Hero 大標（僅首屏，字重 900）|
| `--text-3xl` | 2.2rem | H1 |
| `--text-2xl` | 1.75rem | H2（區塊標題）|
| `--text-xl`  | 1.4rem | H3（卡片標題）|
| `--text-lg`  | 1.125rem | 導言、重點段落 |
| `--text-base`| 1rem | 內文 |
| `--text-sm`  | 0.9rem | 輔助說明 |
| `--text-xs`  | 0.8rem | 註解、法律文字 |

**排印規則**：每個區塊由「眉標（`.eyebrow`，品牌色小字）→ H2 → 導言 → 內容」構成；標題階層不得跳級（h1→h2→h3）。

## 4. 間距與版面（Spacing & Layout)

- 4px 基準刻度：`--space-1`(4) 到 `--space-24`(96)。
- 內容容器 `--container-max`＝72rem；長文容器 `--container-narrow`＝46rem（約 35–40 字/行）。
- 區塊垂直節奏：`.section` 上下各 `--space-16`（桌機）／`--space-12`（手機）。
- 相鄰區塊以背景色交替（白 → `brand-50` → 白 → `ink-100`）建立層次，不用分隔線。

## 5. 圓角、陰影、動態

- 圓角：卡片 `--radius-md`(12px)、按鈕與標籤 `--radius-full`、小元素 `--radius-sm`(6px)。
- 陰影：預設 `--shadow-sm`；hover 提升至 `--shadow-md`；`--shadow-lg` 僅限 modal。
- 動態：150–250ms、`--ease-out`；必須尊重 `prefers-reduced-motion`（全站已內建）。

## 6. 元件（Components）

### 6.1 按鈕 `.btn`
- `.btn--primary`（brand-600 底白字）：每區塊最多一顆，代表主要動作。
- `.btn--outline`（brand 邊框）：次要動作，與 primary 並列時置於其後。
- `.btn--warm`（warm-500 底白字）：僅限捐款／報名，全頁最多一顆常駐。
- **捐款 CTA 全站統一**：`.btn--warm` + 文字「捐款支持」，與導覽列的 CTA 一致；
  不要另創「前往捐款支持」「線上捐款支持」等變體（2026-08 依協會回饋定案）。
- 最小點擊面積 44×44px；文字不可換行。
- 禁止：純文字大小寫混排英文按鈕、三顆以上按鈕並列。

### 6.2 群組內容的版型（原 `.card` / `.grid--2/3/4`，2026-08 移除）

通用的卡片與等寬格線類別已從 `global.css` 移除。
理由：協會明確要求「少點卡片或看起來制式的元素」，而通用類別讓每一區都很容易被排成一列等寬方框，
整站因此長得像同一份表格。**請不要把它們加回來。**

群組內容改為依「內容本身是什麼」選擇版型：

| 內容性質 | 版型 | 現成範例 |
|---|---|---|
| 有先後或編號的原則 | 大編號 + 細線分隔的條列 | `support.astro` `.creed` |
| 一份清單／索引 | 名稱與說明分兩欄，細線分隔 | `support.astro` `.works`、`.usage` |
| 三兩則長敘事 | 左右交錯的圖文長列 | `index.astro` `.asks` |
| 並列的短概念 | 高低錯開、以細線相連的橫列 | `index.astro` `.forces` |
| 需要並排比較的選項 | 保留橫排，但以圖像與上緣色線界定，不加方框 | `support.astro` `.tiers` |
| 引述某個人說的話 | `blockquote` + 左側色邊 | `impact/annual/2024.astro` `.voice` |
| 時間序的紀錄 | 時間軸（左側軌道 + 節點） | `experiment/index.astro` `.ph` |
| 真實照片與手寫內容 | 大小不一、帶輕微傾斜的照片牆 | `index.astro` `.wall` |

共通原則：以**細線、色邊、留白**界定區塊，而不是用四邊框；同一區塊內的項目寬度不必相等。

### 6.3 導覽 Header
- Sticky、白底 94% 透明度 + blur、下邊線 `ink-100`。
- 現行頁面以 `aria-current="page"` 標註並給 `brand-100` 底色。
- 新功能連結可加 `NEW` 徽章（warm-500 底、圓角 full）。
- 行動版 ≤900px 收合為漢堡選單，按鈕需 `aria-expanded`/`aria-controls`。

### 6.4 頁尾 Footer
- `brand-900` 深色表面；四欄（品牌／了解更多／支持我們／聯絡）。
- 連結色 `brand-200`，hover 轉白並加底線。

### 6.5 區塊眉標 `.eyebrow`
- 品牌色、粗體、字距 0.12em；每個 section 開頭使用，建立掃讀節奏。

### 6.6 時間軸 `.timeline`
- 左側 3px `brand-200` 直線 + `brand-500` 圓點；年份粗體 `brand-700`。

## 7. 無障礙基線（Accessibility Baseline）

全站必須符合 WCAG 2.2 AA：

1. 文字對比 ≥ 4.5:1；大字（≥24px 或 19px 粗體）≥ 3:1。
2. 每頁提供「跳至主要內容」skip link（已內建於 Header）。
3. 鍵盤焦點一律可見：`--focus-ring`（3px accent-500，offset 2px）。
4. 所有互動元件可純鍵盤操作；裝飾性 SVG 一律 `aria-hidden="true"`。
5. 語言宣告 `lang="zh-Hant-TW"`；標題階層完整；地標區塊（header/main/footer/nav）齊備。
6. 動態尊重 `prefers-reduced-motion`。

## 8. 聲音與語氣（Voice & Tone）

- 用「我們」與「你」對話，不用「本會」「貴用戶」。
- 每個區塊先講人話（一句核心訊息），再給數據。
- 數字寫法：金額用「10,000 元」、年份用「2026 年」；避免縮寫。
- 標語資產：「#生活，本該如此」「好好生活，不只是生存」——關鍵頁面至少出現一次。

## 9. 檔案對照

| 檔案 | 角色 |
|---|---|
| `src/styles/tokens.css` | Token 實作（網站唯一來源）|
| `src/styles/global.css` | 基礎樣式與通用元件 |
| `design-system/tokens.json` | W3C 格式 token（供設計工具匯入）|
| `design-system/DESIGN-SYSTEM.md` | 本文件（供人類與 AI 工具閱讀）|

> **給 AI 工具的指示（paste 到 claude.ai/design 時保留本段）**：
> 產生任何 UBI Taiwan 介面時，僅使用上述 token 與元件規範；
> 不得引入新顏色或新字體；CTA 顏色規則（單一 warm CTA）與無障礙基線為硬性限制。
