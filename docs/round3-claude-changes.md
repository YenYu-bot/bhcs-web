# 第三輪修改紀錄（2026-09-19，Claude 接手）

基準：GitHub main（與第二輪審查時相同的內容）。以下為本次變更；生成頁已用 `node scripts/build_science.mjs` 與 `node scripts/build_microscope.mjs` 重建，重建後輸出穩定。

## 新增圖片
- `assets/science/icons/icon-*.webp`：20 個研究站專屬圖示（256px，透明底）。
- `assets/science/scenes/scene-{biology,physics,chemistry,earth}.webp`：歡迎屏分科場景（1600px）；地科場景採精簡版，保留朝向落日的眉月與右下留白，不加入無關牆面物件。
- `tools/mini-lab/img/doc-microscope.png`、`doc-notebook.png`：余老師新姿勢（`doc-notebook.png` 用於研究手冊頁開頭）。

## 程式
- `assets/researcher-lab.js`
  - 歡迎屏依教材選場景（`SCENES` 對照表）；圖片載入失敗時退回 `lab-room.jpg`。
  - 顯微鏡歡迎屏改用 `doc-microscope.png`。
  - 自然教材總覽：每站專屬圖示＋具體任務句（`STATION` 對照表）；舊教材沿用最接近的圖示、不加任務句。
  - 第二批手機圖解：新增「放大圖解」切換；內容過高的多面板圖自動取消固定。
  - 儲存觀察紀錄後維持在「② 動手做」，只更新研究手冊的第二筆提示，不再自動跳頁。
- `assets/researcher-lab.css`：上述樣式；矮桌機視窗壓縮控制面板。
- `scripts/science/style.css`：移除手機 `min-width:580px`（改為整張縮入，放大時才橫向捲動）。
- `tools/microscope-lab.html`：視野下方標籤改為「目前看得到」，依實際視野與清晰度即時更新。
- `tools/buoyancy-density-lab.html`、`docs/buoyancy-density-lab-spec.md`：食用油 0.80 → 0.92 g/cm³。任務一的物體（0.80 g/cm³）在食用油中由懸浮改為漂浮；懸浮情境由任務二呈現。
- 7 個出題器（`factors`、`fraction`、`g7-signed-numbers`、`g7-scientific-notation`、`g7-factors-multiples`、`g7-linear-equation`、`g7-simultaneous-equations`）：加入 `#bhcs-mobile-controls` 手機控制列樣式。
- `ziyuan.html`：資源頁整理為漸進增強——HTML 連結與區塊結構不變（`build_science.mjs` 的改寫規則照常運作；無 JavaScript 時全部展開），JavaScript 啟動後提供固定搜尋列、學段分頁、類型篩選、可收合分類、6 個精選入口、錨點自動展開。
