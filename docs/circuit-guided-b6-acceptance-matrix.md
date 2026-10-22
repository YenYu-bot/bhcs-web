# Circuit Guided Lab Pilot #6 / B6 — 可執行驗收矩陣（B 線）

## 合併後正式基準（2026-10-22）

工程驗收目標為 `main` 的 #165 merge SHA `9c9e2dd9950825f7589e54ea158022685cd0112f`；驗收站 `tools/science/circuit-guided.html` 保留 `noindex`。#165 在 PR head `cd99585` 的正式 CI 12/12 成功；合併後 main 的 [正式 CI](https://github.com/YenYu-bot/bhcs-web/actions/runs/39756995373) 要另行驗證。Claude 互動預覽已有負責人驗收紀錄，**五名首次使用學生 cohort 仍未完成**。本矩陣是工程與學科檢核附件，正式真人發布 Gate 一律依 `docs/circuit-guided-first-time-user-gate.md`，不得以 CI 或負責人預覽代替。

**新版 CI 結構**：Circuit input、view、learner、flow 四組 Chromium 測試已整合至 `science-guided`，並產生 view／learner／flow 三種 artifacts；原暫時 `circuit-visual` workflow 已刪除。新版工程檢查核對正式 CI 全必要 jobs、CI Gate、四個 Circuit steps 及 artifacts，而不是要求已不存在的獨立 workflow。原有兩條 workflow 通知條件不可照舊宣稱成功。

---

> 狀態：驗收規格草案；2026-10-22。初版基準 #165 head 86f611e，追蹤至 `cd99585`；請以最新 Head 重新執行所有 Gate。  
> 這是**待驗證的判定條件**，不是已通過報告。不得以自動化完成取代學生操作驗收。  
> 詳見 docs/circuit-guided-b6-independent-review.md（科學與教學審查）。

## 0. 驗收方式與證據規則

- 環境：PR #165 最新 head 的**實際模組**，開發／驗收隔離網址（或可複現的本機啟動程序）；不得用靜態截圖、另外重寫的假原型、未標示 SHA 的部署。
- 裝置：Chromium 桌機 1280×900；模擬手機 390×844 且啟用 hasTouch；至少一次真實手機觸控試用。若無真機，標示「未驗證」，不得自行宣告 UX 通過。
- 核心使用者路徑**禁用** window.__cggTest、window.__cgg.setFixed、page.evaluate(直接變更 state)、程式自動 CONNECT 等測試後門。只能透過畫面可見的端點、開關、導線移除按鈕及 CTA 操作。
- 科學 oracle 可獨立呼叫 solveCircuit 或閱讀模型單元測試，但不可用同一 solver 的值對照自己來宣告教學實測過關。
- 每一案例保存：case ID、Head SHA、1280/390、瀏覽器操作步驟／紀錄、實際讀數或畫面、PASS／FAIL／NOT RUN、失敗截圖／console、修正 commit。
- 嚴重程度：P0＝錯誤的物理結果、無短路警示、重大操作失效；P1＝讓學生形成錯誤接線概念、核心手機操作不可用、文字遮住必要線路、教材解釋誤導；P2＝不影響概念和操作的次要排版。
- **放行門檻**：P0/P1 皆關閉，下面 SCI/EDU/INPUT 必要案例通過，手機與桌機人工作業確認，遵守使用者指定的最新 CI 驗收契約；原始雙 workflow Gate 遇到 workflow 架構改版時，須取得使用者對等價替代條件的明確同意，不能自動放寬。未達成則保持 Draft。

## 1. 科學與狀態機驗收

