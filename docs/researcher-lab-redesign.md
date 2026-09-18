# 小小研究員・虛擬實驗室改版

更新日期：2026-09-18。

## 目前設計

本次改版涵蓋自然教材總覽與 20 個主要互動研究站，視覺沿用 `tools/mini-lab/` 的暖色、貼紙與虛擬實驗室語言，帶領角色統一為「余老師」。

學生流程統一為：

1. 接任務
2. 動手做
3. 研究手冊
4. 挑戰題

學生端不再要求先做「預測」。任務直接進入操作與觀察，再以兩筆可比較的證據完成解釋。

## 主要互動

- 顯微鏡：字母 e 定位玻片、十字地標、試片拖曳、反向移動、低倍／高倍紀錄。
- 光學：完成一次正式觀察後可開啟自由觀察，拖曳物體改變物距；支援左右方向鍵。
- 能量：完成一次正式觀察後可拖曳坡道小球位置；支援左右方向鍵。
- 月相／日月食：四個月相捷徑與自由觀察。
- 電磁：補充線圈前側電流方向與磁極標示。
- 四季：補充固定地軸方向的公轉位置圖。
- 共用模型頁：保留解釋草稿；紀錄保存結構化設定，最近兩筆可直接指出改了哪個條件。
- 20 個研究站均使用同一套 researcher shell，手機版優先保留觀察區。

## 名稱與文案

- 「奇奇博士」已全面改為「余老師」。
- 20 個主要研究站及研究基地學生可見介面不含「預測」流程或控制項。
- 第一批獨立教材使用主題化常見迷思，而非通用提醒。

## 來源

- `assets/researcher-lab.css`：小小研究員共用視覺。
- `assets/researcher-lab.js`：研究基地、四步流程及獨立頁 shell。
- `scripts/science/runtime.js`：共用模型執行、自由觀察、紀錄與拖曳。
- `scripts/science/diagrams.mjs`：模型圖解與可拖曳圖形。
- `scripts/build_science.mjs`：自然教材與研究基地重建。
- `scripts/build_microscope.mjs`：顯微鏡頁重建。

## 驗收

CI 依序執行：

```sh
node scripts/build_microscope.mjs
node scripts/build_science.mjs
npm test --prefix scripts
node scripts/check_science_integration.cjs
node scripts/test_researcher_batch1.cjs
node scripts/test_researcher_batch2.cjs
node scripts/test_researcher_batch3.cjs
node scripts/test_researcher_batch4.cjs
node scripts/test_researcher_batch5.cjs
```

另外已以 Chromium 實際驗收 390、768、1280px、手機顯微鏡拖曳及 A4 列印；20 個研究站與研究基地共 63 次尺寸檢查未發現水平溢位或 JavaScript error。

## 合併原則

較早版本曾使用 `scripts/science/researcher.*` 與 `task-predictions.mjs` 實作預測導向流程。新版以 `assets/researcher-lab.*` 與無預測流程取代，舊檔不再作為建置來源。
