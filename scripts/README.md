# 教材產生與檢查

2026-11-21 起，舊研究站（`tools/*-lab.html`）已由 `tools/lab/` 實驗桌取代並刪除；`build_microscope.mjs`、`science/experience.mjs`、`science/inquiry.mjs` 與對應測試一併移除。五個未列入目錄的引導式原型與 `scripts/fixtures/legacy/` 也已在同日移除；引導式只剩公開的電路接線實驗（`circuit-guided`）。

需要 Node.js 20+。只在開發環境安裝測試套件；網頁運作無需 npm 或框架。

```sh
npm install --prefix scripts --ignore-scripts
node scripts/build_science.mjs
npm test --prefix scripts
python scripts/build_sitemap.py
```

第二批「新探究」頁已於 2026-11-20 刪除，改由 `tools/lab/` 實驗桌取代。`scripts/science/models.mjs`（純計算）仍由實驗桌匯入；`style.css` 只供自然實驗總覽頁使用。

產出的 `tools/science/*.html` 是單檔教材，可下載後離線操作；品牌圖、站內導覽與選用的分析腳本需官網環境。主要教材、公式、圖解、互動與紀錄不依賴網路。

產生器只更新帶標記的整合區塊及新目錄，不改動數學工具。第一批10頁仍保留原教學引擎。若直接修改產出的第二批HTML，下次產生會覆蓋；應先修改來源再重建。

`test_science_models.mjs`：數值驗收與控制邊界組合。`test_science_ui.cjs`：完整流程、任務、資料損毀與封鎖、無障礙結構、事件隱私及目錄篩選。JSDOM 不進行真實排版或列印，axe 測試停用色彩對比規則；實際裝置驗收見 docs/science-acceptance.md。

數學出題器交付前可先跑純 Node 快速檢查，例如 `node scripts/math_local_check.mjs tools/math/g6-drills.html units 200`。它逐一檢查 unit × 難度 × 數型，包含候選題的例外與 `verify()` 失敗、200 次正式取題、卷內 `sig` 去重及結構數；候選 `null` 只列為診斷。這是交付前自測，正式門檻仍是 `test_math_drills.mjs`、P3 棘輪與 CI；快速檢查不能取代瀏覽器與列印驗收。

