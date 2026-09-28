# G9 r10 認識機率整合驗收

基準 main：`f1c52b911d52f694c39fe7964b0935bd8c3ade6f`，r9 #78 全綠後合併。

- 套用 Claude 累積 r10；引擎與原包只有既有螢幕表格品牌色一行不同。移除新 probabilityConfig、TOPICS 條目與 CONFIGS 條目後，逐位元組等於 main：原 10 topics 與共用 runtime 未更動。
- A 類：保留舊 HTML；數學目錄與 ziyuan 的兩張卡改連 probability，舊頁加 color:inherit 的「本頁內容已併入 → 認識機率」。P1 靜態守衛與舊頁快照明列保護，快照使用 #questions-container。
- 四個 builder 重跑 SHA-256 無差異。149 項資源、111 張數學卡、100 engine topics（G9 11）。
- P1 舊頁逐字比對與 integration 通過：101 HTML、1238 local refs、95 sitemap URL。
- probability 快速預檢 12/12，每組 200 題；verify 失敗、例外、耗盡、欄位錯、卷內重複皆 0。
- JSDOM 壓測 60 份 40 題、60 份 80 題，7200 題全部滿額，無重複題幹與 JSDOM errors。
- 完整 P2：3924/3924、784800/784800 樣本；候選 verify 失敗與例外 0、所有紙卷滿額、耗盡 0。
- 完整 P3：819 units、491400/491400 樣本；enforce 正式 ratchet topicFailures=0、failures=0。新機率四單元全部通過完整結構／挑戰門檻，未新增豁免。全站仍有既有 56 projected failures，由既定基準政策處理，不等於正式 gate 失敗。
- P2 分類由 classify_math_drills.mjs 正式重建。（編排時曾誤呼叫不存在的 classify_math_p2.mjs，已改正命令，未改測試。）
- 本輪未重跑未變動的 22 項獨立 math-regressions；上一版 r9 本機及 CI 已通過，本 PR 仍由 Math CI 執行完整 22 項。
- 本機沒有 Chromium，P1 真實瀏覽器快照與列印等待 Researcher CI。新 PR 當輪不查 CI、不合併。

資料見 acceptance-summary.json、chatgpt-local-check.txt 與 stress-check.cjs。
r11 → r12 保持原順序；r12 undefined 角錐名稱修正將用獨立 commit 並附 PR diff。
