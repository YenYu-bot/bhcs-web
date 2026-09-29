# G9 r11 樹狀圖與機率整合驗收

基準 main：`d981db0abfbdc6dc96eced9c51e34d1c2dbf5c85`。r10 #80 與自然 S1 #79 的兩個 workflow 均全綠後已合併。

- 原 r11 包只补回既有一行螢幕表格品牌色；移除新 treediagramConfig、TOPICS 與 CONFIGS 條目後，與 main 逐位元組相同。原 11 topics、共用 runtime、列印規則未改。
- B 類：保留兩處舊卡及 HTML，另外加新版「樹狀圖與機率」計算入口。舊頁加 color:inherit「計算題已併入」；舊題目與圖形未改。P1 靜態守衛同步，既有舊卡會納入快照，指定 #questions-container。
- 四個 builder 冪等。151 項資源（含已合併 S1）、112 張數學卡、101 engine topics（G9 12）。P1 與 integration：102 HTML、1265 local refs、96 sitemap URL，通過。
- 新題目快速预檢 12/12 × 200 題通過。JSDOM 60 份 40 題、60 份 80 題，共 7200 題滿額、無重複題幹與 JSDOM errors。
- 完整 P2：3936/3936、787200/787200 樣本，候選 verify 失敗、例外、紙卷耗盡皆 0。
- 完整 P3：823 units、493800/493800 樣本，正式 ratchet topicFailures=0、failures=0；四個新單元完整結構／挑戰門檻皆過，未加豁免。全站既有 projected failures 56 由既定基準政策處理。P2 分類已由官方腳本重建。
- 獨立 math-regressions 與全站 smoke 交由本 PR 的 Math CI 跑；本機沒有 Chromium，P1 真實瀏覽器／列印交由 Researcher CI。新 PR 本輪不查 CI、不合併。

數據見 acceptance-summary.json；下一包 r12 的 undefined 角錐名稱表修正須獨立 commit 並在 PR 附 diff。
