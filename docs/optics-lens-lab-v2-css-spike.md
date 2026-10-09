# 光學導引頁｜`researcher-lab.css` 相容性 spike

日期：2026-10-07　基準：I3 Approved（`2535a86`）　範圍：唯讀評估，未改任何 repo 內的頁面、CSS 或測試。
方法：在 repo 外建三個最小頁面（四步導航、余老師提示、bench placeholder、卡片、CTA），用真實 Chromium 在 390×844 與 1280×800 量測並截圖。

| 版本 | 內容 |
|---|---|
| A1 | 載入 `assets/researcher-lab.css`，**不加** `body.researcher-ui`，不載入 `researcher-lab.js`，沿用 `.researcher-*` class |
| A2 | 同 A1，並加上 JS 會加的 `body.researcher-ui researcher-station` |
| B | 不載入 `researcher-lab.css`；自有 `.og-*` CSS，只複製品牌色票與圓角、陰影 token（約 3 KB） |

## 結論：**B**——只重用視覺語言（token、色票、素材），不重用外殼 CSS 與行為

### 四個問題

1. **能否在不載入 `researcher-lab.js` 的情況下安全重用？**
   - 技術上可以載入，且**沒有全域副作用**：沒有 `body.researcher-ui` 時，對純 `h1/p/a/button/input/select/textarea/table/details/fieldset/.card/.panel/.stage/footer` 的 computed style 與不載入時**完全相同**（逐項比對 16 個屬性，無差異）。
   - 但「能載入」不等於「值得載入」：A1 只得到 header、nav、coach、primary 按鈕這幾個元件；字型、背景、卡片、頁尾全都要靠 `body.researcher-ui` 才有，需自行補。
2. **390／1280 是否有意外布局或隱藏？**
   - A1、A2、B 在兩個寬度都**沒有水平溢出**（`scrollWidth − innerWidth = 0`），沒有元素跑出 viewport，沒有 failed resource，console 乾淨（A1-390 首次載入的一筆 404 是 `favicon.ico`，測試伺服器未提供，不是 CSS 問題）。
   - 但 A2（加 class）會造成**意外的版面接管**：隱藏 `.topbar`、`.hero`、`.stepnav`、`.lesson-route`；`body` 加上方格紙背景（`!important`）；`.card/.panel/.section/footer` 被強制換樣式（頁尾變深色、紅線）；`main.shell` 被設成固定寬。這些對 guided 頁是「被決定」而不是「選擇」。
   - A1 與 A2 的**同一個導航元件外觀不同**：A2 的 active 分頁幾乎看不出來（390 與 1280 皆然）。原因見下。
3. **哪些 class 可沿用？** 見下表。
4. **結論：B。**

### 為什麼不選 A

- `researcher-lab.css` 是 **75.6 KB、655 條規則、76 個 `!important`、155 處依賴 `.researcher-ui`**，由多輪改版**疊加**而成：同一個 `.researcher-nav`、`.researcher-coach`、`.researcher-primary` 各有 4～6 層互相覆蓋的宣告。最終外觀取決於這些層的順序與 `body` 上的 class，任何一層改動都可能讓 guided 頁的導航或卡片變形。
- 它的版面假設是「把既有課程頁的區塊搬進 screen」：`.researcher-screen{display:none}`、`.is-active{display:block}`、`.observation .stage`、`.labgrid` 等，與 v2 自己的 state engine 與 Spec §5 的雙欄／手機垂直順序無關。
- Spec 已決定不載入 `researcher-lab.js`，但 CSS 的 screen 切換與 `aria-current` 樣式仍預期該 JS 管理；留下的是半套契約。
- `--bh-*` 色票 token **只定義在這支 CSS 裡**（`style.css`、`site.js`、`article-site.css` 都沒有），所以 B 需要複製 token，不能只靠載入別的檔案。

### 為什麼不選 C（完全獨立）

品牌識別（色票、圓角、陰影、字型堆疊、logo、余老師圖）應與其他站一致，B 以複製 token 值達成；沒有理由另起一套視覺。

## class 與資源對照

| 項目 | 處置 |
|---|---|
| `--bh-ink / ink-soft / paper / card / grid / grid-strong / orange / orange-dark / ok / ok-soft / sans / radius / shadow / wrap` | **複製**成 guided 自有 token（值與 `researcher-lab.css` 的 `:root` 一致），不載入原檔 |
| `.researcher-header`、`.researcher-brand`、`.bh-logo` | **不沿用 class**；logo 直接用 `assets/logo.png` |
| `.researcher-nav`、`.researcher-step-number` | **不沿用**；自有 `.optics-guided-nav`（四欄 grid、`aria-current=step` 用單層樣式） |
| `.researcher-coach` | **不沿用**；自有 `.optics-guided-coach`，圖用 `tools/mini-lab/img/doc-*.png` |
| `.researcher-primary` | **不沿用**；自有 CTA 樣式（橘色 pill，`min-height:48px` 即滿足 44px target） |
| `.researcher-screen`、`.is-active`、`body.researcher-ui/-station`、`.labgrid`、`.observation .stage` | **完全不用** |
| `[data-lab-drag]{touch-action:none}` | 不用；改用 I3 的 `assets/optics-guided/input.css`（`[data-optics-bench]` = `pan-y`、`[data-optics-draggable]` = `none`），B 版已量到 bench computed `touch-action: pan-y` |
| 素材 | `assets/logo.png`、`tools/mini-lab/img/doc-point.png` 等可直接引用；三件器材 webp 留待 I4 驗證 |

## 數據（`overflowX` 皆為 `scrollWidth − innerWidth`）

| 版本 | 寬度 | overflowX | 超出 viewport 的元素 | bench 寬 | 導航欄數 | console／資源失敗 |
|---|---|---|---|---|---|---|
| A1 | 390 | 0 | 無 | 390（無 shell 寬度規則，貼邊） | 4 | 僅 favicon 404 |
| A1 | 1280 | 0 | 無 | 1280（貼邊） | 4 | 無 |
| A2 | 390 | 0 | 無 | 370 | 4 | 無 |
| A2 | 1280 | 0 | 無 | 1180 | 4 | 無 |
| B | 390 | 0 | 無 | 358 | 4 | 無 |
| B | 1280 | 0 | 無 | 773（8/12 欄，右側為余老師與卡片） | 4 | 無 |

## 對 I4 的影響與提醒

- 建立 `assets/optics-guided/optics-guided.css`，以 `.optics-guided` 為作用域，約數 KB；**頁面只載入這支加 `input.css`**，不載入 `researcher-lab.css`／`.js`，不加 `body.researcher-ui`。
- 桌機雙欄（左 8／右 4）在 B 版已驗證；**手機垂直順序**（導航 → 余老師 → bench → 即時狀態 → CTA → 資料卡，Spec §5.3）在 spike 中 bench 在 coach 前，I4 需依 Spec 調整 DOM 順序。
- 390px 導航第三欄「研究手冊」在 B 版會折成兩行；I4 調整字級或欄寬（例如隱藏 step number 或縮 gap）。
- 余老師圖在 coach 內約 64×112，手機佔高；I4 評估縮到 48px 寬。
- 未驗證：深色模式、列印樣式、`prefers-reduced-motion`、與 `site.js` 同頁載入時的相互影響。這些留給 I4／I7。
