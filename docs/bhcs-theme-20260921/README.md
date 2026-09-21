# 自然研究站品牌化改版（2026-09-21，Claude）

基底：使用者上傳的 `bhcs-web-main.zip`（main 母檔）。範圍：20 個研究站＋研究基地總覽。未改任何科學模型、題目、紀錄邏輯。

## 為什麼改

官網是「方格紙＋紅筆批改」（墨藍 `#16233A`、紅 `#C8352B`、橘 `#E8620C` 只給 CTA、Noto Serif 900、4px 圓角）；研究站卻是青綠漸層、膠囊形、大圓角與立體按鈕，看起來像另一個品牌。插圖沿用，換掉的是外框與動線。

## 改了哪些來源

| 檔案 | 內容 |
|---|---|
| `assets/researcher-lab.css` | 檔尾新增「BHCS brand theme」層（`--bh-*` 變數，第 1–16 節）。原有規則一行未刪，氣泡對位等既有修正保留。要換色只改 `:root` 的 `--bh-*`。 |
| `assets/researcher-lab.js` | 刊頭改為百宏 logo＋站名＋「學習資源／官網／研究基地」；步驟編號 01–04；總覽頁依科目分組、卡片精簡成整張可點；載入與官網相同的 Google Fonts（失敗自動退回系統字）；`?nofonts` 可關閉。 |
| `scripts/build_science.mjs` | 版本號 `20260921-bhcs-theme`；`ziyuan.html` 自然實驗入口區塊改品牌配色。 |
| 產出 | `tools/*-lab.html`、`tools/science/*.html`、`ziyuan.html` 由建置腳本重建（只有版本號與上述區塊變動）。 |

## UX 變更

- 第二批 10 站操作台：桌機改「左：01 設定 → 右：02 觀察」，設定欄 sticky；原本 02 在左、01 在右。
- 手機操作台改成單一路徑：設定 → 開始觀察 → 圖解 → 讀值 → 你的解釋 → 收進手冊。原本「你的解釋」排在看到結果之前。
- 步驟導覽手機版由兩列改一列；刊頭加導覽合計高度約 130px → 約 105px。
- 橘色只留給「開始／下一步」；「收進手冊」改墨藍實心，兩者不再互搶。
- 挑戰題選項整列可點（46px 高）、選取有紅色側標。
- 第一批教材手機版：觀察區與讀值原本只佔約 60–80% 寬，改為滿寬。
- 總覽頁：依 國小自然／生物／理化／地科 分組，篩選後空組自動隱藏；卡片移除雙層框、三顆標籤與 29 顆橘色按鈕。頁長 1280px：5981 → 3639px；390px：14531 → 7341px。

## 實測（本機 Chromium 1194 / Playwright 1.56 / Node 22，Noto CJK）

| 檢查 | 結果 |
|---|---|
| `check_researcher_composition.cjs`（20 站＋總覽 × 390/768/1280） | 63 / 63 |
| `check_researcher_browser.cjs`（顯微鏡實際拖曳） | 8 / 8 |
| `check_researcher_operations.cjs` | 40 / 40 |
| `test_researcher_batch1.cjs` | PASS |
| 自行巡檢：20 站 × 4 步驟 × 3 寬度，水平溢位與 JS error | 0 |
| 建置可重現（改版前重跑 build 與 zip 零差異） | 是 |

## 沒有驗證到的

- `npm test`、`check_science_integration.cjs`、`test_researcher_batch2–5.cjs` 需要 jsdom，本機無網路無法安裝，**未執行**，請由 CI 確認。我核對過它們對 `researcher-lab.css/js` 的字串斷言，相關字串都還在，但這不等於跑過。
- Google Fonts 在本機被擋，截圖是退回 Noto CJK 的樣子；線上會載入 Noto Serif TC 900，標題筆畫會更重。
- 未在實體手機／Safari 上測。

## 刻意沒做

- 「改條件就清空圖解、要再按一次開始觀察」是預測流程的殘留，體驗不好；但要改 `runtime.js`，而 jsdom 測試我跑不了，所以留到能跑測試時再動。
- `tools/math/` 總覽與 `tools/mini-lab/` 也偏離品牌，列第二輪。
- 主題層是疊加而非重寫，`researcher-lab.css` 現在有多層覆寫。穩定後值得整併成單一乾淨版本。

截圖見同資料夾 `.webp`。

---

## 第二輪（同日）：第四輪補圖整合

ChatGPT 依 `docs/science-art-prompts-round4.md` 交回 4 張，全部採用，無未用檔。

