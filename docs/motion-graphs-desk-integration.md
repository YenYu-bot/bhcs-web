# 小車運動圖實驗桌：官網 Draft 整合

## 範圍與來源

- 使用者於 2026-11-01 同意將已驗收的私人版提交公開 bhcs-web、加入教材入口、開 Draft PR 與完整 CI；本次不代表同意合併或正式部署。
- 本次最新 main 基準：`621c27cbeea791b4f37bd6f43189fe6894a0510c`（包含既有進階數學更新）。不得退回先前自然站基準。
- 已驗收私人來源：`3f3cfd0b74776af4b2ddf50ab34d3bf89440b1e9`。入門 v1 原始來源 `7a40cede3f7e7400a95686612363977639a89706` 的唯一既有例外為通往 v2 的入口導覽，另有原始 manifest 回歸保護。
- `tools/motion-graphs-desk/` 提供入門量測／學生自行作圖，`v2/` 提供五案例、四層、十九題的 x–t／v–t 判讀。
- 18 個 runtime 檔案完整保留；**官網只替換兩頁 robots noindex 為各自 canonical**。`scripts/motion-graphs-desk-runtime.json` 釘住 accepted bytes，integration guard 逆轉 metadata 後逐檔驗證。模型、輸入、教學、字型、儲存與 reset 不改。
- Canonical：`https://www.bhcs.com.tw/tools/motion-graphs-desk/` 與 `https://www.bhcs.com.tw/tools/motion-graphs-desk/v2/`。
- 教師 PNG 沿用已驗收 canonical 圖（SHA-256 `2851a4bdd0a6523fad5db15c8a197c17ac191bd70000c051513b5e317589f23b`），原 provenance 同檔保留，未另造教師形象。

## 教學與資料邊界

入門仍可獨立完成九時刻讀值／作點。進階五案例有靜止、正負等速度、正負等加速度跨零折返；先取得觀察，才逐層開放速度表徵與題目。加速度案例用同一曲線的前後半段分別理解減速／加速，再處理零速瞬間、折返和 signed area。沒有預測必答關卡。完整已審規畫見 `motion-graphs-v2-spec.md`。

兩課程 key 分離：`bhcs.motionPositionDesk.v1`／`bhcs.motionGraphsDesk.v2`；不同 origin 的私人頁紀錄不會自動移入官網。不是雲端同步。Web Locks 不可用時依 accepted 保護契約只記憶體／匯出，不能假稱裝置已保存。重置僅清本課程 key、兩階段與勾選確認；保存失敗、原始損壞資料備份、外部分頁衝突與舊 snapshot 不得復活，皆保留。

## 保護與測試

- accepted 14 個測試／fixture 檔（229 tests）原文可逆 port。`ported-tests.json` 列出每一替換和原始 SHA。原私版 HTML 測試透過精確 metadata adapter 讀回 accepted bytes；不刪原測試或放寬判準。
- 新 integration guard 驗證兩 canonical、所有本地引用／HTTP／MIME、來源檔／測試不漂移、全站入口與 sitemap、CI 舊步驟與 Gate。
- 基準現存 tools/assets 全部 651 路徑，僅 `tools/science/index.html` 是生成入口例外；其他 650 檔逐 Git blob 保護，包括未公開教材和最新 math。不在新增公開 manifest 列出未公開路徑。
- 更新既有測試的精確 discovery 數量只因新增一個站：standalone 7→8、science 59→60、國中自然58→59、理化40→41、總資源244→245。既有斷言仍精確，不改成寬鬆下界。
- Native checker：`scripts/check_motion_graphs_desk_browser.cjs`；science-stations 中與其餘檢查並行程式順序執行，失敗不忽略，artifact `motion-graphs-desk-artifacts/`。原八 required jobs 和 fail-closed CI Gate 不變。

## 證據與誠實限制

原私人版作者229測試及獨立26組審查通過；managed Chrome 曾完成五案例25樣本／十九題、重載、真下載匯出、上游改答案撤完成、v1/v2重置隔離、320/360/390/412與200%瀏覽器zoom、mouse偏心拖曳及框外取消。mobile尺寸不等於真touch。

本次官網 native checker 是新增獨立 CI 驗證，**未執行前不可把設計覆蓋稱為通過**。實際 exact-head CI 結果由 Draft PR 追蹤；真手機、Safari/Firefox、讀屏器與完整 Tab 順序若未另行實測仍列未測。Node／DOM／合成故障注入不替代實際瀏覽器與視覺證據。若新檢查揭露 accepted 產品缺陷，必須先回報範圍和修正方案，不能靜默改 runtime 或重新定義 accepted 基準。

### 新 native checker 的設計範圍（不是已執行結果）

共 21 個 fail-closed scenarios（20 個驗收案與 1 個明列視覺診斷案）：

1. 入門與進階各五個完整流程：1280px mouse、1280px keyboard、360／390／412px CDP touch，共十案。進階每案皆完成全部十九題，不只首頁或模型 setter。
2. 兩版 clock 暫停、背景凍結、回前景仍暫停與重載，共兩案；完整流程另含原生回放／暫停／專用 step／退出，持久化證據不變。
3. 入門損壞資料、進階未來版本的原文備份及保護重置，共兩案。
4. 進階 read fault、write fault/retry、無 Web Locks 空資料、無 Web Locks 既有資料、雙頁 storage conflict，共五案。
5. 進階 320px 正負速度端點、x–t／v–t 及引導文字 200% 放大，共一案。
6. 入門 320px 端點 t0／t8 的 bbox／截圖診斷，共一案；360px 等完整流程亦保存兩端診斷。

圖像驗證包含原生 SVG screen CTM 與實際 HTML hit center、44px 目標、14px 圖字、220px 資料區、v2 刻度與圈不交疊、拖曳 capture/bubble/rAF 的連續 viewport 穩定、取消與透明釋放；故障／缺少樣本／中途跳動的負例另有 helper tests。v1 舊版刻度與圈交疊只記錄診斷，未聲稱該項 spacing 已驗收；若執行後發現可讀性問題應另回報，不改 accepted。

CDP touch 是瀏覽器原生合成輸入，非實體手機；guide-only 字體 200% 不是完整 browser zoom。獨立強制 lostpointercapture、實體 pen、多指、讀屏器、Safari/Firefox，以及全部中斷組合仍須依實際執行證據標示，不能把 Node tests 或自然釋放產生的 lostcapture 冒稱全面裝置測試。

### 待首輪 CI 畫面確認：v1 端點文字

原始 v1 的 t=0／t=8 把手與刻度留白，來源座標推導有可能相交，但目前沒有本次官網 native 實測證據。checker 會保存 320／360px 端點真實 bbox／截圖，**不把此診斷稱為 v1 標籤間距通過**。這是 Draft 視覺風險待辦，parent 須審閱首輪 artifacts 後判定；若確定可讀性缺陷，另外提出受限修正並取得授權。不得為使 CI 綠燈移除原驗證，亦不偷偷更改已驗收 runtime。
