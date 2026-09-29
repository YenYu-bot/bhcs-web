# G9 r12 整合驗收

main 基準：6b93f02fd4c7abcf3b4758999345826832bf1621（#81 全綠後合併）。

- solid 六單元加入 G9，G9 合計 13 topics、全站 102 topics。移除 solidConfig、TOPICS 與 CONFIGS 新增部分後，原 12 topics 與共用 runtime 除空白外與 main 相同。
- A 類：兩處旧卡導向 solid、原 HTML 保留且加 color:inherit 的併入入口；P1 strip/導流守衛、瀏覽器 #questions-container 與舊頁快照清單同步。
- 原包的 undefined 角錐錯誤獨立 commit；詳見 count-name-fix.patch 與 count-name-check.cjs。補齊十三至十八中文名稱，不改數值、verify 或題型範圍。
- npm test 全 PASS；P2 3954/3954、790800 樣本，candidate verify false / exceptions / paper exhausted 均 0。
- 完整 P3 829 units、497400/497400 樣本；正式 ratchet failures=0、topicFailures=0。solid 六單元全部完整門檻通過，未增豁免。報告的既有 projectedGateFailures 是诊斷數，不等於正式 ratchet 失敗。
- 22 支 math-regressions 全 PASS，math_local_check --all 40 覆蓋 102 topics 全 PASS。
- 壓測 90 份 40 題＋90 份 80 題，共 10800 題；滿額、卷內題幹重複 0、JSDOM errors 0。
- 名稱回歸測試 1000 個原始候選、五種等邊數角柱／角錐案例全 PASS。
- integration PASS：107 HTML、1381 references、101 sitemap URLs；P1 112 links / 17 files。
- 四個 builder 逐支冪等通過。sitemap 依新 commit 日期重算 lastmod 後再次執行無差異。
- P2 分類報告已重建；39 units / 87 combinations 效率警示保留，不改門檻。

真實瀏覽器與列印快照交既有 CI 驗收，不把 DOM 壓測當作排版驗收。新 Draft PR 本輪不查 CI、不合併。
