# 百宏文教機構官網

正式站：https://www.bhcs.com.tw/ 。GitHub Pages 從 `main` 發布靜態檔案。修改應以 PR 交付，等 CI 通過再合併，部署後確認正式網址。

## 來源與產出

- 主站頁面：根目錄 HTML；共用樣式 `assets/style.css`，選單與預約流程 `assets/site.js`。
- 研究站：`scripts/science/` 為教材與互動來源，`assets/researcher-lab.*` 為共用研究員介面。修改來源後執行 `build_science.mjs`，不要只改產出頁。
- 顯微鏡：繪圖來源由 `build_microscope.mjs` 內嵌到 HTML。
- 教育觀點：文章正文及閱讀版面保留在 `wenzhang/*.html`。`build_site.mjs` 以首頁的頁首、頁尾及聯絡列為共用來源，套用至文章頁；品牌覆蓋樣式在 `assets/article-site.css`。新增或由外部流程產生文章後，也要執行這個步驟。
- `build_site.mjs` 同時更新主站資源版本及頁尾營業時間；共用 CSS／JS 改動時更新該腳本的 `version`。
- 數學單檔工具保留自身的出題與列印版面；來源及驗收說明見 `scripts/README.md`。
- P1 數學螢幕配色由 `scripts/build_math_brand.mjs` 內嵌至 39 個單檔（88 個入口），不增加外部依賴；原始列印規則不改，教用答案統一品牌紅。後續 P2 或教材項目若刻意修改出題邏輯，須更新 `check_math_brand.cjs` 的 P1 基準與對應回歸測試，不能停用數學檢查。

## 建置與檢查

```sh
npm ci --prefix scripts
node scripts/build_microscope.mjs
node scripts/build_science.mjs
node scripts/build_site.mjs
node scripts/build_math_brand.mjs
npm test --prefix scripts
node scripts/check_science_integration.cjs
```

產出納入 Git 後，再重跑建置應沒有差異。CI 另跑 researcher batch 1–5、真實 Chromium 全站及預約流程、研究站構圖、顯微鏡拖曳與全站操作。瀏覽器檢查需要 Playwright 與 Chromium，輸出截圖會上傳為 Actions artifacts。JSDOM 通過不等於真實畫面已驗收。

## 預約流程與資料

目前採 LINE 預約，沒有啟用直接收件的後端。填寫資料後會另開百宏官方 LINE；家長必須在 LINE 按「傳送」，百宏才會收到。網站提供內容預覽、複製備援與清除按鈕。

草稿只保存在該瀏覽器分頁的 sessionStorage，最多 2 小時；儲存被封鎖時會顯示備援提示。不把姓名、電話或預約訊息寫入網站分析事件或可被分析追蹤的外連 href。未設定收件端點前，不得把畫面改成「已收到預約」。

若要改為直接收件，先提供實際可用的端點、收件目的地及成功／失敗回應契約，再串接與驗證。Google 評論、實景照片、費用方式、班級人數需以實際資料補充。

正式站驗收可加 `?noga=1`，避免測試流量進入網站分析。驗收 LINE 流程應攔截外部開啟，不向官方帳號發送測試訊息。
