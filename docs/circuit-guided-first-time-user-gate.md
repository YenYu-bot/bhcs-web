# Pilot #6 電路導引實驗 — 首次使用者教學可用性驗收

狀態：**待執行真人測試；不能以 CI 全綠代替**  
工程基準：B5 merge `57358b9bc95e8b21c862f3f3f794fad5635fd9f7`  
驗收頁：`tools/science/circuit-guided.html`（維持 noindex、未列入公開教材目錄）  
規格：`docs/circuit-guided-spec-v1.0.md`

## 1. 目的與發布閘門

核實首次使用的學生不靠教師代為接線、提示答案，就能完成「接線→操作開關→移動電表→五次量測→比較→Concept→Notebook→Challenge 1–3→Complete」，且能從自己的證據說明電流與燈泡的關係。

工程 B1–B5、CI 與 Playwright 測試成功，不代表真人可用性成功。在這份真人驗收通過且負責人另外核准發布之前，**不得移除 noindex、加入公開導覽或取代 Advanced Mode**。

## 2. 參與者與設備

招募 **5 位未用過本站電路 Guided 頁的目標學段學生**（P01–P05），不要記姓名、電話、學號或錄下識別資訊。一般先備電路知識可保留，但不得事前看教學關卡或答案。

五場須涵蓋至少一台 iOS Safari、一台 Android Chrome、及一台電腦瀏覽器的真實設備。另做一次桌機全鍵盤、一次 VoiceOver / TalkBack / NVDA 等實際讀屏操作抽查。記錄系統、瀏覽器、視窗與方向、測試部署與 commit。

## 3. 主持人一致口條

> 這是一個虛擬電路實驗。請照畫面提示，從頭到尾自己完成；遇到困難可以把你的想法說出來。我不會提示正確接法或答案。我們要檢查教材是否容易理解，不是在考你。

介入層級：
- **I0** 中性提問（不算協助）：例如「你現在想找什麼？」
- **I1** 指出介面操作位置或可點擊方式（計一次協助）。
- **I2** 示範正確導線／電表位置、提供科學結論、提示選項（該學生不得算獨立完成）。

不能因為學生卡住，就替他接線或替他按「記錄」。

## 4. 逐關觀察（逐位記錄）

| 關卡 | 不提示下必須看見的行為 |
|---|---|
| Welcome / Mission | 明白任務是比較不同接法的量測，不是先背答案 |
| Baseline | 自己把 L1、電流表與電壓表接對；閉合實體開關，記錄 1.0 A / 6 V |
| Trial 1 | 自己建立兩燈一條路；電流表 0.5 A；L1 電壓 3 V |
| Compare 1 | 依據基準與 Trial 1 說明總電流變小 |
| Trial 2 total | 自己建立兩條路；量得總電流 2.0 A，兩燈各為基準亮度 |
| Trial 2 L1 / L2 | 各自重新移動電流表；能辨認兩處相同 1.0 A 讀值但**接線位置不同** |
| Compare 2 / Inference | 能用總電流 2.0 A 與兩路各 1.0 A 解釋差異 |
| Concept | 正式術語第一次出現，學生能把名稱連回已量到的數值 |
| Notebook A/B/C | 完成數據判讀、自己的解釋與模型限制，沒有因提示而代答 |
| Challenge 1 | 修正電壓表應跨接燈兩端的錯誤觀念 |
| Challenge 2 | 真正把電流表接在前／中／後三個位置，觀察皆 0.5 A |
| Challenge 3 | 真的拆掉 L2 那一路，確認 L1 / total 皆 1.0 A |
| Complete | 讀懂四個結論並能正確重新開始 |

額外記錄：首次找不到可點元件、手指遮擋端點、拖曳誤觸捲動、電表極性反接的恢復、錯誤訊息能否自主處理、介面文字是否洩漏答案。

## 5. 事後開放式提問（不先顯示選項）

Q1：「同樣多接一顆燈，為什麼一次總電流從 1.0 A 降到 0.5 A，另一次增加到 2.0 A？」  
Q2：「兩燈只有一條路時，為什麼電流表放在前、中、後都量到 0.5 A？」  
Q3：「兩條路時移除其中一路，另一顆燈與電池總電流各有什麼變化？你量到什麼？」  
Q4：「這個虛擬模型與真正電池、燈泡或電表有什麼差別？」

各題 0＝錯誤或只在 I2 提示後答對；1＝部分正確；2＝清楚、自主、符合模型。Q1–Q3 為核心題。

## 6. 硬性通過標準

同一未修改版本的五人 cohort 必須全部符合：

1. 至少 **4/5** 不需 I2 協助完成至 Complete。
2. 每一位至多 **1 次 I1**。
3. 至少 **4/5** 在 Q1、Q2、Q3 每題得分都 ≥1。
4. 至少 **4/5** 的 Q1+Q2+Q3 合計 ≥4/6。
5. 不得有兩人遇到相同阻斷性操作問題。
6. 不得出現錯誤電學結論、危險短路未警告、電表反接仍誤記錄。
7. iOS Safari、Android Chrome 都能真機完成完整操作。
8. 鍵盤及讀屏抽查能完成流程，且無關鍵無障礙阻斷。
9. 刷新頁面、進度恢復、清除重來的狀態與提示一致，無需學生身分資料。

第一、二人若遇到同一阻斷問題，或任何人遇到科學錯誤、資料遺失、危險的輸出，應**立即停止招募**並開修正 PR；修正後重新編 cohort，不混算新舊版本。

## 7. 單人記錄表（複製五份）

```text
Participant: P__
Cohort / tested commit / URL:
Date:
Device / OS / browser / viewport:
Start / finish / total time:
I1 count / I2 count:
Longest stall (seconds) / screen:
Completed independently? YES / NO
Reached Complete? YES / NO
Baseline / Trial1 / Trial2-total / L1 / L2:
Compare1 / Compare2 / Notebook:
Challenge1 / Challenge2 (three placements) / Challenge3:
Reload / Restart:
Q1 (0/1/2) + notes:
Q2 (0/1/2) + notes:
Q3 (0/1/2) + notes:
Q4 (0/1/2) + notes:
Observed UI confusion:
Observed science misunderstanding:
Accessibility issues:
Critical defect / issue link:
```

## 8. 判定與後續

- **PASS**：所有硬性指標通過。僅能進入獨立的正式發布審核，不自動公開。
- **PATCH / RETEST**：任一硬性指標未通過。分開建立 UI 或教案修正 PR，CI 全綠後對修改後版本重新做五人 cohort。
- **INCOMPLETE**：未完成五場或未做必需設備／無障礙檢查，不得稱為 PASS。

主持人需提供匿名觀察表、統計摘要、缺陷清單與裝置覆蓋表；不要把真人研究尚未進行寫成已通過。
