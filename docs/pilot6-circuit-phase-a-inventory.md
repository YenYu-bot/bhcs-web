# Pilot #6 Phase A 盤點：電路虛擬實驗室

- 基底：`main` @ `9b0d3a33a8e8bda0c37a19db888de1a64e914956`
- 範圍：只做事實盤點與技術建議。不改 production code，不開實作 PR，不寫完整教學腳本。
- 主要讀過的檔案：
  - `tools/circuit-lab.html`
  - `assets/researcher-lab.js`
  - `scripts/build_science.mjs`
  - `scripts/science/{catalog,experience,inquiry,batch2,models}.mjs`
  - `docs/circuit-lab-spec.md`
  - `assets/science-guided/components.js`
  - 下面第 5 節列出的所有相關測試與 workflow
- 行號以本基底的 `tools/circuit-lab.html` 為準（下稱「頁面」）。

---

## 0. 頁面的組成與歸屬

| 部分 | 來源 | 說明 |
|---|---|---|
| 模型、SVG 繪圖、互動、紀錄、檢核 | 頁面內嵌 `<script>`（L147–224） | **手寫**，不由 builder 產生。電路模型只存在這裡。`scripts/science/models.mjs` 和 `assets/science-lab.js` 都沒有電路模型；`models.mjs` L156 的 `I=V/R` 屬於 `electric-power` 站。 |
| `science-schema`、`science-experience-style`、`science-self-study`、`science-teaching`、`science-events`、`science-study-script` 區塊 | `scripts/build_science.mjs` 以 `replaceBlock` 注入 | 內容取自 `catalog.mjs`（L18 基本資料、L28 常見迷思）、`experience.mjs`（L9 任務卡）、`inquiry.mjs`（L6 比較任務）。 |
| `researcher-lab.css` / `.js`（版本參數） | `build_science.mjs` L29–31 | `circuit-lab.html` 列在 `researcherLegacyFiles`。 |
| 余老師引導 | 頁面 L229 的 `<script type="application/json" id="lab-guide">` | 由 `assets/researcher-lab.js` L157–201 執行。 |
| 研究流程四畫面（① 接任務 → ② 動手做 → ③ 研究手冊 → ④ 挑戰題） | `assets/researcher-lab.js` L55 在執行期重排 DOM | 原頁面的段落會被搬進 prepare / bench / notebook / check 四個 screen。 |
| 分析事件 | `assets/science-events.js`（defer） | 頁面在 L218 呼叫 `bhcsScienceTrack('start','circuit-lab')`。 |
| 插畫 | `assets/science/props/prop-{battery,light-bulb,switch-closed,switch-open}.webp` | 圖檔載入後重畫；缺圖時退回 SVG 符號（L165–171）。 |

公開狀態：

- 頁面**已公開且可被索引**：沒有 `noindex`。
- 有出現在 `sitemap.xml`、`ziyuan.html`、`guozhong.html`、`guozhong-lihua.html`、`tools/science/index.html`。
- 列在 `catalog.mjs` 的 `firstBatch`。
- 另有 3 個 batch2 站把它當延伸連結：`electromagnetism`、`electric-power`、`electrostatics`（`batch2.mjs` L55、L395、L412）。

---

## 1. 現有實驗模型

模型函式是 `solve(s)`（L156–162），輸入 `state()`（L155）：

```
{ type, V, R1, R2, closed, short }
```

- `type`：`single` / `series` / `parallel`
- `short`：只在 advanced 模式才可能為 `true`

### 1.1 參數

