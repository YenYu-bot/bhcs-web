# 光學與透鏡成像 2.0｜Phase B 盤點與實作拆分

日期：2026-10-07
依據：`docs/optics-lens-lab-v2-spec.md`（Spec v1.2，Approved for Phase B）
範圍：**唯讀盤點**。沒有修改任何 HTML、JS、builder、測試、CI，也沒有開 PR。
狀態：待使用者審核。§7 列出需要使用者拍板的決策，核准前不進實作。

---

## 1. 結論（先回答三個問題）

1. **升級舊頁，還是另開 2.0 頁？ → 另開獨立新頁，舊頁全部保留（並存），Prototype 期間新頁不進目錄。**
   - 現有 `tools/science/optics.html` 是 builder 產生的檔案，與其他約 22 站共用同一份 runtime，並被 42 站共用測試以「有 slider、`#run`、`#add-record`」為前提檢查。直接改它會同時違反 Spec §3「主流程不出現 slider-first」和 CI 的共用合約。
   - repo 既有慣例也是「新增為獨立單檔頁面，舊工具 URL 保留」（`docs/science-lab-roadmap.md`「第二批」）。
   - 現有 `optics.html` 的功能（slider 調 `f`／`u`、讀值、公式、凸／凹透鏡、三題檢核）接近 Spec §12 的「自由探索／進階模式」。可保留作為進階入口，Prototype 不必重做 Advanced Mode。
2. **能重用的與要新建的：** 見 §5。
   - 可重用：站台外殼的四步導航與樣式、三個器材圖檔、余老師圖、分析事件 adapter、`axe-core`／`jsdom`／Playwright 測試設施。
   - 必須新建：物理與清晰度模型（含 bench 與 effective level）、Spec 的 state engine、guided 輸入層（snap、clamp、PageUp、大 hit target）、連續 blur 的實驗桌、Evidence Compare Card、結構化 record schema、Trial 3 搜尋追蹤。
3. **拆成 8 個可獨立驗收的批次：** 見 §6。順序是「純模型 → 純 state engine → 輸入層 → 畫面 → 腳本內容 → 手冊與挑戰 → 整合與 CI → 使用者測試」。前兩批完全不碰 DOM。這樣出問題時，能分辨是 physics、state、UI 還是教材流程。

---

## 2. 現有頁面盤點

| 檔案 | 性質 | 與本站關係 |
|---|---|---|
| `tools/science/optics.html` | **builder 產生**（`scripts/build_science.mjs`），不可手改；共用 `assets/science-lab.js`；用 `researcher-lab.js` 外殼 | 現有「光學與透鏡成像實驗室」。slider 為主，3 個引導任務，30→40 cm 比較，凹透鏡、公式顯示模式、3 題檢核、`localStorage` 紀錄 |
| `tools/convex-lens-imaging.html`（173 行） | 手寫單檔 legacy | 側面光路＋正面所見；拖蠟燭（SVG pointer capture）＋slider＋「五種情況」2F 分類。**與 Spec §15 刻意不做的 2F 分類表同路線**。末端有 builder 注入的 `science-next` 連結指向 `optics.html` |
| `tools/lenses.html`（373 行） | 手寫 legacy，6 個 tab（分類、折射、焦點、三條特殊光線、由點到像、成像操作） | 基礎教室，屬 Spec 範圍外。`check_site_browser.cjs` 對它有 smoke test |
| `tools/eye-lesson.html` | 手寫 legacy | 眼睛與矯正，屬範圍外（Spec §15 不做眼球） |
| `docs/science-optics-spec.md` | `batch2.mjs` 產生的簡短規格 | 描述現有 optics 站；與 v2 spec 無衝突，但會被 builder 重寫，**不可在這份檔案寫 v2 內容** |

### 入口與連結關係

- `scripts/science/catalog.mjs`：`lenses.html`、`convex-lens-imaging.html`、`eye-lesson.html` 為 legacy 目錄項目；`optics` 在 `scripts/science/batch2.mjs`。
- `tools/science/index.html`（自然實驗總覽卡片）、`ziyuan.html`（資源頁，含項目計數）、`guozhong-lihua.html`／`guozhong.html`／`guoxiao.html` 的 `science-course` 區塊：全部由 `build_science.mjs` 產生。
- `build_science.mjs` 在 `lenses.html`、`convex-lens-imaging.html` 末端注入「接著做一個完整探究 → optics.html」。
- `optics.html` 的「接著學」連到 `../lenses.html`、`../convex-lens-imaging.html`。
- `sitemap.xml`：`scripts/build_sitemap.py` 以 `rglob("*.html")` 產生；有 `noindex` 的頁面會被排除。
- `assets/researcher-lab.js` 的 `STATION`／`SCENES` 表，以頁面檔名（`optics`）決定場景圖與目錄卡片文案。

