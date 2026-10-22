# Pilot #6 / B6 — 獨立科學與教學設計審查

> 審查者：ChatGPT（B 線，負責教材科學、教學邏輯及驗收規格）；日期：2026-10-22。  
> 被審查基準：PR #165，head SHA 86f611e915a6d92ebc0a721a44573c4fdfa98584。  
> 本文件由獨立分支維護，**不構成 PR #165 的人工驗收通過或合併許可**。

## 1. 審查範圍、證據及結論

審閱：assets/circuit-guided/model.js、engine.js、script.js、render.js、input.js、circuit-guided.css、scripts/test_circuit_guided_model.mjs、test_circuit_guided_engine.mjs、test_circuit_guided_script.mjs、check_circuit_guided_view_browser.cjs、check_circuit_guided_flow_browser.cjs，以及 docs/circuit-lab-spec.md。

檢查截圖：最新 Circuit run 39729928417 的 artifact「circuit165-layout-review」，含 1280/390 接線板與完整流程截圖。這是對程式及現有截圖的獨立審查；**本次沒有在實際學生裝置完成徒手接線測試**，下述待實測項不得標示已通過。

- PR：https://github.com/YenYu-bot/bhcs-web/pull/165
- 正式 CI（該 head）：https://github.com/YenYu-bot/bhcs-web/actions/runs/39729928386
- Circuit Chromium（該 head）：https://github.com/YenYu-bot/bhcs-web/actions/runs/39729928417
- 程式參考：[model.js](https://github.com/YenYu-bot/bhcs-web/blob/86f611e915a6d92ebc0a721a44573c4fdfa98584/assets/circuit-guided/model.js)、[engine.js](https://github.com/YenYu-bot/bhcs-web/blob/86f611e915a6d92ebc0a721a44573c4fdfa98584/assets/circuit-guided/engine.js)、[script.js](https://github.com/YenYu-bot/bhcs-web/blob/86f611e915a6d92ebc0a721a44573c4fdfa98584/assets/circuit-guided/script.js)、[render.js](https://github.com/YenYu-bot/bhcs-web/blob/86f611e915a6d92ebc0a721a44573c4fdfa98584/assets/circuit-guided/render.js)。

**審查結論**：純科學規格及五次標準量測的目標數值與理想直流電路物理相符；現有單元測試已覆蓋部分反例。然而，CI 綠燈不能證明「初學者自行完成接線」或「圖面沒有錯誤的電氣連接暗示」。在修正並驗收下述 P1 問題前，不建議 Ready / merge。

## 2. 科學正確性：獨立驗收基準（理想模型）

條件：理想 6 V 電源、每顆燈泡固定 6 Ω、理想電流表內阻 0、理想電壓表不取電流。下列值是依電路定律可得的**預期真值**，不是本輪新跑出的測試報告。

| 情境（對應固定試驗） | 電池總電流 | 正向電流表 | L1 正向電壓表 | 燈泡 / 學習解釋 |
|---|---:|---:|---:|---|
| baseline：僅 L1、開關閉合 | 1.0 A | 1.0 A | 6.0 V | L1 6 W；L2 未接入，不是「通路中的熄滅」 |
| baseline：開關斷開 | 0 A | 0 A | 依量測端點是否有確定電位而定，不可憑空指定 | 無完整電流通路，L1 熄滅 |
| trial1：L1、L2 同一路徑 | 0.5 A | 0.5 A | 3.0 V | 每顆 1.5 W，均較暗；等效電阻 12 Ω |
| trial2Total：兩顆各有路徑 | 2.0 A | 2.0 A | 6.0 V | 各路 1.0 A；每顆 6 W；等效電阻 3 Ω |
| trial2L1 / trial2L2 | 2.0 A | 各路 1.0 A | 不作為分流電流關卡的必需讀值 | 兩路相加等於總電流，不代表電流被消耗 |
| 並聯移除 L2 支路（其餘保留） | 1.0 A | 應依電流表實際量測位置判讀 | L1 電壓 6.0 V | 理想電源下 L1 電流仍 1.0 A；總電流降低 |
| 將理想電流表直接跨電源形成短路 | 不報有限值 | 不報有限值 | 不捏造讀值 | source-short，文字安全警示，實驗不可計入紀錄 |
| 表計反向接線 | 導線拓撲不變 | 可能顯示負值 | 反接電壓表亦可能顯示負值 | 不能把負號直接當作物理電流變負；教學應強調極性 |
| 電壓表懸空或接成斷路 | 依實際拓撲 | 依拓撲 | 未定值須顯示未接妥，不可一律寫 0.0 V | 區分「讀值為零」與「無法量測」 |
| 電流表旁路燈泡 L1 | 視整個電路而定 | 視表位置而定 | 視端點而定 | L1 被理想導線繞過時可能不亮，且不得錯誤計入合格基準 |

**科學界線**：模擬採固定電阻燈泡，實際白熾燈絲電阻會受溫度影響；真實電池亦有內阻。所有比較結論應明確限定在教材的「理想 6 V 電池、兩顆相同 6 Ω 燈泡」條件下。不可把「並聯後總電流一定增加」擴大成不受電源能力限制的普遍敘述。

## 3. 已確認的設計問題與待驗收風險

### P1-EDU-01：控制變因說明不精確（已由文字證實）

script.js 的任務標題「只改接法，其他條件固定」容易令學生認為全部五次量測只有接法變動；但 baseline 是 **一顆燈泡**，後兩組試驗是 **兩顆燈泡**，元件數量同時改變。compareModel 亦把從一顆改為兩顆的差異標為單純「接法」。

建議將任務敘述改為「固定同一顆 6 V 電池、使用相同規格燈泡；先量一顆，再加上第二顆並分別測試兩種接法」，在比較表把「燈泡數量」和「接線路徑」分成兩行，以免誤教控制變因。若要嚴格研究只有接法的影響，應比較**兩顆燈泡的單一路徑**與**兩條路徑**，而不是單純拿一顆對兩顆推論。

### P1-EDU-02：L2 只接上一端便被當作「已接線」（已由程式分支證實）

render.js 以是否存在任一端點連線決定 L2 是 spare/working；同時只要任一 L2 端點出現在導線清單，狀態就不再顯示「未接線」，而會落入亮度字樣「熄滅」等。這會混淆三種不同概念：「備用未接線」、「接了一端但尚無完整通路」、「接入完整通路卻因開關斷開而不亮」。

請 Claude 定義並顯示明確的三態或更細狀態，**不要只用有任一導線判定已完成連接**。需用只接 L2.a 一端、接上兩端但開關斷開、兩端接妥且通電等情境測試。

### P1-UX-01：核心流程以測試 hook 建立電路，非學生自行接線（已由腳本證實）

check_circuit_guided_flow_browser.cjs 的 setFixed() 以 window.__cggTest.dispatch 逐筆建立 FIXED_CIRCUITS；check_circuit_guided_view_browser.cjs 使用 window.__cgg.setFixed() 載入畫面。雖然其他操作與 Challenges 含部分 click/tap，但這**沒有證明**學生能不靠測試 hook，從空白狀態以真實端點操作完成 baseline、trial1、trial2 三組接線。

請補「無 window.__cggTest／__cgg.setFixed，僅使用可見 DOM 點擊／手勢」的標準流程。特別要檢查 build 階段自動轉 measure、錯線拆除、長距離端點連接與遺留選取狀態。

### P1-UX-02：手機左右移動及跨視窗連線尚未驗證（截圖與 CSS 已確認風險）

390px 截圖僅見 600px 可水平捲動實驗桌左側，右側 L1 / L2 接點在初始視窗外。現有測試確認沒有整頁 overflow 和端點尺寸，**未驗證**學生在一次跨越畫面的連線中，能先點左端點、水平捲到右側，再點右端點完成連接。

需測試先選 bat+ 再平移找 sw.a 等遠距連接，確認選取狀態保留、不誤捲動、不誤放線；另測長距離連線的替代操作方式與鍵盤操作。截圖要包含 mobile scrollLeft = 0 與最大值，並提供觸控操作的可重現證據。

### P1-UX-03：導線與標籤仍形成教學視覺干擾（截圖證據）

1280 baseline 與完整流程截圖中，電壓表下方「電壓表」字樣與橫向回路導線重疊。雙路徑圖的備用／實驗器材區文字也和燈泡及邊界距離過近。回路導線在 L2 工作區右側及下緣緊密聚集，可能讓初學者以為經過 L2 的線就是 L2 的電氣連接。

驗收不能只檢查線是否穿越端點數學座標，還要人工確認「導線是否像接到不相關的器材」；確認導線交叉不產生假節點，必要時設計穿越分離／跨線橋或調整走線。不得為視覺而變更 model 的連接關係。

## 4. 既有工程優點（保留）

- model.js 使用精確有理數，保留數值輸出與拓撲判定分離；已設置短路不輸出假有限值、儀表極性、浮接等單元測試。
- engine.js 在 structureGate、measurementGate 區分「線路結構到位」與「開關閉合且量測正確」，五次記錄取自原始接線快照，不相信前端衍生答案欄位。
- script.js 在 concept 之前避免直接揭露正式的「串／並聯」名稱，並反駁「電流被燈泡消耗」的常見迷思。
- 檢查 WCAG/端點點擊尺寸、強制色彩、灰階、短路提示的測試方向正確；應**新增**真實連線行為測試，而不是替換／刪掉既有測試。

## 5. 教學成功標準（建議）

學生只看本頁說明、不讀原始碼、不由成人指導，應能：
1. 用滑鼠或手機點按，自行接妥基準通路，並正確辨識哪一顆燈泡有／沒有接入。
2. 解釋電流表須進入要量的路徑、電壓表跨接元件兩端；反接極性、斷路及短路時能辨識明確回饋。
3. 量到五筆正確紀錄，能提出「多一顆燈泡，總電流未必變小」的**有條件**結論。
4. 區分「線在圖上交叉／靠近」與「端點在拓撲上連接」。
5. 能在 390px 手機不依賴開發工具、不誤觸的情況下完成核心任務。

驗收標準及逐項執行腳本見 companion 文件 **docs/circuit-guided-b6-acceptance-matrix.md**。

## 6. 決策與分工

- Claude（A 線）：PR #165 的 render、input、CSS、視覺與互動實作及 Chromium 真正點按／觸控測試。
- ChatGPT（B 線）：此文件、科學基準、教學語義、獨立驗收案例、證據覆核。**不修改 #165 的程式碼**。
- 使用者：最後人工操作驗收；同意後才由指定操作者改 Ready 或合併。
- 每次新 head 都需以**同一 SHA** 重跑正式 CI（含 core、site、science-guided、CI Gate 等全部必要工作）及 Circuit circuit-visual，兩者完成且 success，並重新人工檢查桌機／手機。
- 本文件的 P1 問題在未核對新畫面、未完成真實接線前，**一律保持 open，不可因舊 CI 全綠自行勾選完成**。

## 7. 追蹤審查：新 Head 405526b（2026-10-22）

**重要：本文件前六節審查的是 86f611e。以下依最新 head 405526b0956e0e254e854ebe83d70da05500576b 重新核對，不可把舊版問題直接延伸為新版失敗。**

新版變更已檢查：render.js、input.js、CSS 及新增的 scripts/check_circuit_guided_learner_browser.cjs；重新看 1280/390 baseline Chromium 截圖（run 39745144972）。

| 原問題 | 405526b 更新判斷 | 證據與剩餘 Gate |
|---|---|---|
| P1-UX-01：核心流程只有 setFixed hook | **自動化覆蓋已補強**：新 learner browser script 以 hook:false，在出貨頁面上使用滑鼠、鍵盤、手機點按及觸控拖曳自行建線，包含 unsafe、baseline、one-path、two-path、branch1/2；正式流程原先 setFixed 的限制不再是唯一測試證據 | CI / circuit-visual 同 SHA success；仍需使用者人工驗收，尤其真實手機 |
| P1-UX-02：手機必須水平捲動 | **既有問題已由新直式布局改善**：390px 改用 portrait bench，12 端點設計為同畫面可見，無須左／右捲動；新 learner script 會檢查裝置寬度與端點可見性 | 自動化通過；真人操作舒適性及誤觸仍待驗收 |
| P1-UX-03：V 名稱壓線與 L2 靠近主回路 | **在新版 baseline 截圖明顯改善**：電壓表已移至主燈泡下側、名稱不再壓底線；L2 獨立於備用托盤；導線有不同視覺通道和顏色 | 仍需真人檢視 one-path、two-path、錯線與所有 Challenge 狀態，不直接給人工 PASS |
| P1-EDU-01：變因說明不精確 | **仍待處理**：這次 PR 變更未包含 script.js，原 wording「只改接法，其他條件固定」仍在 | 建議修教學敘述／比較表，再核對測試 |
| P1-EDU-02：L2 只接一端被視為 working | **仍待處理**：新版 render.js 仍使用 used('L2') 判斷 spare/working、並決定顯示未接線或熄滅；只接一個端點仍不等於已形成完整通路 | 應設部分接線狀態；SCI-12 必須實際驗收 |

**新版 CI 同 SHA 確認：** 正式 CI 12/12 completed/success（https://github.com/YenYu-bot/bhcs-web/actions/runs/39745144998）；Circuit 的 circuit-visual completed/success（https://github.com/YenYu-bot/bhcs-web/actions/runs/39745144972）。上述結果只適用於 405526b，不得替新提交預先背書。

**開發建議**：Claude 此輪已改善原本的主要幾何及手機障礙；請優先處理尚未解決的 P1-EDU-01／02，避免重新導入橫捲或退回舊布局。#165 維持 Draft；本 B 線僅提出審查，不修改 A 線程式。