| 項目 | 現況 |
|---|---|
| 電池電壓 | `<select id="voltage">`：1.5 / 3 / 4.5 / **6**（預設）/ 9 V。理想電壓源，**沒有內電阻**。 |
| R1 / R2 | `<select id="r1">`、`<select id="r2">`：3 / **6**（預設）/ 12 / 24 Ω。燈泡以「固定電阻」近似（label 也寫「固定電阻模型」）。`single` 時 R2 的控制項隱藏。 |
| 接法 | `<select id="topology">`：`single`「單一燈泡」、`series`「兩燈串聯」、`parallel`「兩燈並聯」。**拓樸由學生直接選名稱決定，不是由接線推導。** |
| 開關 | radio `swClosed` / `swOpen`。斷開時回傳 `kind:'open'`、`I=0`；`Req` 仍照接法計算並顯示。 |
| 短路示範 | advanced 模式的 checkbox `#short`（「用導線跨過負載」）。 |
| 電流方向 | advanced 模式的 `<select id="direction">`（傳統電流／電子）。**只影響動畫方向，不影響數值**；`test_science_experience.cjs` 有測這點。 |

### 1.2 計算（`solve`）

| 情況 | 公式／回傳 |
|---|---|
| 開路 | `I=I1=I2=0`，`V1=V2=P1=P2=0`；`Req` 依接法計算 |
| 短路（閉合且 `short`） | `kind:'short'`、`Req:0`、`I:Infinity`、`I1:Infinity`、`I2:0`、其餘 0 |
| 單燈 | `I=V/R1`，`V1=V`，`P1=V·I` |
| 串聯 | `Req=R1+R2`，`I=V/Req`，`V1=I·R1`、`V2=I·R2`，`P=I²R` |
| 並聯 | `Req=1/(1/R1+1/R2)`，`I1=V/R1`、`I2=V/R2`、`I=I1+I2`，`V1=V2=V`，`P=V·In` |

- 頁面載入時跑 `runTests()`（L219）。它檢查 4 個案例：單燈 6V/6Ω→1A、串聯→0.5A／3V、並聯→2A／各 1A、開路→0。失敗只會 `console.error`。
- `docs/circuit-lab-spec.md` 有 6 個驗收案例。其中第 5 個「並聯移除一支路」**頁面目前沒有對應操作**（沒有「拆掉一顆燈」的控制）。

### 1.3 亮度

- 亮度公式是 `intensity = on ? min(0.95, 0.18 + P/7) : 0.04`（L163–164）。
- 用功率比較亮度，但 **P ≥ 約 5.4 W 就飽和到 0.95**。
- 預設情況：
  - 單燈 6V/6Ω（6 W）和並聯每燈（6 W）都已飽和。
  - 6V/3Ω 單燈（12 W）和 6V/6Ω 單燈（6 W）**看起來一樣亮**。
  - 串聯每燈 1.5 W，亮度約 0.39。
- 亮度是相對、非線性、會飽和的視覺。頁面「亮度怎麼判斷？」卡片和教師框都說明它只適合相對比較。

### 1.4 理想化與真實限制

| 元素 | 現況 | 有沒有寫出限制 |
|---|---|---|
| 電池 | 理想電壓源，無內電阻 | 有：教師框 L115、檢核第 3 題 |
| 導線 | 理想，0 Ω | 有：教師框 |
| 燈泡 | 固定電阻；真實燈絲的電阻會隨溫度變 | 有：L112、L115、頁尾 |
| 短路 | `I = Infinity`。UI 顯示「過大」、`Req ≈ 0 Ω`，不顯示數值 | 有：L115、檢核第 3 題 |
| 電表 | **不存在**。讀值是上帝視角的 meter 卡（等效電阻、總電流、各燈 I／V／P），不是學生放置的電表 | 沒有 |
| 開關 | 理想（閉合 0 Ω，斷開 ∞） | 沒有特別說明 |

---

## 2. 現有學生操作

「類型」欄的分類：

- **P→A**：選參數 → 看答案。
- **真操作**：學生的動作本身產生觀察。
- **紀錄／檢核**：不屬於實驗本身。