---

## 3. builder 與產生檔依賴

```text
scripts/science/models.mjs        ┐  calculate('optics') 等模型
scripts/science/diagrams.mjs      ├─ 串接 → assets/science-lab.js（內容雜湊 12 碼作 ?v=）
scripts/science/runtime.js        ┘
scripts/science/batch2.mjs        → tools/science/optics.html（含 #lab-config JSON）、docs/science-optics-spec.md
scripts/science/catalog.mjs       → 目錄卡片、ziyuan.html、課程頁區塊
scripts/build_site.mjs            → 掃 tools/**/*.html，只改有引用 assets/site.js 的頁面之 ?v=
scripts/build_shell.py            → 只處理根目錄與 wenzhang/ 頁面（不碰 tools/）
scripts/build_resources.py        → ziyuan 項目計數
scripts/build_sitemap.py          → sitemap.xml
```

CI（`.github/workflows/researcher-lab-check.yml`）依序跑所有 builder，再執行 **`git diff --exit-code`**。結論：

- 凡是 builder 產生的檔案，只要手改就會讓 CI 失敗。
- 新頁若是手寫、且不被任何 builder 改寫，就不會造成 diff 漂移。唯一例外是 `build_site.mjs` 會正規化頁面內 `site.js?v=`，新頁首次需先跑過 builder 再提交。
- 新頁若 **未加 `noindex`**，會被 sitemap 腳本收進去，也會被 `check_science_integration.cjs` 檢查 canonical、連結、sitemap 一致性。

---

## 4. 現有測試與 CI gate（與本站相關者）

| 測試 | 與 optics 的關係 | 對 v2 的影響 |
|---|---|---|
| `scripts/test_science_models.mjs` | 驗 `calculate('optics')`：`f10,u30→v15,m-0.5`；`u=10→v=null,kind='focus'`；`u=5→v=-10,m=2`；凹透鏡 `v=-7.5` | **數值與 Spec §14.1 一致**，可作為新模型的對照。舊模型用 `kind:'focus'`、容差 `1e-9`，沒有 bench 或 clarity |
| `scripts/test_researcher_batch2.cjs` | 檢查 `diagrams.mjs` 含 `data-lab-drag="u"`；用 JSDOM 載入 `optics.html` 驗證外殼（3 個任務 span、單一 h1、pushState、`[data-return-second]`）；拖曳手柄 `r="25"`（≥48px） | 若改動 `optics.html` 或 diagrams，會直接失敗 |
| `check_researcher_operations.cjs` | **42 站真實瀏覽器流程**（390／1280）：`#control-fields` 內 slider、`#run`、`#add-record`、紀錄兩筆、`[data-return-second]`、`#quiz` 三題、reload 後紀錄保留 | optics 在 `shared` 清單。slider-first 主流程無法通過，**不可直接替換** |
| `check_researcher_composition.cjs`、`test_researcher_batch5.cjs`、`check_researcher_browser.cjs` | 同樣含 optics 於 shared 清單（歡迎畫面版面、`#lab-config` 結構） | 同上 |
| `test_science_ui.cjs` | `bhcsScienceTrack('record','optics')` 分析事件 allowlist | v2 需要自己的 lab id，字元規則 `^[a-z][a-z0-9_-]{0,80}$` |
| `test_science_inquiry.cjs`、`test_science_experience.cjs`、`test_science_illustrations.cjs` | 掃 `firstBatch` ＋ `batch2` 全部頁面 | 新頁不在 batch2，不受影響 |
| `check_site_browser.cjs` | `lenses.html`、`convex-lens-imaging.html` 為 `legacyToolPages`：必須**不含 GA、只載入一次 `site.js`、不載入 `science-events.js`**；`lenses.html` 有 tab smoke | 舊頁保留即不受影響；**新頁不要放進此清單** |
| `check_science_integration.cjs` | 所有 HTML：本地連結存在、canonical 與 sitemap 一致、`noindex` 不得在 sitemap | 新頁需設定 `noindex` 或同步進 sitemap |
| `.github/workflows/math-fix-regressions.yml` | 與本站無關 | 無 |

