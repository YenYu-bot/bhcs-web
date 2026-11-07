# Pilot #1 Optics Guided Lab｜新版驗收矩陣（提案）

> 版本：B 線 review 2026-10-22。這是**下一輪工程修改時必須達到的驗收規格草案**，不是已完成報告。以 `main` `312f486656f17fd26e44f9d805e2e17f12a4f97a` 為只讀基準。對照 `docs/optics-lens-lab-v2-spec.md` v1.2 和 `docs/optics-guided-p1-teaching-script-v1.3-proposal.md`。

## 0. 驗收證據規則

- **工程 CI**：全部 unit tests、1280/390 真實 Chromium、site/integration，必須同一 PR 最新 Head success；CI Gate success 不代表真人 PASS。
- **真實學生**：最少 5 名未使用過本站 Guided 光學頁的目標學段學生；≥4/5 獨立完成、≥4/5 用自己的話至少說出一個正確光學關係（原 Spec §14.7）；新增問題應測出是否把實物／虛像區分清楚。紀錄匿名，不能捏造裝置或成績。真 iOS Safari、Android Chrome、桌機應有覆蓋，並抽查鍵盤及讀屏。
- 每案例回報：case ID、Head SHA、預覽 URL、viewport、操作路徑、預期／實際、PASS/FAIL/NOT RUN、截圖與必要 console。若是人工體驗尚未做，**保留 NOT RUN**。
- P0：錯誤物理／狀態破壞／嚴重資料損失；P1：學生無法完成操作、隱藏過關門檻、誤學科學概念；P2：不阻斷但值得改善的版面／文案。
- 網站原始科學模型／engine / v1.2 tests 不可「改測試以過關」。範圍只修改已核准的 UI、台詞與必要的新回歸測試。

## 1. 科學模型 SCI

| Case | 情境／輸入 | 必須符合 |
|---|---|---|
| SCI-01 | f10 u30，屏幕 s20 | v15、m−0.5、real/inverted/smaller；effective clarity Lv3；不允許紀錄 |
| SCI-02 | f10 u30，s14.5、15、15.5（桌機） | 都屬 sharp，按 RECORD 寫入實際 observed；不能把 14.5 改寫成 15 |
| SCI-03 | f10 u30，手機 s14→15→16 | 僅 s15 sharp；微調動作不降低容差門檻、不可自動填答案 |
| SCI-04 | Trial2 u15、s前次實際 observed | v30、m−2；起始 Lv4，屏幕位置不自動重置；學生自己重新找 |
| SCI-05 | Trial2 s29.5、30、30.5（桌機） | sharp，影像倒立且放大；按 RECORD 寫入當前 s |
| SCI-06 | u10 | infinite、`theoreticalV=null`、無 finite sharp，不顯示 NaN／Infinity |
| SCI-07 | u12→v60；u10.5→v210；屏幕 s≤40 | 狀態是 bench 外 **real**，不誤標 virtual，不接受 sharp／RECORD |
| SCI-08 | u5 | v−10、m+2、virtual/upright/larger；屏幕全域 effective Lv4 |
| SCI-09 | 三區邊界 | near[8,17)、middle[17,29)、far[29,40]，16.5、28.5 不重複歸屬 |
| SCI-10 | 所有已支援 range 與浮點邊界 | 無錯誤 `NaN`、`Infinity`、`null` 字面顯示，model 是單一科學真值來源 |

## 2. 操作與狀態 INPUT

| Case | 行動 | 通過要求 |
|---|---|---|
| INPUT-01 | 未首次操作畫面 | 一眼辨別蠟燭、凸透鏡、屏幕及目前**哪個器材能移動**；不能誤按固定器材 |
| INPUT-02 | 390 手指從 s20 找到 s15 | 能用實際觸控達 sharp，沒有水平捲動、手指遮擋造成不可完成 |
| INPUT-03 | 390 微調按鈕左右各按三次 | 每次 1cm，與 MOVE_SCREEN 統一，狀態即時更新；不直接跳 sharp |
| INPUT-04 | 手機旋轉／390 裝置鍵盤 | snap 與 clamp 正確，按鈕不攔截頁面上下捲動，hit target ≥44px |
| INPUT-05 | 桌機鍵盤 Arrow／Shift+Arrow／PageUp／PageDown | 既有 1cm／0.5cm／5cm 契約不回歸；focus 移出 draggable，PageDown 仍能捲頁 |
| INPUT-06 | Trial1 找到 sharp，移出範圍又回來 | 相同 phase；離開 sharp 記錄 CTA 停用，回到 sharp 後啟用 |
| INPUT-07 | Trial1 observed=14.5、Trial2=29.5 | Compare／Notebook／Concept 證據用本人數值；公式揭露前不暴露理論解 |
| INPUT-08 | Trial2 僅移蠟燭、屏幕鎖定 | 屏幕必須留在上一輪 observed，達 u15 才交還屏幕控制 |
| INPUT-09 | Trial3 一次從 30 拖到 8，僅在 8 放手 | 只勾選 near，middle 不得因經過而自動計入 |
| INPUT-10 | 分別在 8、20、35 停下（drag/keyboard/button） | 近／中／遠進度 1/3→2/3→3/3，才可按「我已檢查...」 |
| INPUT-11 | Trial3 在同一區重複 settle | 不重複加分、不重複事件，不計為另一區 |
| INPUT-12 | 重新載入／中途離開／清除紀錄 | 已完成觀察與回答保存，未完成的輪次合理重來，提示不冒稱完全從原位置恢復 |
| INPUT-13 | 以純鍵盤、VoiceOver 或 TalkBack 進行 | 每個控制有可朗讀名稱／值／鎖定狀態，CTA 狀態可知，焦點不亂跳；能完成三區搜尋 |