| 元件 | 種類 | 作用 | 類型 |
|---|---|---|---|
| `#level`（基礎／進階） | select | 顯示或隱藏短路與方向控制 | 介面模式 |
| `#topology` | select | 用名稱直接選「單燈／兩燈串聯／兩燈並聯」，圖形自動換成正確接線 | **P→A**，而且名稱本身就洩漏概念 |
| `#voltage` | select | 電池電壓 | P→A |
| `#r1`、`#r2` | select | 燈泡電阻 | P→A |
| `swClosed` / `swOpen` | radio | 開關 | 半操作：概念上是真操作，但仍要再按「通電驗證」才看到結果 |
| `#short` | checkbox（進階） | 短路示範：畫出一條紅色跨接線 | P→A（示範） |
| `#direction` | select（進階） | 動畫方向 | 純顯示 |
| `#verify`「通電驗證」 | button | 算出並顯示所有讀值、解釋文字與公式 | **P→A 的核心**：一鍵揭露全部答案 |
| `#reset` | button | 全部回預設 | — |
| `#teacherToggle` | button | 顯示或隱藏模型邊界說明 | — |
| `#addRecord` | button | 把目前結果寫入紀錄表（存在 localStorage，最多 12 筆） | 紀錄 |
| `#printRecord`、`#clearRecord` | button | 列印、清除（清除前會 confirm） | 紀錄 |
| 檢核 q1–q3、`#checkQuiz` | radio + button | 3 題選擇題；分數存在 `bhcsCircuitQuiz` | 檢核 |
| 自學勾選 `[data-study-step]` ×3、`#study-note`、`#study-clear` | checkbox、textarea、button | 自評進度與筆記（存在 localStorage） | 自評 |
| 余老師引導（`lab-guide`，4 步） | 執行期產生的選項按鈕 | 每步「把接法調到 X → 按通電驗證 → 讀總電流 → 選答案」 | **P→A**：讀上帝視角的讀值 |
| SVG `#circuit` | 圖 | `role="img"`，**沒有任何圖像互動**；線、燈、開關都不能點或拖 | 純顯示 |

結論：

- 現有頁面**沒有任何接線、放置元件或使用電表的操作**。
- 所有「實驗」都是「選名稱與參數 → 按通電驗證 → 讀出完整答案」。
- 以下內容在操作**之前**就以靜態文字出現在畫面上，對 Guided 而言等同概念洩漏：
  - 「串聯／並聯」名稱（`#topology` 選項）
  - 「串聯看什麼？」「並聯看什麼？」的結論卡（L109–113）
  - 檢核題（L127–129）
  - 余老師任務卡的提示（catalog 迷思文字、inquiry 比較任務）

---

## 3. 真正接線 Guided Lab 的技術需求

### 3.1 建議的元件與範圍（Guided 限定）

- 固定零件盤：1 顆電池、1 個開關、2 顆燈泡、1 個電流表、1 個電壓表。
- **元件位置固定**（學生不搬元件），學生只建立與刪除「導線」。
- 一條導線只連兩個「端點」（terminal），端點共 12 個：電池＋/−、開關 a/b、燈一 a/b、燈二 a/b、電流表＋/−、電壓表＋/−。
- 限制導線數上限（例如 ≤ 10）、不允許自連、不允許重複。
- 這樣拓樸空間有限，可以窮舉測試，也避免「自由畫線」的幾何難題。
- Advanced 才開放更多電阻值、第二顆電池、混聯等。

### 3.2 Circuit graph 表示（純 model）

```
terminal  : 'bat+' | 'bat-' | 'sw.a' | 'sw.b' | 'L1.a' | 'L1.b' | 'L2.a' | 'L2.b' | 'A.+' | 'A.-' | 'V.+' | 'V.-'
component : { id, kind: 'battery'|'switch'|'lamp'|'ammeter'|'voltmeter', terminals: [t1, t2], params }
wire      : { from: terminal, to: terminal }        // 學生資料：state 只存這個與開關狀態
```

- **State 只存學生輸入**：導線清單、開關開或關、（可選的）電阻選擇。節點、支路、電流、分類全部由 engine 推導，延續 B1 以來「state 不存答案」的契約。
- **節點（node）**：用 union-find 把「被導線直接相連的端點」合併成電氣節點。
- **超節點（supernode）**：再把「零電阻元件」（導線、閉合開關、理想電流表）兩端合併，得到超節點。之後的拓樸判斷和求解都在超節點圖上做。
- **支路（branch）**：剩下的有阻元件（燈泡）和電源，各是超節點圖上的一條邊。
- 電壓表在理想模型中**不導電**，不參與連通與求解，只在最後讀兩端電位差。