> `scripts/package.json` 的 `npm test` 為 node 腳本串接（無 jest／vitest）；jsdom 26、axe-core 4.10.3 已在 devDependencies；Playwright 只在 CI 以 `NODE_PATH=/tmp/bhcs-composition` 安裝。

---

## 5. 可重用與必須新建

### 5.1 可重用

| 項目 | 位置 | 備註 |
|---|---|---|
| 四步導航文案 | `assets/researcher-lab.js` | 「① 接任務／② 動手做／③ 研究手冊／④ 挑戰題」與 Spec §3.1 **完全一致** |
| 外殼樣式 | `assets/researcher-lab.css`（約 77 KB） | `.researcher-screen`、`nav` 等；`[data-lab-drag]{touch-action:none}` 已與 Spec §6.6 方向一致 |
| 器材圖 | `assets/science/props/prop-candle.webp`、`prop-convex-lens.webp`、`prop-screen.webp`；`bg-physics-bench.webp`；`icons/icon-optics.webp` | 三件器材已存在；需驗證連續 blur 與翻轉（`transform`）後的視覺 |
| 余老師 | `tools/mini-lab/img/doc-point.png`、`doc-think.png`、`doc-wow.png`、`doc-notebook.png`、`doc-thumb.png` 等 | 現有表情可覆蓋大部分腳本；「觀察」情緒可能缺 |
| 分析 adapter | `assets/science-events.js` | 已有 DNT／GPC／`noga` 處理與不含自由文字的 allowlist |
| 數值對照測試 | `scripts/test_science_models.mjs` | 作為新模型的回歸對照 |
| 測試設施 | jsdom、axe-core、Playwright（CI） | |
| 現有 `optics.html` | — | 直接當 Spec §12「進階／自由探索」入口，不重做 |

### 5.2 不建議直接重用（有耦合風險）

- **`assets/science-lab.js` 的 runtime**：紀錄格式是「設定快照＋文字解釋」；拖曳需先「完成正式觀察並開啟自由觀察」才可用（`moonExplore` 閘門）；鍵盤只有 `←／→`，步進為 control step；沒有 snap、clamp 狀態、PageUp、pointer capture 到物件。Spec 的 state machine 與它不相容。
- **`researcher-lab.js` 的 `scienceStation()`**：要求頁面有 `#lab-config`（`noPrediction`）並**依 id 搬移** `.lesson-meta`、`.missions`、`#experiment`、`#records-section`、`#quiz`、`#teacher`；歡迎頁文案含「先猜猜看」、CTA 為「領取任務卡」；自行管理 `history.pushState`。若硬套，v2 的 `*-complete`／`*-recorded` 等 state 與外殼的 screen 切換會互相搶控制權。
- **舊紀錄 key**：`bhcs-science-v2-optics`（現有 optics 站使用）。v2 必須使用不同 key，避免同源讀到格式不符的資料。key 命名也不要再用 `v2` 字樣以免和現有前綴混淆。

### 5.3 必須新建

1. 物理與清晰度模型（Spec §7）：`theoreticalV`、`imageType`、`projectionWithinBench`、`rawClarityLevel`、`effectiveClarityLevel`、放大率、`null` 取代 `Infinity`。
2. State engine（Spec §8.1／§8.1A）：自動 vs CTA transition、`*-complete` 內 CTA 停用、重複操作處理、Hint 三級與搜尋進度提示、Trial 3 區域累計。
3. Guided 輸入層（Spec §6）：依 state 的可動範圍、snap（桌機 0.5／手機 1）、clamp、`←／→`、`Shift`、`PageUp／PageDown`（僅 focus 時攔截）、44×44 hit target、pointer capture、`touch-action` 分區。
4. 實驗桌視圖：連續 blur／contrast、散開光影、焦點穿越與 bench 溢出表現、「從透鏡後面看」虛像視圖、眼睛 icon、光線層漸進揭露。
5. 內容層：余老師腳本、Evidence Compare Card（讀 record）、Level A／B／C 研究手冊、概念卡與公式、三個挑戰題。
6. 結構化 record（Spec §10）與持久化。
7. 驗收腳本：模型單元測試、state engine 序列測試、輸入層測試、390／1280 版面與 console gate、鍵盤完整流程。