## 3. 教學邏輯 EDU

| Case | 必須觀察到的理解或介面文字 |
|---|---|
| EDU-01 | Welcome 不預先出現薄透鏡公式、實像／虛像答案，也不強制預測作答 |
| EDU-02 | Trial1 學生知道是在「移屏幕找清楚」，不是亂拖透鏡／切換參數 |
| EDU-03 | Trial2 學生明白「只改物距，原本的屏幕位置失焦」，不把兩個變因一起改 |
| EDU-04 | Compare 能從本人兩筆觀察說出位置更遠、實像更大；若某次 observed 是 14.5／29.5 不影響判斷 |
| EDU-05 | Trial3 一開始就交代「近、中、遠**各停一次**」，可見進度更新；學生不能把單次掃過當完整搜尋 |
| EDU-06 | 查看虛像時能辨認原蠟燭與虛像；知道虛線是反向延長線，不是另一支真的蠟燭 |
| EDU-07 | Concept 正確分類：兩筆實像可屏幕承接、第三輪虛像不能；揭露 `1/f=1/u+1/v` 的時機在三輪後 |
| EDU-08 | Notebook Level B/C 不因非空字串就對外宣稱已「批改正確」 |
| EDU-09 | 三挑戰能遷移至模糊投影、焦距內影像和放大鏡情境，不要求先背公式 |
| EDU-10 | 課程結尾用自己的話描述，回饋不辱罵、不過早公布答案，明確說明理想薄透鏡模型限制 |

## 4. 視覺與無障礙 VIS

| Case | 條件 |
|---|---|
| VIS-01 | 390 首屏 | 四步導航、余老師、三器材辨識清楚，頁面無水平 overflow |
| VIS-02 | 1280 bench | 實驗桌是視覺主體，右側提示不遮光線及器材，清晰影像可辨識 |
| VIS-03 | Lv1～Lv4 | 真正觀察得到清晰度變化，顏色、文字、形狀至少兩者呈現狀態 |
| VIS-04 | 390 手指微調 | 按鈕可讀、觸點 ≥44px、可使用單手、不蓋住屏幕影像 |
| VIS-05 | 虛像模式 | 實際蠟燭／虛像／眼睛三者明顯可辨，虛線不誤畫為真光路 |
| VIS-06 | 自然環境亮暗／灰階／減少動態 | 不靠純顏色，焦點清楚、提示更新可理解 |
| VIS-07 | Notebook B/C 長文字與 Challenges | 390 不截字、不出現無故水平捲動，鍵盤選項可讀 |
| VIS-08 | iOS Safari／Android Chrome 真機 | 真正觸控拖移、調整、捲頁及 reload 無阻斷，不只 Chromium 手機模擬 |

## 5. Gate 與放行

| Gate | 要求 |
|---|---|
| GATE-01 | PR 最新 Head 是被測版本；範圍限 Pilot #1，舊公開 `optics.html` 沒被改壞 |
| GATE-02 | model、engine、script、input、visual、persist 等原有單元與新增 P1 測試全通過 |
| GATE-03 | 正式 CI 必要 jobs（core/site/science-guided/CI Gate）在同 Head completed/success，桌機＋手機 Chromium 截圖可審閱 |
| GATE-04 | P0/P1 已關閉且附實際操作證據，最少五名初次操作者之真人 Gate ≥4/5 可獨立完成／≥4/5 可說出至少一個正確科學關係；不能把工程 CI 當真人 |
| GATE-05 | 使用者核准教學腳本與程式修正、核准 PR 合併；正式公開再另行核准，否則保持 `noindex`、不進 sitemap／公開目錄 |

**執行順序**：先核准本次審查文件 → Claude 開 P1 UI/教學修正 Draft PR → 單元 + 真實 Chromium gate → ChatGPT B 線核對 → 使用者真機操作 + 五人 Gate → 核准 Merge → 獨立 Rollout PR。未經同意不得把這個文檔 PR 視為開發授權。