| ID | 操作／輸入 | 預期物理值或 UI 狀態 | 禁止結果 |
|---|---|---|---|
| SCI-01 | 電池 6 V、L1 6 Ω、開關關閉、A 串入、V 跨 L1，L2 無導線 | 總電流 1.0 A；V 6.0 V；L1 亮；L2「未接線」；可記錄 baseline | 以 L2 為電流路徑；V 非 6 V |
| SCI-02 | SCI-01 打開開關 | 電流 0，L1 熄滅；紀錄 CTA 鎖定；V 若浮接應分辨未定值 | 開路仍有電流／強制捏造 V 讀值 |
| SCI-03 | L1/L2 6 Ω 同一路徑、A 總路、V 跨 L1、閉合 | 總電流及 A 0.5 A；L1 V 3.0 V；兩燈較暗；等效 12 Ω | 顯示各 1 A 或以燈泡消耗電流解釋 |
| SCI-04 | 兩燈各自完整路徑、A 在分岔之前，V 跨 L1、閉合 | 總電流 2.0 A；L1 V 6.0 V；兩燈基準亮度；等效 3 Ω | 兩燈均較暗或總流 1 A |
| SCI-05 | 從 SCI-04 把 A 分別改為 L1/L2 支路 | 兩次各 1.0 A；維持整體總流 2.0 A；五筆可記錄 | 支路被判成總路，即使兩者讀數恰好都為 1 A |
| SCI-06 | SCI-04 移除 L2 的完整支路 | L1 仍為 1 A、6 V；總電流降為 1 A（理想電源） | L1 亮度必定下降的錯誤敘述 |
| SCI-07 | 將 A 接成極性反向 | 可見負讀數和「正負端」具體修正引導；該筆紀錄不得通關 | 僅以 1.0 A 正讀數讓錯誤接法過關 |
| SCI-08 | V 反向或懸空 | 反向可顯示負讀數；懸空不得誤顯 0 V 為已量測 | 懸空仍可記錄為有效 V |
| SCI-09 | 理想 A 導致電源近乎直接短路 | 明確短路安全警示，沒有 Infinity/NaN 或虛構有限電流，不能記錄 | 把危險接法稱為正確 |
| SCI-10 | 以理想導線／A 旁路 L1 | L1 顯示被繞過，不誤當正常亮燈；該關卡不誤放行 | 顯示 L1 仍承受正常壓降 |
| SCI-11 | V 串入主要電流路徑 | 不應讓 V 成為導通主路；不能通關 | 把 V 當電流表使用 |
| SCI-12 | L2 完全不接／只接其中一端／兩端都接但開關斷開／完整通電 | 四種狀態清楚不同，至少明辨「未接線」「尚未形成完整通路」「熄滅」「亮起」 | 只接一端就說「已接線」且直接等同開關斷開的熄滅 |

現有 model / engine 單元測試已含上述多個場景；**必須核對最新 Head 的測試清單與真實 UI 顯示**，不得把單元測試通過當成 SCI-12 完成。

## 2. 學生真實操作驗收（每項桌機及手機都做）

| ID | 從可見介面操作（不可使用測試 hook） | PASS 判定 |
|---|---|---|
| INPUT-01 | 新學員從 Welcome / Mission 進入空白實驗桌，依提示自行連接 baseline 的 6 條導線 | 六條導線順序不限、無假節點，完成後自動進入量測但不自動紀錄 |
| INPUT-02 | 點選第一端點，取消，再重新選第一端點，點第二端點 | 選取／取消視覺清楚且只新增一條導線 |
| INPUT-03 | 用真實 Pointer 由端點拖到另一端點 | 正確建立導線，不誤拖動器材、不因 pointer capture 遺失導線 |
| INPUT-04 | 在原始導線清單按「移除」，再從空白手動補線 | 導線及物理狀態同步，列表不殘留，也不錯誤提前通關 |
| INPUT-05 | 開關斷開與閉合，觀察讀數並記錄 baseline | 開路無流；閉合 1.0 A / 6.0 V；記錄前不提前解鎖 |
| INPUT-06 | 已完成 baseline 後，手動改為兩顆一條路徑 | 可加入 L2 且不因端點被遮擋而無法點選；量到 0.5 A / 3.0 V |
| INPUT-07 | 手動改為兩條路徑，將 A 依序放總路、L1 路、L2 路 | 2.0 / 1.0 / 1.0 A 三次量測依結構判別，不僅靠數值一致性 |
| INPUT-08 | 手機在直式接線板上選左側與右側／上下相距最遠的兩端點；若仍採橫向捲動版，另測先選、捲動、再點 | 直式版不必橫向捲動即可完成遠距接線；若橫捲，選取狀態保持，滑動不誤判拖線；無法完成為 P1 |
| INPUT-09 | 手機從右側端點拖線，放到畫面外或空白；再返回操作 | 可恢復、無幽靈導線、無無法解除的選取狀態 |
| INPUT-10 | 鍵盤 Tab／方向鍵／Enter（或 Space）選端點，Escape 取消；操作開關與導線移除 | 焦點可見，鍵盤可完成所有必要連線；不因水平捲動造成焦點迷失 |
| INPUT-11 | 接一條會造成短路的導線，再斷開並修正 | 安全警示立即可辨，移除後可繼續實驗 |
| INPUT-12 | 在手機由右側端點回到左側，使用「移除」與重新接線 | 可用手指精準操作，不必縮放到看不清文字才能完成 |