| 來源 | 產出 | 處理 | 用在哪 |
|---|---|---|---|
| 月相貼紙（1254²） | `assets/science/icons/icon-moon.webp`（256²，透明底） | 去白底、重建白色貼紙邊、置中縮放 | 總覽頁月相／日月食兩張卡。舊版是唯一帶深藍方底的 icon |
| 余老師思考（1086×1448） | `tools/mini-lab/img/doc-think.png`（243×600，256 色） | 同上，規格對齊既有 `doc-*.png` | 第二批操作台「尚未觀察」空白圖解區 |
| 余老師歡呼 | `tools/mini-lab/img/doc-cheer.png`（321×600，256 色） | 同上 | ①研究手冊存滿兩筆 → 「兩筆證據到手了！」＋前往挑戰題 ②挑戰題全對 → 「這一站完成！」＋回研究基地 |
| 實驗桌橫幅（1731×909） | `assets/og-science.jpg`（1200×630，約 150 KB） | 裁切後以程式疊上 logo、標題（Noto Serif CJK TC）、紅筆底線與網址；模型未生成任何文字 | 研究基地與第二批 10 站的 `og:image` |

去背做法：從畫面邊緣 flood-fill 近白區，保留主體後自行向外膨脹 9–10px 重建白邊，所以四周白邊寬度一致，不依賴原圖那條淡灰描線。月相的白邊不做孔洞填補，否則弦月與相鄰月亮之間會被填白。

### 新增行為（`assets/researcher-lab.js`）

- `updateNotebookReturn()`：紀錄 ≥ 2 筆時顯示 `.researcher-done`，原本的「回去做第二筆」同時隱藏。原本存滿兩筆後手冊頁沒有下一步提示。
- `installQuizCheer()`：監看 `#quizScore`／`#quiz-score`，只有「答對 n／n」且沒有未答題時顯示 `.researcher-cheer`；改答案即收起。不改動原本的計分程式。

### 第二輪實測

| 檢查 | 結果 |
|---|---|
| composition / browser / operations | 63/63、8/8、40/40 |
| 光學站 1280 與 390：存兩筆 → 完成提示出現、返回提示隱藏；全對 → 歡呼出現；改答案 → 收起；答錯重查 → 不出現 | 通過，JS error 0 |
| 電路站（第一批計分格式）390：窮舉 27 種作答，只有全對那一組出現歡呼 | 通過 |
| 20 站 × 4 步驟 @390 溢位與 JS error | 0 |

jsdom 測試仍未能在本機執行，同第一輪。og 圖需上線後用 Facebook／LINE 的分享偵錯工具重新抓取才會更新快取。

---

## 第三輪（同日）

1. **預覽圖解**（`scripts/science/runtime.js`）：第二批 10 站在無預測流程下，改條件不再把圖解清成白框，而是即時畫出淡化預覽（左上角「預覽｜按「開始觀察」讀取數值」）；讀值與可存紀錄仍須按「開始觀察」。對應修改一處測試斷言，詳見 `CHATGPT-TEST-HANDOFF.md`。
2. **`tools/math/index.html`**：深綠刊頭改為官網語彙；新增搜尋與年級跳轉列（無 JS 時整列隱藏、88 張卡照常顯示）；隱藏對家長沒有意義的檔名小字。88 個連結與原本一致。
3. **`tools/mini-lab/index.html`、`lab-safety.html`**：在各自 `<style>` 尾端加主題覆寫（維持單檔），移除青綠漸層 hero 與大圓角；橘色只給主要動作、綠色只表示正確。互動程式未動。

實測：operations 40/40（runtime 改動後重跑）、batch1 PASS；mini-lab 進場流程、lab-safety 分頁切換、math 搜尋（「因式」→ 2 張、無結果提示）於 390 與 1280 通過，水平溢位與 JS error 為 0。jsdom 測試仍未執行。

---

## 第四輪（同日）：處理 r3 驗收的兩個阻擋項

依使用者轉述的 ChatGPT 驗收結論修正（驗收 zip 本身未傳到 Claude 這邊，失敗的 axe rule id 是依程式推定，見下）。

1. **光學、能量站互動 SVG 可及性**（`scripts/science/diagrams.mjs`）：主圖根節點原為 `role="img"`，裡面卻有 `tabindex="0" role="button"` 的拖曳把手。`img` 的子孫對輔助科技是隱藏的，對應 axe `nested-interactive`（wcag2a）。原本測試只在重設後（圖解為空）跑 axe 所以沒被抓到，r3 的預覽讓圖常駐才浮現。修正：含 `data-lab-drag` 的圖改 `role="group"`，名稱仍由 `aria-labelledby` 提供；其餘 8 站維持 `role="img"`。
2. **整合檢查白名單**（`scripts/check_science_integration.cjs`）：`approvedMathPreview` 加入 `tools/math/index.html`（使用者已核准該頁品牌化），同時新增斷言該頁必須保有 88 個 `class="card"` 連結，避免白名單放寬後連結被誤刪。

實測：以真瀏覽器對 10 站在「載入／觀察後／重設後」三種狀態檢查「`role=img|button` 內含可聚焦後代」與「可聚焦元素無名稱」，皆為 0；operations 40/40；batch1 PASS。**axe 本身與 `check_science_integration.cjs` 仍無法在本機執行**，若 `npm test` 還報可及性違規，請回傳 violation 的 `id` 與 `nodes[].html`。