### 3.3 開路、閉路、短路判斷（純函式，在求解之前）

1. **電源短路**：電池兩端落在同一個超節點（中間只隔著導線、閉合開關或電流表），判為 `source-short`。
   - 不算數值，標記危險，燈泡全滅。
   - 「電流表直接接在電池兩端」也落在這一類。
2. **負載被跨接**：某燈泡兩端落在同一個超節點，判為 `lamp-bypassed`。
   - 這不一定危險：串聯中被跨接的一顆燈熄滅，另一顆仍有限電流。
   - 必須和電源短路分開處理，不可以都叫「短路危險」。
3. **開路**：電池兩端在「導通圖」上不連通，判為 `open`，所有電流 0。
4. **閉路**：只對「同時連到電池兩端、而且位在某個迴路上」的有阻支路求解。
   - 懸空的元件（只接一端，或整個不連）電流為 0。
   - 懸空元件不進矩陣，避免奇異矩陣。

### 3.4 求解（純函式）

- 對 3.3 第 4 點的「活躍子圖」做 nodal analysis：以電池負端為地，電池正端電位為 V。
- 超節點數 ≤ 6，用高斯消去即可。
- **建議用整數或有理數運算**：沿用 `ph10` 的整數單位思路，例如電壓用 0.1 V 為單位、電阻用整數 Ω，搭配分數（BigInt 分子分母）。這樣 0.5 A、0.25 A 不會出現 `0.49999`，也能嚴格比較「兩個電流表讀值相等」。
- 電流表讀值：通過該電流表的支路電流，帶正負號。從電流表的 − 端進 ＋ 端出為負讀值；Guided 可顯示「指針反偏」。
- 電壓表讀值：兩端所在節點的電位差。若有任一端在「與電池無關的懸空區」，讀值為 `null`，顯示「—」或「讀不到」，**不可回 0**（見 3.6）。

### 3.5 串聯與並聯應由拓樸推導，不應直接選

- 學生建的是接線，**分類由 engine 從圖推導**，只用來判斷 Compare／Notebook 的答案，**不寫入 state**。
- **並聯**：兩燈兩端分別落在同一對超節點上（`{L1.a, L1.b}` 和 `{L2.a, L2.b}` 映射到同一組節點對）。
- **串聯**：兩燈在活躍子圖的同一條「鏈」上，也就是兩燈之間的中間節點只連著這兩顆燈（度數為 2），沒有其他支路。等價的判準：拿掉任一燈，另一燈電流變 0。
- **其他**：任一燈被跨接、懸空、只接一顆、或出現 Guided 範圍外的組合時，回 `'other'`，並附具體原因（例如 `L2-bypassed`、`L1-dangling`）。由教學腳本決定怎麼回應。
- 零件固定、端點只有 12 個，所以可以**窮舉**所有導線組合（有上限）做性質測試，確認分類不會落在矛盾狀態。

### 3.6 電流表串聯、電壓表並聯的驗證與接錯時的處理

| 接法 | 理想模型會發生什麼 | 建議的 model 輸出 |
|---|---|---|
| 電流表串在要量的路徑上 | 電流表是 0 Ω，不改變電流 | 正常讀值；`placement:'series'` |
| 電流表並接在一顆燈兩端 | 燈被跨接（0 Ω 旁路） | 燈熄滅，電流表讀到旁路電流；`placement:'parallel-to-L1'` 加教學旗標（不是危險） |
| 電流表直接接在電池兩端，或與電池形成無負載迴路 | 電源短路 | 走 `source-short`：不給數值，危險提示，電流表標「可能損壞」 |
| 電壓表並接在燈或電池兩端 | 不導電 | 讀兩端電位差；`placement:'parallel'` |
| 電壓表串進唯一迴路 | 理想 ∞ Ω：迴路等同開路，電流 0 | 電流 0、燈全滅、電壓表讀數約等於電池電壓（電位沿零電流支路傳遞，見下）；`placement:'series'` 加教學旗標 |
| 電表反接 | 理想模型照算 | 讀值為負，Guided 顯示「反偏」，不當錯誤 |

