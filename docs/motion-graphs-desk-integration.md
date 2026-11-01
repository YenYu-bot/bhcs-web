# 小車運動圖實驗桌：官網 Draft 整合

## 範圍與來源

- 使用者於 2026-11-01 同意將已驗收的私人版提交公開 bhcs-web、加入教材入口、開 Draft PR 與完整 CI；本次不代表同意合併或正式部署。
- 本次最新 main 基準：`621c27cbeea791b4f37bd6f43189fe6894a0510c`（包含既有進階數學更新）。不得退回先前自然站基準。
- 已驗收私人來源：`3f3cfd0b74776af4b2ddf50ab34d3bf89440b1e9`。入門 v1 原始來源 `7a40cede3f7e7400a95686612363977639a89706` 的唯一既有例外為通往 v2 的入口導覽，另有原始 manifest 回歸保護。
- `tools/motion-graphs-desk/` 提供入門量測／學生自行作圖，`v2/` 提供五案例、四層、十九題的 x–t／v–t 判讀。
- 18 個 runtime 的 accepted 基準完整保留；**除兩頁 robots noindex 轉 canonical 外，另有下述使用者授權的三檔呈現修正**。`scripts/motion-graphs-desk-runtime.json` 釘住 accepted bytes，integration guard 逆轉 metadata 後逐檔驗證。物理模型、答案、輸入語義、儲存與 reset 不改；呈現例外逐檔釘於獨立 repair manifest。
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

共 21 個 fail-closed scenarios（原20 個驗收案與1 個端點案，修後全部保留並加強v1間距門檻）：

1. 入門與進階各五個完整流程：1280px mouse、1280px keyboard、360／390／412px CDP touch，共十案。進階每案皆完成全部十九題，不只首頁或模型 setter。
2. 兩版 clock 暫停、背景凍結、回前景仍暫停與重載，共兩案；完整流程另含原生回放／暫停／專用 step／退出，持久化證據不變。
3. 入門損壞資料、進階未來版本的原文備份及保護重置，共兩案。
4. 進階 read fault、write fault/retry、無 Web Locks 空資料、無 Web Locks 既有資料、雙頁 storage conflict，共五案。
5. 進階 320px 正負速度端點、x–t／v–t 及引導文字 200% 放大，共一案。
6. 入門 320px 端點 t0／t8 的 bbox／截圖與嚴格間距回歸，共一案；360px 等完整流程亦保存兩端證據。

圖像驗證包含原生 SVG screen CTM 與實際 HTML hit center、44px 目標、14px 圖字、220px 資料區、兩版刻度與圈不交疊、拖曳 capture/bubble/rAF 的連續 viewport 穩定、取消與透明釋放；故障／缺少樣本／中途跳動的負例另有 helper tests。首輪 v1 的只診斷模式已揭露實際交疊；受限修正後，兩版皆強制要求44px圈不交疊數值刻度，v1另包含所有軸標題，並要求至少220px資料區，不以重命名或忽略診斷通過。

CDP touch 是瀏覽器原生合成輸入，非實體手機；guide-only 字體 200% 不是完整 browser zoom。獨立強制 lostpointercapture、實體 pen、多指、讀屏器、Safari/Firefox，以及全部中斷組合仍須依實際執行證據標示，不能把 Node tests 或自然釋放產生的 lostcapture 冒稱全面裝置測試。

### 首輪 CI 已確認與獲授權修正：v1 端點文字

首輪 d918df1 / run41290081737 的320／360px真實bbox與截圖證實v1端點圈覆蓋刻度；不是只有來源推導。使用者於2026-11-01 09:46:09 UTC同意只修繪圖時間邊界與標籤留白，同步私人版與Draft #203，不涉及合併或部署。

## 受限呈現修正與測試修正

`scripts/motion-graphs-desk-runtime.json`、原始 `ported-tests.json` 與兩個 accepted來源SHA不變；新增 `scripts/motion-graphs-desk-repair.json` 釘住精確前後hash及可逆替換。

- `v2/app.mjs`：只將dense迴圈 `i<=Math.floor(end*20+1e-8)` 改為 `i/20<=end`，最後仍補exactend。不放寬renderer的t≤觀測上限。原式在合法resume時間0.15+0.3造成0.45超前1ULP，throw使rAF未再排程。81個20Hz界線上下1ULP、五案例兩圖和真Clock150ms分割回歸保護；舊epsilon負例必失敗。
- `geometry.mjs`：只改v1圖的留白與一致forward/inverse mapping；固定物理域不變，軌道render與mapping完全不變。PLOT700×670，資料x104..640、y120..480，時間0..8、位置0..6；刻度與軸標另外留白；最高位置的圈與上方標題亦保留間距（追加40 SVG單位呈現平移，軸域與yscale不變）。right640保留舊260px SVG的44px圈不裁切門檻，沒有把舊門檻升高來掩蓋失敗。
- `style.css`：只追加≤400px的 `main#main` 與其 `#plot-panel` padding規則，v2無id main不匹配；最差16px scrollbar仍有288px SVG、220.53px資料區。
- 原11個geometry tests與原UI pointer測試全部保留，各獨立期待坐標按新mapping明列可逆test-delta，不刪斷言；v1 bytes-preservation單一測試改用專用逆讀adapter，驗證修正可還原舊bytes。其餘UI測試仍讀**實際修後app**，不以adapter隱藏修正。
- Native harness：A1.R改答後精確保留兩個無父層兄弟、撤銷其餘17；框外拖點在實際資料域外但viewport內；keyboard回放使用既有Escape暫停；關閉Playwright focus emulation後必須取得trusted hidden事件，才能測背景凍結。保留clock/raw/幾何/錯誤零容忍門檻。

修後native21案及私人視覺驗收須看新exact-head結果；本地Node或來源審查本身不代表原生觸控／畫面通過。

私人版修正來源於2026-11-01 09:58 UTC由parent發布為 `748c686a2b4d830c7107985562bac299a7cce10f`，與本候選三檔修正及managed QA hash相同；原始accepted `3f3cfd0b` 基準與獨立repair鏈不重新定義。官網仍為Draft，尚待新exact-head CI及另行合併／部署授權。

## 同步已合併英文更新（整合基準，不改產品）

Draft修正head `6fc5e8f108b4880d5a97757333cb9c9a8b587462` 之後，main已為 `5089a4d7cb0844354cbb2d60e2aa1f35fa7e7947`，包含既有英文PR #200／#201／#202。以兩parent merge保留所有英文來源及新八主題，不重寫英文內容；package同時保留英文語意與motion測試。教材總數為253、英文48、自然60。

原accepted manifest及其621c27c歷史基準保持不變。`motion-graphs-desk-integration-base.json`另記新舊整合基準；guard仍驗原650路徑及main既有核准鏈中的35英文變更，另嚴格驗最新main的658既有tools/assets路徑（只排除生成的science入口）無任何例外。新增八英文主題亦納入保護；motion18runtime與修正hash完全不變。全部builders及full npm須對此合併候選重新執行，不能沿用合併前通過結果。
