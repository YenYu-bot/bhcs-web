# G9 r12 修正與本機预驗收（2026-09-28）

## 已修正的實際錯誤
- 原包 P2：272/273 組通過；solid/count/challenge/integer 失敗。
- 精確訊息：raw_invalid_question、paper_candidate_invalid，Invalid non-null candidate。
- 種子 1912912488：原始抽樣有 30 個非法候選；例如「一個十角柱與一個角錐的邊數相同」，答案出現「undefined角錐，頂點 16 個，面 16 個」；十二角柱則出現「undefined角錐，頂點 19 個，面 19 個」。
- 原因：CN 中文數字名稱表只到十二，但此題 m=3n/2 可達十五與十八。
- 修正僅將 solidConfig 的 CN 表補齊十三至十八。生成數值、計算與 verify 條件均未改；不排除題型、不放寬驗收。
- 新增 count-name-check.cjs，直接檢查 1000 個原始候選並覆蓋五種 k4 題型（四／六／八／十／十二角柱），確認完整答案及頂點、面數。

## 驗證範圍與結果
- 原 r12 除 solidConfig、TOPICS、CONFIGS 三處新增外，與 r11-checked 逐字相同；保有 #77 的螢幕表格品牌色規則。
- 修正後 G9 全 13 topics 的 P2：273/273 組，54,600/54,600 題；verify 失敗 0、例外 0、無非法候選，273 份 40 題卷滿額，耗盡 0。
- G9 P3：69 units，41,400/41,400 題，耗盡 0，結構／挑戰門檻失敗 0；新增 solid 六單元無豁免。
- solid 的 18 組 math_local_check 每組 200 題通過。
- solid DOM 壓測：90 份 40 題卷與 90 份 80 題卷，共 10,800 題；滿額、卷內重複題幹 0、JSDOM errors 0。
- 原 README 的「null 0」不是本次測試結果：cone/challenge 會正常拒絕候選；null 允許重試，實際耗盡為 0。
- 保留原 11 單元／21 組非阻擋效率警示；未更動門檻。

此為 G9 範圍預驗收。全站 P2/P3 ratchet、完整回歸、資源卡片、舊頁導流及真實瀏覽器／列印驗收，須在輪到 r12 網站整合時完成；不將 Claude 自述的 Playwright 結果當作 ChatGPT 親自驗證。

## GitHub 接續
#77 head a3fe3a44689aa2bafeba8d1d4804a815fe2d0b21 的 Researcher run 36432927670 與 Math regressions run 36432927617 均 success，已轉正式並 squash merge；main 基準為 799a340cfe68425005a1f67514f0a237aa9e81b5。
本輪依既定順序先整合 r9 boxplot，r10→r11→本修正 r12 依序接續。不得以原始未修正版 r12 覆蓋。