**「理想電壓表串聯」會造成除以零或懸空節點**，處理方式如下：

- 求解只在活躍子圖做。
- 求解後，再把電位沿「零電流的有阻支路」傳遞：電流為 0，電阻兩端就沒有電壓降。
- 傳遞得到的電位就是串聯電壓表兩端的電位。這樣可以得到「約等於電池電壓」，不需要讓電壓表參與矩陣。
- 真正和電池兩端都不連通的節點，電位為 `undefined`，讀值為 `null`。
- 另一個選項是把電壓表改成極大有限電阻（例如 10 MΩ），讓矩陣自然處理。但這會讓整個電路出現微小、非零的電流（約 µA），和國中「斷路沒有電流」的教學直覺衝突，而且要處理顯示精度。
- **建議**：Guided 用理想電表加上述傳遞規則；Advanced 可另外考慮有限內阻。

### 3.7 輸入：手機 touch 與鍵盤替代

主操作建議是「**點端點 A → 點端點 B**」建立導線（兩次點擊）。拖線只是增強，**不是唯一操作**。這延續 Pilot #4（未知液體辨識）input 層「按鈕與拖曳等價」的原則。

- **點選模式**：
  - 第一次點端點進入「已選起點」狀態（`aria-pressed`），第二次點另一端點建立導線。
  - 再點同一端點，或按 Esc，取消。
  - 端點的視覺很小，但命中區要 ≥ 44×44 px，需要額外的命中圈。
  - 手機上元件布局要直立排列，避免端點擠在一起。
- **拖曳增強**：
  - pointer capture，`touch-action:none` 只放在端點上，頁面其他地方照常捲動。
  - 這是 acid-base B2 在 SVG `<g>` 上 `touch-action` 失效時的做法：命中層改用 HTML overlay。
- **鍵盤**：
  - 每個端點是一個真正的 `<button>`，有可讀名稱，例如「電池正極」「燈泡一左端」。Tab 或方向鍵移動，Enter／Space 選取。
  - 另外提供「**導線清單**」：每條導線一列，例如「電池正極 — 開關左端」，附「移除」按鈕。這同時是螢幕閱讀器的電路描述，也是手機上刪線的可靠方式。
  - 刪線不依賴長按或拖離。
- **導線渲染**：渲染器只畫 engine 給的導線清單。學生畫出的線不帶幾何語意，連接關係只看端點。
- **鎖定**：phase 不允許時，engine 拒絕 `CONNECT`／`DISCONNECT`，input 層只回報意圖。延續 `getLocked`／`canDip` 模式。

### 3.8 需要新增的模組（比照 acid-base／photosynthesis 的分層）

| 層 | 新增能力 |
|---|---|
| `model.js` | 端點與元件定義、電阻／電壓整數單位、union-find、超節點、拓樸分類（`classifyCircuit`）、短路與開路判斷、有理數 nodal solver、電位傳遞、電表讀值、亮度等級（離散化） |
| `engine.js` | state = `{phase, wires, switch, ...}`；action `CONNECT`／`DISCONNECT`／`TOGGLE_SWITCH`／`READ_METER`；記錄「觀察」時只存學生的接線快照，不存讀值；比較與檢核都從快照重算 |
| `render.js` | 固定布局的元件（沿用現有插畫）、端點熱區、導線、燈泡亮度（亮度帶加文字，不只靠色相）、電表錶面、短路警示 |
| `input.js` | 點擊配對、拖曳增強、鍵盤端點按鈕、導線清單刪除；只回報「端點 A 到 B」的意圖 |
| `script.js`／`persist.js`／`analytics.js`／`challenges.js`／`main.js` | 照既有 Guided pilot 的契約即可，例如 persist 用 action replay restore、analytics 只送固定 milestone |