**核心手動 baseline 端點連線 oracle**：bat+–sw.a；sw.b–A.+；A.-–L1.a；L1.b–bat-；V.+–L1.a；V.-–L1.b。從可見 UI 使用任意次序與操作手勢，不可由程式直接寫入陣列。

建議記錄每一個從空白到合格接線的實際手勢數、是否遇到未提示的失敗及是否需外部協助。對新手測試用戶，**不得只讓他按下測試資料按鈕**。

## 3. 教學推論與說明驗收

| ID | 檢查 | PASS 判定 |
|---|---|---|
| EDU-01 | 任務和比較表說明變因 | 明確區分燈泡數量與接法；6 V 與每燈 6 Ω 為相同條件；不能聲稱基準到兩燈「只有接法改變」 |
| EDU-02 | 先做再講 | 在 Concept 之前，不提前顯示串聯／並聯、等效電阻或完整標準答案 |
| EDU-03 | 試驗紀錄 | 五筆有效 raw wiring 快照，錯誤、重複、偽造記錄不能冒充合格資料 |
| EDU-04 | 誘答及回饋 | 若學生答「多一燈總電流一定變小」或「第一燈把電流用掉」，回饋以已量測證據指出範圍而非只說錯 |
| EDU-05 | 收斂概念 | 解釋同一路徑 0.5 A、各自路徑總 2.0 A；支路 1.0 + 1.0 A 以電流守恆解釋，不以燈泡消耗電流解釋 |
| EDU-06 | 模型限制 | 清楚標明「理想直流模型、固定燈泡電阻」，承認真實燈絲內阻與電池效應；不過度推論 |
| EDU-07 | 操作困難時的引導 | 問題回饋具體指出「開關」「接線端點」「電表位置／極性」可能原因，而非只有「繼續接線」或「還不能記錄」 |

## 4. 視覺及無障礙驗收

| ID | 證據 | PASS 判定 |
|---|---|---|
| VIS-01 | 1280：空白、baseline 開／閉、one-path、two-path、branch1、branch2、short | 各狀態導線與元件關係清楚；燈泡 2 未參與時無假接線暗示 |
| VIS-02 | 1280：每種狀態文字與導線 | 無文字壓線／與儀表名稱交疊。特別驗收「電壓表」字樣不能被底部回路線穿過 |
| VIS-03 | 1280：導線交叉、轉角、相鄰回路 | 只有共同端點／有意連線才看似形成電氣節點，其他近接或跨越要能辨識為不相連 |
| VIS-04 | 390：完整直式／橫向接線板及各主要狀態 | 若為直式：所有 12 端點同一畫面可見且可點；若仍橫向捲動：提供 scrollLeft=0/max 截圖及遠距接線證據 |
| VIS-05 | 390：遠距端點連線的選取／拖曳／完成；必要時平移 | 觸控行為確實可重現，端點點擊區不互相遮蓋，提示可見；若為直式不能為了測試而要求無意義的左右平移 |
| VIS-06 | 1280/390 的 Notebook、Challenges、Concept | 按鈕、文字、導線清單和輸入欄不重疊、不截字 |
| VIS-07 | 鍵盤焦點、輔助科技語義 | 焦點明顯、端點以文字辨識極性，成功／警示不只靠顏色 |
| VIS-08 | 灰階／強制色彩／減少動態效果 | 同一項科學狀態不因顏色改變而無法辨識 |

