# 給 ChatGPT／Codex 的測試交接（2026-09-21 第四輪，r4）

> r4 相對 r3 只多兩處：`scripts/science/diagrams.mjs`（光學／能量主圖 `role="img"`→`role="group"`）與 `scripts/check_science_integration.cjs`（白名單加 `tools/math/index.html`＋88 連結斷言），以及重建產出。請重跑下列全部項目；若 axe 仍失敗，回傳 violation 的 `id` 與 `nodes[].html`，Claude 沒看到 r3 驗收包，rule id 是推定為 `nested-interactive`。

這包是 Claude 在沒有 jsdom、沒有網路的環境做的。真瀏覽器檢查都跑過了，**jsdom 測試一支都沒跑過**。請在乾淨分支上照順序執行，先回報結果，不要先改程式。

## 1. 執行

```sh
npm install --prefix scripts --ignore-scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
git status --short          # 預期：build 後沒有任何檔案變動（產出已經是最新）
npm test --prefix scripts
node scripts/check_science_integration.cjs
for n in 1 2 3 4 5; do node scripts/test_researcher_batch$n.cjs; done
# 有 Chromium 的環境再跑：
node scripts/check_researcher_composition.cjs   # Claude 本機 63/63
node scripts/check_researcher_browser.cjs       # 8/8
node scripts/check_researcher_operations.cjs    # 40/40
```

## 2. 最可能出事的地方（依風險排序）

1. **`scripts/science/runtime.js` 行為改了**：無預測流程下，載入時、改條件後、重設後、離開自由觀察後，`#diagram` 不再是 `<p class="empty">`，而是淡化的預覽 SVG，並加上 `.is-preview`。刻意不變的：`#readouts` 清空、`#add-record` disabled、`#current-conditions` 為空、`current=null`（預覽不能被存成紀錄）。有預測的舊流程完全不受影響（`previewDiagram()` 在 `!noPrediction` 時直接 return false）。
2. **我改了一支測試**：`scripts/test_science_experience.cjs` 月相那段，原本斷言離開自由觀察後 `#diagram` 沒有 svg，改成斷言 `.is-preview` 且 `#readouts` 為空。如果你認為原斷言才是對的規格，請告訴使用者，不要默默改回去。
3. `test_science_ui.cjs` 第 50、52 行斷言改條件／重設後 `readouts.children.length===0`、`add-record` disabled：我讀過，設計上相容，但沒跑過。
4. 任何測試若斷言「頁面不得出現『預測』二字」：build 會把 runtime 裡的「預測」換成「事前判斷」，我新增的中文只有「預覽」，產出頁已 grep 過。
5. `check_science_integration.cjs` 會掃本機引用：新增引用有 `assets/og-science.jpg`（只出現在 og meta 的絕對網址）、`tools/mini-lab/img/doc-think.png`、`doc-cheer.png`（由 JS 組路徑）、`tools/math/index.html` 與 `tools/mini-lab/*.html` 的 `../../assets/logo.png`。

## 3. 失敗時怎麼回報

貼出：失敗的測試檔與行號、assert 訊息、你判斷是「規格衝突」還是「實作錯誤」。修正一律改來源（`scripts/science/*.js|mjs`、`assets/researcher-lab.*`、`scripts/build_science.mjs`），不要直接改 `tools/science/*.html` 產出。

## 4. 人工目視（線上部署後，網址加 `?noga=1`）

- `/tools/science/`：依科目分四組；搜尋「透鏡」時其他組標題要消失；月相卡 icon 是白底貼紙。
- `/tools/science/optics.html` → 動手做：一進來就看得到淡色光路圖與左上角「預覽」標籤；拖物距滑桿圖會跟著動但沒有讀值；按「開始觀察」後圖變實色、出現 4 個讀值。
- 同頁存兩筆 → 研究手冊出現歡呼的余老師與「前往挑戰題」；挑戰題全對 → 出現「回研究基地挑下一站」。
- 手機寬度：操作台順序為 設定 → 圖解 → 讀值 → 你的解釋 → 收進手冊。
- `/tools/math/`：搜尋「因式」應剩 2 張卡；年級導覽可跳轉。
- `/tools/mini-lab/` 與 `lab-safety.html`：方格紙底、無青綠漸層；輸入名字＋點三樣裝備後可進實驗室。
- Safari／實體手機尚未測過。