---

## 4. 現有內容可重用程度

### A. 可直接沿用

- 數值範圍：電壓 1.5–9 V、電阻 3／6／12／24 Ω、預設 6 V／6 Ω。
- `docs/circuit-lab-spec.md` 的 6 個驗收案例。新 solver 必須在對應接線上重現它們，可以當 **oracle**。
- 現有 `solve()` 的三組公式，可當新圖形 solver 的交叉驗證：同一組 V／R，「單燈、串聯、並聯接線」的解必須和 `solve()` 相同。
- 模型邊界的說法：理想電池與導線、固定電阻燈泡、短路不給精確值。內容來自教師框 L115 和檢核第 3 題的理由。
- 安全提醒段落（L133）。
- `test_science_illustrations.cjs` L35–51「從 SVG 線段推連通性」的測試**思路**：連通性要獨立於 solver 驗證。
- 插畫素材 `assets/science/props/prop-{battery,light-bulb,switch-*}.webp`。
- 共用元件 `assets/science-guided/components.js`：`focusHandoff`、`createAnnouncer`、`createActionBar`、`renderStepNav`、`renderCoachCard`、`renderStatusBar`、`renderDataCard`、`renderEvidenceCard`、`renderCompareCard`、`renderConceptReveal`、`createNotebook`、`createChallengeCard`、`renderCompletionCard`。
- `assets/science-events.js` 和既有 Guided 的 persist／analytics 契約。

### B. 概念或數學可沿用，但 UI 必須重做

- `solve()`：換成「由接線推導」的圖形 solver，數學相同。
- 讀值卡（總電流、各燈 I／V／P、等效電阻）：改成學生**放置的電流表與電壓表**讀值。等效電阻不再直接顯示，最多在 Concept 之後當推論。
- 亮度：改成離散亮度帶加文字，並把「固定電阻近似」放在 Concept 階段說明。
- 開關：改成在電路圖上點開關（真操作），不再是表單 radio。
- 短路：從「勾選 checkbox 看示範」改成「學生的接線**被 engine 判定**為短路」時的安全回應。是否允許學生做出短路，交給教學規格決定；model 兩種都支援。
- 紀錄表：改成 Evidence／Compare 卡；記錄內容是「接線快照」，不是讀值字串。
- 「從讀值找規則」的解釋文字：只能在 Concept 之後出現。
- 電流方向（傳統電流／電子）：可以留到 Concept 或延伸，不放在前期操作。

### C. Guided 不適合沿用，應只留 Advanced Mode

- `#topology` 名稱選單：直接選「串聯／並聯」等於給答案。
- `#level` 基礎／進階切換。
- 自由切換 R1／R2 的下拉參數探索（Guided 至少前期應固定）。
- `#short` 示範 checkbox。
- 一鍵揭露全部讀值的「通電驗證」。
- `lab-guide` 4 步「讀上帝視角讀值 → 選答案」。
- 靜態的「串聯看什麼？／並聯看什麼？」結論卡、公式行、目前的 3 題檢核、自學勾選。

---

## 5. 測試基線

### 5.1 現有與 circuit-lab 有關的測試及 CI 契約

都在 `npm test` 或 Researcher workflow 中。