---

## 6. 實作批次拆分

每批都有獨立驗收，且只有通過才進下一批。批次內不引入下一批的依賴。

| 批次 | 內容 | 主要產出（建議位置） | 驗收 gate | 失敗時可歸因於 |
|---|---|---|---|---|
| **I0 決策** | 見 §7 | 決策記錄 | 使用者核准 | — |
| **I1 模型** | 純函式：成像、bench、raw／effective clarity、放大率 | ES module（無 DOM、無 builder），例如 `assets/optics-lab-v2/model.mjs` | Spec §14.1 八組單元測試；§14.2 clarity 全表（含 `s=20 → Lv3`、`s=22 → Lv4`、`v=40.5/42/44/60/210`）；序列化後不含 `NaN`／`Infinity`；比較一律用 epsilon（`f=10` 時邊界值為 dyadic 可精確，但其他 `f` 的 `0.06×f` 不是） | physics |
| **I2 State engine** | 純 reducer：狀態、transition 契約、記錄寫入、Hint、搜尋區累計、可動範圍表 | `assets/optics-lab-v2/engine.mjs` | 腳本化事件序列測試：Trial 1→2→compare→3→虛像→notebook；`*-complete` 移出 sharp 只停用記錄；Trial 2 屏幕保留 `trial1.observedScreenPosition`（用 14.5／15／15.5 三組）；`u=10`／bench 外不觸發 transition；Trial 3 區間邊界 16.5、28.5；重複操作不重複記錄；Hint 方向由 `theoreticalV − s` 算出，且 `u≤f` 停用 | state |
| **I3 輸入層** | pointer／touch／keyboard → engine intent；snap、clamp、PageUp、focus 攔截 | `assets/optics-lab-v2/input.mjs` | jsdom：鍵盤與 pointer 事件序列，兩條路徑結果相同（Spec §13）；Playwright（CI）：touch pointerdown／move／up／cancel、器材外區域 `pan-y` 可捲動、拖曳時不水平捲頁 | input |
| **I4 實驗桌視圖** | SVG 實驗桌、器材、連續 blur、散開光影、光線層、虛像視圖；桌機與手機版面 | 新頁骨架＋視圖模組 | 1280×800、390×844 截圖與版面斷言（無水平 overflow、hit target ≥44px、三器材同屏）；靜態狀態表（每個清晰度層級與穿越狀態）逐一截圖審閱 | UI |
| **I5 教材腳本與 Compare** | 余老師台詞、任務提示、Compare Card、概念卡、公式出場 | 內容模組 | 所有顯示學生證據處改用 record（Spec §14.4，以 14.5／29.5 驗證）；台詞語氣規則抽檢；`theoreticalV` 不出現在 guided UI | 教材流程 |
| **I6 手冊與挑戰** | Level A／B／C、結構化 `studentConclusion`、三個挑戰題、持久化與 reload | 內容＋儲存模組 | record schema 驗證；reload 後保留；Challenge 2 不需先算公式 | 教材流程／儲存 |
| **I7 整合與 CI** | 頁面串接、導航、分析事件、`noindex`、與舊站互連；CI 新增腳本 | 新頁、`.github/workflows` 增項 | 完整流程 console gate（Spec §14.6）；鍵盤全流程（§14.3）；axe-core；`check_science_integration` 通過；既有 42 站測試維持綠燈（因為舊檔未動） | 整合 |
| **I8 使用者測試** | Spec §14.7 的 5 人 student-flow gate | 測試記錄 | ≥4/5 完成、≥4/5 說出正確關係 | 教材設計 |

I1、I2 完成後，Spec 數學與狀態契約已被測試鎖住，後續 UI 的任何變更都不應再動它們。

---

## 7. 需要使用者拍板的決策（I0）