### 視覺通過準則

- 每張截圖均由**最新 head** 的實際 Chromium 產生，標示對應工況；截圖不得被重繪成符合要求的示意圖。
- 自動量測碰撞範圍（DOM bounding boxes 或 SVG 關鍵區域）為輔助；**仍須人工目視檢查**電線是否形成錯誤連接的錯覺。
- 390px **直式布局**必須證明全部端點可見且可點，不須左右捲動；若採**橫向捲動**，才要求左右兩側截圖與跨畫面接線。任一端點不可使用，都不能宣告手機驗收成功。
- 尚未提供可直接操作的最新版預覽時，VIS 和 INPUT 的人工作業維持 **NOT RUN**。

## 5. CI、交接與 Gate

| ID | 必要條件 |
|---|---|
| GATE-01 | 測試／部署使用的 commit 與當時 `main` 的實際 SHA 一致；合併後工程基準先核對 `9c9e2dd9950825f7589e54ea158022685cd0112f` |
| GATE-02 | 正式 CI 該 SHA 所有必要 jobs（尤其 core、site、science-guided、CI Gate）completed 且 conclusion=success |
| GATE-03 | **新版整合式工程驗收**：在 GATE-02 同一 SHA 的 `science-guided` job 內，Circuit input/view/learner/flow 四步全數 success，且 view/learner/flow 三項 artifacts 完整；已刪除的獨立 `circuit-visual` 不列為假成功。若調整原先雙流程監測通知規則，須另經使用者確認 |
| GATE-04 | 具最新 SHA 的真實可操作教材或可重現預覽、CI artifacts；#165 PR 已記錄負責人於 `208f826` 預覽驗收，後續只改 CI/測試。**五名學生真人驗收仍是另一道發布門檻** |
| GATE-05 | 教材已獲負責人核准合併 #165；但正式公開須依 main 的五名首次使用者 Gate 全部達標，且另經負責人同意；`noindex` 與私有教材目錄狀態保持 |

基準更新：原審查 SHA 86f611e 的 GATE-02 / GATE-03 曾通過；2026-10-22 新 head 405526b0956e0e254e854ebe83d70da05500576b 的正式 CI（run 39745144998）與 Circuit（run 39745144972）亦 success。這些**不是對未來新 SHA 的預先核准**；Claude 每次新提交都必須再次核對同一當前 SHA。

## 6. 個案回報格式

每個案例的驗收紀錄請填：

- Case ID：
- 測試者角色：學生／教師／自動化
- 最新 head SHA：
- 裝置與 viewport：
- 由空白開始的操作步驟（不使用 hook）：
- 預期讀數／狀態：
- 實際讀數／狀態：
- 結果：PASS / FAIL / NOT RUN
- 截圖或錄影／工作流程連結：
- 若失敗：重現步驟、嚴重度、修正 commit 及複驗結果

最後狀態：本文件不觸碰 #165 UI 程式。Claude 承接 A 線實作；B 線依本矩陣核對；使用者有人工驗收與合併決定權。

### 2026-10-22 新版註記

PR #165 head 405526b 新增 **scripts/check_circuit_guided_learner_browser.cjs**，以 hook:false 的出貨頁面執行 1280 滑鼠／鍵盤／拖曳、390 點按／觸控拖曳，並將手機接線桌改成直式；新增 artifact 包含 circuit-learner-artifacts 的八種操作狀態。故 INPUT-01～07 已有較強的**自動化行為證據**，不能再說完全缺少真實端點操作測試；但尚未由使用者真人在裝置上完成驗收，請保持「人工：NOT RUN」。B 線原 SCI-12／EDU-01 的程式缺陷在 `208f826` 至 `cd99585` 已找到對應修正與回歸測試；仍須人工確認學生是否理解，不可將單元測試當作真人驗收通過。

## 7. 與既有正式真人驗收 Gate 的關係（2026-10-22）

本矩陣是**科學、教學語義、程式操作行為**的補充規格；真人研究及正式發布判定**一律以 main 已合併的** `docs/circuit-guided-first-time-user-gate.md`（PR #161）為準，不另發明第二套五人門檻。

