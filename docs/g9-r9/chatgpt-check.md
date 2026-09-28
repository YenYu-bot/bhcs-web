# G9 r9 盒狀圖整合驗收

基準 main：`799a340cfe68425005a1f67514f0a237aa9e81b5`（#77 全綠後 squash merge）。
輸入包：`claude-g9-r9.zip`。

- 套用累積 r9，加入 boxplot 四單元；保留 #77 的螢幕表格品牌色規則，同時涵蓋 quartile 與 boxplot。移除此一 CSS 規則即逐位元等於原 r9 引擎；原題目逻輯與列印樣式未改。
- B 類：兩處舊盒狀圖卡片與舊 HTML 保留；兩處各新增新版計算題卡片。舊頁在頁首加入 color:inherit 的「計算題已併入 → 盒狀圖、全距與四分位距」。
- P1 增加盒狀圖明列舊頁保護、核對連結前綴、只排除已核准頁首連結後逐字比較基準。瀏覽器沿用目錄中既有舊卡片，worksheetSelectors 指定 #questions-container。整合守衛從共用 legacyLinkFiles 自動取得此舊頁。
- 資源數由 builder 重算：149 項；數學總覽 111 卡（國三下 7 卡）；99 engine topics（G9 10 topics）。
- 四個 builder 重跑無差異。P1 靜態守衛與整合檢查通過：101 HTML pages、1237 local references、95 sitemap URLs。
- boxplot 快速預檢 15/15 組，每組 200 題通過。
- JSDOM 壓測 135 份 40 題卷、120 份 80 題卷，共 15,000 題；滿額、卷內無重複題幹、無 JSDOM errors。小數限定模式只產出 fivenum，另三單元略過且顯示提示。
- 完整 P2：3912/3912 組，782400/782400 抽樣；候選 verify 失敗 0、原始例外 0、所有卷滿額、耗盡 0。P2 分類報告已由腳本重建。
- 完整 P3：815 units、489000/489000 題，耗盡 0；enforce_math_diversity 正式 ratchet topicFailures=0、failures=0。保留既有基準差異與非阻擋效率警示，未新增豁免或調低門檻。
- boxplot 新單元結構數（基礎／進階／挑戰）：fivenum 100/131/124、compare 30/30/30、table 18/18/18、read 20/20/21；挑戰新結構 109/10/12/16，四單元全門檻通過。

本機沒有 Chromium，真實瀏覽器／列印驗收由新 PR 的 Researcher CI 執行。開 PR 本輪不查新 CI，不合併。

## 後續包
r10 probability → r11 treediagram → r12 solid 依序接續。r12 已獨立預驗收並修正 CN 名稱表不足導致 undefined角錐，須使用 claude-g9-r12-checked.zip；r12 尚未併入本 PR。

- 完整 22 項 math-regressions 全通過；P4-A/B/C 使用完整預設 seeds，未使用 quick mode。
