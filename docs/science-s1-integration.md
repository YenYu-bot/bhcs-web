# S1 直線運動圖表：整合驗收

- 基底 main：`f1c52b911d52f694c39fe7964b0935bd8c3ade6f`（G9 r9 #78 兩個 workflow 全綠後合併）。
- 來源：Claude `claude-science-s1-motion-graphs.zip`，以 main 799a340 為原始基底；10 個來源檔與原包逐位元組一致。沒有採用 README 提及的本機寬鬆 builder。
- 依序執行正式 build_microscope、build_science、build_site、build_math_brand，再執行 build_sitemap.py。四個 Node builder 重跑 SHA-256 無差異。
- 新增 `tools/science/motion-graphs.html` 與 builder 產生的 `docs/science-motion-graphs-spec.md`。目錄 30 項教材、研究員覆蓋 21 站；force-motion-lab 與 motion-graphs 的 related 雙向連結已核對。
- researcher-lab.js 版本更新、共用模型與圖解內嵌，因此既有研究站輸出同步更新。sitemap 由官方腳本完整重建，包含歷史未同步的 lastmod 更新；96 個 URL。
- 完整 `npm test --prefix scripts` 通過：25 模型組、11 個生成站核心流程與 axe、目錄、illustrations、experience、inquiry；數學 P2 99 topics、3912/3912 組、782400/782400 候選，verify 失敗與例外 0、紙卷耗盡 0。
- `check_science_integration.cjs` 通過：102 HTML、1261 本機參照、96 sitemap URL；P1 舊頁保護通過。
- `test_researcher_batch1.cjs` 至 batch5 全數通過，21 站＋目錄；未放寬任何斷言。
- 已開啟 OpenStax College Physics 2e §2.8 來源網址，標題與內容正確。
- 圖示依來源包暫用既有 force 圖；未產生新的圖檔。
- Claude 的 review 截圖／紀錄與來源 patch 不提交；本機檢視其 390px 圖解截圖，這不是本環境的瀏覽器驗收。
- 本環境沒有 Chromium。真正的 composition、operations、P1 快照與列印檢查由 Researcher CI 驗收。新 PR 當輪不查 CI、不合併。
