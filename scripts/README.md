# 教材產生與檢查

需要 Node.js 20+。只在開發環境安裝測試套件；網頁運作無需 npm 或框架。

```sh
npm install --prefix scripts --ignore-scripts
node scripts/build_science.mjs
npm test --prefix scripts
python scripts/build_sitemap.py
```

第二批來源：`scripts/science/batch2.mjs`（教材、控制、任務、題目）、`models.mjs`（純計算）、`diagrams.mjs`（SVG）、`runtime.js`（互動狀態）、`style.css`（響應式、列印）。

產出的 `tools/science/*.html` 是單檔教材，可下載後離線操作；品牌圖、站內導覽與選用的分析腳本需官網環境。主要教材、公式、圖解、互動與紀錄不依賴網路。

產生器只更新帶標記的整合區塊及新目錄，不改動數學工具。第一批10頁仍保留原教學引擎。若直接修改產出的第二批HTML，下次產生會覆蓋；應先修改來源再重建。

`test_science_models.mjs`：數值驗收與控制邊界組合。`test_science_ui.cjs`：完整流程、任務、資料損毀與封鎖、無障礙結構、事件隱私及目錄篩選。JSDOM 不進行真實排版或列印，axe 測試停用色彩對比規則；實際裝置驗收見 docs/science-acceptance.md。