| # | 決策 | 建議 | 理由 |
|---|---|---|---|
| D1 | 新頁位置與檔名 | `tools/science/optics-lab-v2.html`（單檔頁面；模組放 `assets/optics-lab-v2/`） | 符合「第二批：獨立單檔頁面」慣例；不在 `tools/*-lab.html` legacy 命名區，也不落入 `check_site_browser` legacy 清單 |
| D2 | Prototype 期間是否進目錄與 sitemap | **不進**：`noindex`、不加入 `catalog.mjs`／`batch2.mjs`、不改 `ziyuan.html` 計數 | 避免動到產生檔與計數，也避免未通過使用者測試的教材被搜尋到。通過 Gate 後再做入口遷移 |
| D3 | 外殼：重用 `researcher-lab.js` 還是自建 | **自建輕量 flow controller，重用 `researcher-lab.css` 的視覺**；I4 前做半天 spike 確認樣式可共用 | `scienceStation()` 的 DOM 搬移與 history 管理與 v2 state engine 衝突。若 spike 顯示可共用 CSS，再沿用；導航標籤文字沿用現有四步 |
| D4 | 儲存 key 與分析 lab id | `localStorage` key：`bhcs-lens-guided:*`（不使用 `bhcs-science-v2-`）；分析 id：`optics-guided` | 與現有 `optics` 站資料隔離；符合 `science-events.js` 的字元規則 |
| D5 | 與舊頁的互連 | v2 頁底連到現有 `optics.html` 作為「自由探索／精確數值」入口；暫不改舊頁 | `optics.html` 近似 Spec §12 Advanced Mode，不必 Prototype 重做；不動舊頁就不碰 builder |
| D6 | 模組載入方式 | ES module（`<script type="module">`）直接給 Node 測試 import，不經 builder 串接 | 單一真實來源（Spec §7.3）；避免 builder 產生檔造成 `git diff --exit-code` 漂移；現有 runtime 是串接的 classic script，但新模組沒有此限制 |
| D7 | 新測試的接入 | 新增 `scripts/test_optics_guided_*.mjs`（模型、engine）進 `npm test`；瀏覽器測試新增獨立 `check_optics_guided_browser.cjs` 進 CI | 與現有 node 腳本風格一致；不把 optics 加進 42 站共用清單 |
| D8 | 遷移（入口替換）時機 | Student-flow Gate 通過後，另開批次：目錄卡片改指 v2、`lenses`／`convex-lens-imaging` 的 `science-next` 連結視情況調整、`optics.html` 降為進階入口 | 此時才需要動 builder 與 42 站共用清單 |

---

## 8. 風險與未決事項

1. **舊頁 `convex-lens-imaging.html` 的 2F 五分類與 v2 教材順序不同**：兩者並存期間，學生可能從舊頁先看到分類表。對 Prototype 測試而言，需確保測試者只從 v2 頁開始。
2. **余老師表情圖**：現有 `doc-*.png` 沒有明顯「觀察」姿態；如需要，是素材任務，不是工程阻塞。
3. **虛像與眼睛視圖素材**：Spec §15 需要新的眼睛 icon 與虛像呈現，現有 repo 沒有；可先以 SVG 向量實作。
4. **`researcher-lab.css` 與新頁共存**：該 CSS 以 `.researcher-station` 等 class 限定範圍，若新頁自建外殼，需確認不意外繼承 `body.researcher-ui` 規則（I4 spike 內檢查）。
5. **`build_site.mjs` 對 `site.js?v=` 的正規化**：新頁若引用 `assets/site.js`，需在提交前跑一次 builder 讓版本字串一致；否則 CI 的 `git diff --exit-code` 會失敗。
6. **未實際執行測試**：本盤點為讀檔與 grep，未安裝依賴、未跑 `npm test` 或 Playwright。各 gate 的現況（是否目前全綠）要到 I7 前才會實際驗證。

---

## 9. 盤點範圍紀錄

已讀取：`tools/convex-lens-imaging.html`、`tools/science/optics.html`、`docs/science-optics-spec.md`、`docs/science-lab-roadmap.md`、`scripts/build_science.mjs`、`scripts/science/catalog.mjs`、`scripts/science/models.mjs`（optics 段）、`scripts/science/diagrams.mjs`（optics 段）、`scripts/science/runtime.js`（拖曳與儲存段）、`assets/researcher-lab.js`（外殼段）、`assets/science-events.js`、`.github/workflows/*.yml`、`scripts/package.json`，以及各 `scripts/test_*`／`check_*` 中與 optics 相關的片段。
`tools/lenses.html`、`tools/eye-lesson.html` 只讀標題與結構，未逐行審閱（屬 Spec 範圍外）。