| 檔案 | 類型 | 對 circuit-lab 的契約 |
|---|---|---|
| `test_researcher_batch4.cjs` | jsdom 靜態加執行期 | L7、L19–30：沒有 `#prediction`、可見文字沒有「預測」、有 versioned researcher css／js、`#verify` 可點、`iValue` 有結果；L37：researcher shell 必須包含 `circuit-lab.html` |
| `test_researcher_batch5.cjs` | 靜態 | L41：`legacyAll` 名單包含 `circuit-lab.html`（研究流程殼層契約） |
| `test_science_experience.cjs` | jsdom | L23：advanced 模式下驗證 6V／6Ω 為 `1 A`；切換方向不改讀值；`addRecord` 可用；改電壓後讀值、`b1Note`、解釋、公式都回到「等待」（stale-result invalidation） |
| `test_science_illustrations.cjs` | jsdom | L33–52：**從 SVG 導線路徑推連通性**，與 solver 無關。三種接法都要閉合時不短路電源、有負載迴路、斷開開關會中斷；並聯任一支路單獨可通；串聯兩燈缺一不可 |
| `check_researcher_operations.cjs` | Playwright（Researcher workflow「Check all station operations, records, and challenges」） | L5：`['circuit','verify']`。在 390 與 1280 跑完整研究流程：開始、執行、存紀錄、改條件後紀錄失效、第二筆、reload 後保留、清除、檢核空白不判錯 |
| `check_researcher_composition.cjs` | Playwright（Researcher workflow「Check all welcome layouts and capture review images」） | L8：`tools/circuit-lab.html` 在 legacy 版面截圖與排版檢查名單中 |
| 頁面內 `runTests()` | 執行期自測 | 4 個 `solve()` 案例，失敗只 `console.error` |
| `check_science_integration.cjs`、`build_*` 與 `git diff --exit-code` | 靜態 | builder 注入區塊必須冪等；頁面列在 sitemap 與資源頁 |

**沒有**任何 circuit 專屬的 `test_*_model.mjs` 或 browser input／view gate。模型只靠頁面內 4 個自測和上面的 jsdom 測試間接覆蓋。

> 這些契約全部鎖住現有的 `tools/circuit-lab.html`。只要改動該頁，就會連帶觸發 batch4、batch5、experience、illustrations、operations、composition 這六支檢查。這也是「保留現頁不動、另開 Guided 頁」的技術理由之一。

### 5.2 Pilot #6 未來至少需要的測試（本輪不新增）

**model**
- 端點與元件定義凍結。
- union-find 與超節點正確。
- 開路、閉路、電源短路、燈被跨接、懸空元件各一組。
- 有理數 solver 重現 `circuit-lab-spec.md` 的 6 個驗收案例，以及現有 `solve()` 在全部 V×R1×R2 組合下的單燈、串聯、並聯結果，做交叉驗證。
- 電位傳遞：串聯理想電壓表讀約等於 V；懸空端回 `null`。
- 電流表三種放法（串聯、並燈、跨電池）與電壓表兩種放法（並聯、串聯）。
- 反接讀值帶負號。
- 分類 `series`／`parallel`／`other(原因)`。
- **窮舉**：在導線上限內枚舉所有接線，不得出現 `NaN`、`Infinity`，也不得拋例外；`source-short` 不給數值；分類互斥。
- 輸入凍結，結果決定性（deterministic）。

**engine**
- 對 phase 鎖定 `CONNECT`／`DISCONNECT`／`TOGGLE_SWITCH`。
- 拒絕重複導線、自連、未知端點，以及超過上限的導線。
- state 只存接線，不存讀值或分類。
- 偽造 state 帶入的讀值或分類一律被忽略。
- 每個 gate 都由接線重算。
- 被拒絕的 action 回傳同一個 state 物件；所有 reduce 在 deep-frozen 輸入上跑。

**input browser gate**
- 點擊配對建立和取消導線。
- 拖曳建立導線，從端點外放開時取消。
- 鍵盤用 Tab／方向鍵移到端點，Enter／Space 配對，Esc 取消。
- 導線清單可移除。
- 頁面在端點以外照常捲動。
- 鎖定時建立不了導線。
- pointercancel 不殘留狀態。
- 390 寬度下端點熱區 ≥ 44 px。

**view browser gate**
- 固定布局下各元件、端點、導線在 1280 與 390 都完整可見，不重疊。
- 亮度帶在 forced-colors 與灰階下仍可分辨，並且有文字。
- 短路警示的視覺。
- 電表錶面讀值可讀，數字 ≥ 13 px。
- 無水平捲動，axe 乾淨。