- main 的首次使用者 Gate：5 位未曾使用站點的學生，同一版 cohort；至少 4/5 無 I2 協助完成全程、每人 I1 ≤1；Q1–Q3 的規定最低分數、真實 iOS Safari / Android Chrome / 桌機覆蓋、鍵盤／讀屏抽查，以及刷新增載／重啟檢查均須通過。
- PR #163 的 `docs/circuit-guided-usability-session-kit.md` 是現有的**待合併執行紀錄包**，不得在它仍是 Draft 時宣稱已併入 main，也不應把其中「NOT STARTED」當作已完成測試。
- B 線矩陣的 SCI/EDU/INPUT/VIS 可作五人驗收的逐項追蹤附件；此處 PASS 不會取代上述真實學生 cohort、發布核准或手動驗收。
- #165 合併後須先核對其 merge SHA、在 main 的最終教材與必要 CI，再把此矩陣的「待驗收」項對到 **main 的實際部署版本**。若 #165 尚未合併，僅檢查 PR head，不宣稱 main 已更新。
- #166 是文件 PR；僅當內容對應目前 main、CI 完成且使用者同意時才可 Ready／合併。文件合併不代表教材可公開，保留 noindex / 不列入正式教材目錄。

## 8. 新版 Gate 執行補充（#165 Head cd99585）

- **EDU-01 已修，程式層確認**：Mission／Compare／Inference 區分基準到兩顆時同時改變「數量與接法」，而兩顆數量相同只改接法可嚴格比較；script 單元測試提供防回歸檢查。
- **SCI-12 已修，程式層確認**：L2 端點 0／1／2 可見狀態不同，單元測試涵蓋未接線、只接一端、兩端接線但熄滅、通電較暗；真人辨識仍應列入觀察。
- **真實輸入已有工程證據**：新增 learner Chromium script 在 hook:false 模式下逐步接線，包括桌機滑鼠／鍵盤、手機點按／觸控拖曳，且手機改為直式。仍需 5 位學生真人依 `docs/circuit-guided-first-time-user-gate.md` 完成測試。
- **CI 架構改版**：`cd99585` 移除臨時 `circuit-visual` workflow，改放正式 `science-guided` 內四段 Circuit input/view/learner/flow 及三套 artifacts。新工程等價 Gate 建議為正式 CI 全部必要 jobs 與 CI Gate 成功＋Circuit 四段及 artifacts 完整，但**用戶同意前不得自行宣稱取代原本「兩條 workflow 同 head」的硬門檻**。
- **部署與真人驗收**：保留 `noindex`／未列入教材公開目錄；在 main 對應 merge commit 或可驗證的 preview 環境測試，不可用舊 PR head 截圖充當新版本。

## 9. CI 與截圖證據核對（head `cd99585`）

- [正式 CI run 39753661608](https://github.com/YenYu-bot/bhcs-web/actions/runs/39753661608)：completed/success，12/12 jobs success，包含 `core`、`site`、`science-guided` 與 `CI Gate`。
- `science-guided` 的 Circuit input／view／learner／flow 四個 steps 均 completed/success；`circuit-learner-review`（artifact 12415926117）、`circuit-view-review`（12415163020）、`circuit-flow-review`（12415187653）均已上傳。
- B 線已直接抽樣檢視 1280 baseline/two-path 以及 390 baseline、L2 one-end、one-path、two-path、遠距 drag 畫面。畫面層原 P1-UX 重疊與 L2 狀態在抽樣畫面未再重現，**但 VIS/INPUT 真人欄一律保持 NOT RUN**。
- **GATE-03 仍待決策**：原獨立 Circuit workflow 被移除，使用者尚未明確批准新的單工作流程等價 Gate。不可把上述單一 CI 成功稱為「符合原本兩工作流程的全綠通知條件」。
- #165 已為 Ready for review，但截至本次查核 merged=false。不能將 Ready、CI success 或 #166 文件完整視為正式發布許可；`noindex`、五人 cohort 及最終人工作業要求保留。