**full-flow browser gate**
- 從 Welcome 一路到 Complete，含刻意接錯：
  - 開路
  - 燈被跨接
  - 電流表並接
  - 電壓表串接
- 串聯前後兩處電流表讀值相等（反「電流被用掉」）。
- 並聯支路電流相加等於總電流。
- pre-concept 洩漏掃描：可見文字、title、aria、live region 都要掃。
- reload／restore，analytics 固定 milestone，390 觸控全流程，截圖。

---

## 6. 風險

| 風險 | 現況（事實） | 對 Guided 的建議 |
|---|---|---|
| 短路造成無限電流 | `solve` 回 `I:Infinity`，UI 以字串「過大」遮蔽；`fmt()` 對非有限值回 `—`。只要經過這兩層就不會印出 Infinity，但 `Infinity` 會進 `lastResult` | 新 model 在求解**之前**判斷 `source-short` 並提前返回，**根本不產生** Infinity 或除以零；窮舉測試保證任何接線都不會有非有限值 |
| 理想電表造成除以零或拓樸異常 | 現頁沒有電表，風險尚未出現 | 電流表用超節點合併（0 Ω 不進矩陣）；電壓表不進導通圖，用電位傳遞；懸空區不進矩陣；電流表跨電池走 `source-short`（3.6 節） |
| 串並聯能否由拓樸可靠推導 | 現頁由名稱選擇，沒有推導 | 在固定 12 端點、上限導線數的範圍內可以可靠推導（3.5 節），並用窮舉性質測試保證；範圍外一律回 `other` 加原因，不硬分類 |
| 燈泡亮度模型誤導 | `min(.95,.18+P/7)` 在約 5.4 W 飽和；6 W 與 12 W 看起來一樣亮；燈絲電阻固定 | 改成離散亮度等級，由功率比值決定，搭配文字；不承諾和真實燈泡一致；Concept 階段明說「固定電阻近似」 |
| 「電流被燈泡用掉」迷思 | catalog L28 有寫這個迷思，但只出現在教學說明文字；現頁的總電流 meter 無法讓學生親自量燈泡前後 | 讓學生把電流表放在燈泡前後兩處，親自量到相同讀值；動畫不可以在燈泡後變淡或變慢 |
| 手機接線可用性 | 現頁沒有接線 | 點擊配對為主、導線清單刪除、端點熱區 ≥ 44 px、元件固定位置、直立布局；必須由 input／flow browser gate 在 390 觸控驗證 |
| pre-concept answer leakage | 現頁在操作前就顯示「兩燈串聯／兩燈並聯」選項、串並聯結論卡、檢核題、引導答案 | Guided 頁 pre-concept 階段不得出現「串聯、並聯、等效電阻、歐姆」等詞；沿用 acid-base 的 `FORBIDDEN` 掃描模式，套用到 model、script 與瀏覽器文字 |
| 動到公開頁 | `circuit-lab.html` 已公開、被 6 支測試鎖住、有 3 個 batch2 站的延伸連結 | Guided 另開 noindex、unlisted 頁；`circuit-lab.html` 保持 0 diff |
| 浮點誤差 | 現頁用浮點加 `fmt()` 四捨五入 | 改用整數或有理數，讓「兩讀值相等」可以嚴格比較 |

---

## 7. 技術建議摘要

- 另開 `tools/science/circuit-guided.html` 與 `assets/circuit-guided/`，分層和既有 Guided pilot 相同：model、engine、render、input、script、challenges、persist、analytics、main。
- 共用元件只用 `assets/science-guided/components.js`。
- 保留 `tools/circuit-lab.html` 原樣，作為 Advanced Mode（自由參數探索）。兩頁之間的連結等 rollout 時再決定。
- Model 的核心：
  - 固定端點的接線圖
  - union-find 超節點
  - 先判斷短路與開路，再求解
  - 有理數 nodal solver
  - 電位傳遞處理理想電壓表
  - 由拓樸推導分類
  - 窮舉性質測試
