# Science Lab 2.0 Component Spec v1.1(待驗收)

狀態:v1.1 草案,待驗收。這份文件只定義**共用呈現層的 contract**,不含任何實作。
適用站:光學導引站(Pilot #1,`aec25ba`)與「浮沉與密度」導引站(Pilot #2,`8080d14`),兩站皆已實作。
依據:Optics Pilot #1 vs Buoyancy Pilot #2 的 Contract Audit(唯讀,已核准)。
v1.0(`science-guided-component-spec-v1.0.md`)保留為已核准的歷史基準,本文件取代其 contract。

## 0. v1.0 → v1.1 變更

| 編號 | 位置 | 變更 |
|---|---|---|
| F1 | 3.4 ActionBar | `action` 是 station-owned opaque 值,元件不解析;`onAction(action)` 原樣交還;可選 `id?` 只供 DOM/除錯/測試,不取代 action。 |
| F2 | 3.12 ChallengeCard | v1 shared renderer 的選項固定為原生 `<button>`;`onAnswer(stepId, value)` 只由 click / Enter / Space 的明確啟動產生;焦點、Tab、方向鍵、選取移動都不算作答。CompareCard 不受此限,仍可用 radio。 |
| F3 | 3.11 Notebook | 補 `selectedLevel`、`stems[].selectedValue`、B/C 的文字現值、Level C ideas 的顯示狀態;handlers 補 `onLevel`、`onRelation`。ideas 是否顯示改由 station 決定。 |
| F4 | 3.10 ConceptReveal | `cards[].evidence` 統一為 `[{label?, text}]`;公式 `lines` 統一為 `{text, note?, emphasis?}`。 |
| F5 | 3.6 DataCard、3.1 Shell | DataCard 只留 `conditions`,刪除 `footerSlots`;儲存提示、隱私說明、重新開始、進階連結改放 Shell 的選用 `footer` slot,內容由 station 提供。 |
| F6 | 3.1 Shell、第 5 節 | 焦點交接多一個觸發條件:目前焦點元素已從 document 移除;`stationTitle` 明訂為每次 render 重新供應。 |
| F7 | 3.12 ChallengeCard | `note?` 改為結構化選用輸入 `{label, placeholder?, value}`,沿用 Notebook 的緩衝與 flush 規則;storage 仍由 station 處理。 |
| 附 | 3.14 ExperimentBenchShell | 「固定比例容器」改為「穩定的實驗桌幾何」:兩站實作不同(固定高度 / 固定長寬比),共同規則是不得產生非預期的高度跳動。 |
| 附 | 第 6、7 節 | 第 6 節補上 Audit 對 9 項缺口的核對與新增的 Optics debt;第 7 節補上 F1、F2、F3 對應的 contract 檢查。 |

## 1. 原則與邊界

**共用元件只決定「怎麼呈現」,station 決定「什麼是正確」。**

元件形式:`render(viewModel, handlers)`。輸入是純資料,輸出是 DOM 事件。

共用元件**絕對不得包含**:

- 學科公式、答案、判定函式。
- 階段轉場(state transition)。
- 答題對錯與 readiness 判斷。
- persistence schema 與 storage 寫入、analytics 事件表。
- 座標、輸入、drag/drop、renderer、物理。

共用元件**負責**:DOM 結構與 ARIA、可操作/鎖定/作用中的視覺 class、版面、輸入緩衝(debounce/flush 時機)、焦點交接、朗讀(announcer)規則。

## 2. 命名與分級

CSS 前綴:`sg-`(Science Guided),與未來 `assets/science-guided/` 一致。規格階段不改任何 CSS。

```text
sg-shell  sg-step-nav  sg-coach  sg-status  sg-action  sg-data
sg-evidence  sg-compare  sg-concept  sg-notebook  sg-challenge
sg-completion  sg-bench  sg-sr
sg-direct-manipulation  sg-scroll-surface
```

| 級別 | 意義 |
|---|---|
| A | 兩站契約相同,可直接共用 |
| B | 共用外殼,內容由 station 的 view-model 提供 |
| C | 只定義界線,不抽程式 |

抽取規則:光學與浮沉兩站都實作並通過同一份 contract 測試之前,不抽任何程式,不回頭重構已完成的站。

元件數量:**13 個 UI Component + 1 個非 UI 的 `EvidenceComparisonModel`**。

## 3. 元件 Contract

### 3.1 GuidedLabShell(A)

```text
{
  stationTitle,                         // 每次 render 重新供應;可隨 screen/phase 改變(例如命名前後)
  steps: 固定四項,
  screens: [{ id, headingId, stepId }],
  currentScreen, currentStep,
  focusTargets: string[],               // CSS selector,依優先序
  announcement: null | { id: string, text: string }
}
```

- 插槽:`coach`、`main`、`status`、`action`、`side`,以及選用的 `footer`。
- **`footer`(選用):** 放儲存提示、隱私說明、重新開始、進階連結等「不屬於目前實驗條件」的 station 內容。內容由 station 提供;Shell 只負責位置與 landmark,**不定義通用的 note/link/action 項目模型**。
- 版面:桌機 8:4;手機 DOM 順序固定為 StepNav → Coach → Main → Status → Action → Data(`side`),`footer` 在最後,不隨 trial 重排。
- **Announcer:** Shell 內建一個不可見的 `<div class="sg-sr" aria-live="polite" aria-atomic="true">`。
  - 只有 station 提供的 `announcement` 會被寫入。
  - 去重只比較 `id`:相同 `id` 不重寫;**不同 `id` 即使 `text` 相同也要重新朗讀**(實作上先清空再寫入)。
  - `id` 由 station 以事件識別產生(例如 `drop-7`),**不得把次數等去重技巧寫進學生可見的文字**。
- Coach 與 Status 本身都不具 live 語意:視覺元件與朗讀政策分離。
- **焦點交接:** 只在下列情況才移動焦點,不搶走正常焦點:目前聚焦的元素(1)被鎖定、(2)被隱藏、(3)被停用、(4)**已從 document 移除**(例如卡片因結構改變被重建),或(5)剛按下的 CTA 消失。移動時依序找 `focusTargets` 中第一個「存在、可見、未 disabled、未標 `data-locked="true"`、可聚焦」的元素。Shell 不理解 phase。

### 3.2 StepNav(A)

- 輸入:`{ steps: [{ id, number, label }], currentStep }`。
- 固定四步:01 接任務 / 02 動手做 / 03 研究手冊 / 04 挑戰題。
- 用 `<ol>` 加 `aria-current="step"`。它是進度指示,不是導航按鈕。

### 3.3 CoachCard(A)

- 輸入:`{ name, main, sub? }`。不含 `mood`。
- 不具 live 語意。

### 3.4 ActionBar(A)

- 輸入:`null | { label, action, enabled, id? }`。
- **`action` 是 station-owned 的 opaque 值**(字串、物件皆可):元件不解析、不序列化、不比較內容。事件 `onAction(action)` 把**同一個值原樣交還** station。
- `id?: string` 只供 DOM 屬性、除錯與測試使用,**不取代 `action`**。
- 同時最多一個主要按鈕;`null` 時隱藏。
- 實驗桌上的工具按鈕是 station 的,不是 ActionBar。
- 元件不區分 engine 動作與 UI 狀態動作,由 station 處理。

### 3.5 StatusBar(B)

- 輸入:`{ kind: 'neutral'|'progress'|'success'|'notice'|'warning', icon, text }`。
- 文字與圖示成對,不單靠顏色。不具 live 語意。
- 訊息內容全由 station 提供。

### 3.6 DataCard(B)

```text
{ conditions: [{ label, value, state?: 'normal'|'locked'|'hidden'|'changed' }] }
```

- DataCard **只回答「現在實驗條件是什麼」**。
- 儲存提示、隱私說明、重新開始、進階連結不屬於這張卡,放在 Shell 的 `footer`(見 3.1)。

### 3.7 EvidenceComparisonModel(非 UI 的共用資料模型)

```text
EvidenceComparisonModel = {
  independentVariable?: { label, from, to },
  controlledVariables?: [{ label, value }],
  observedResponse: [{ label, first, second }],     // 必填,兩次實驗的比較
  procedureNote?: string
}
```

CompareCard 與 Notebook 都引用它,彼此不互相依賴。

### 3.8 CompareCard(B)

```text
CompareCard = EvidenceComparisonModel + {
  notice?: { kind: 'ok'|'warn'|'info', text },
  questions: [{
    id, text,
    options: [{ value, label }],
    selectedValue?: string | null,
    disabled?: boolean,
    feedback?: { kind: 'neutral'|'nudge'|'success', text }
  }]
}
```

- **沒有 `correctAnswer`。** 答案只在 station 的 engine。
- 事件:`onAnswer(questionId, value)`。
- 元件不判斷對錯,只顯示 station 給的 `feedback`。
- CompareCard 沒有 attempts,可使用 radio;ChallengeCard 的明確啟動規則(3.12)不適用於它。

### 3.9 EvidenceCard(B)

```text
{ items: [{ id, title, rows: [{ label, value }], note? }] }
```

- 回答「剛才觀察到了什麼?」,支援多筆 `rows[]`。
- 不得放理論值。由 station 的 view-model 保證;contract 測試要有一條「fixture 不含理論值欄位」。

### 3.10 ConceptReveal(B)

```text
{ heading?,
  cards: [{ id, title, body[], evidence: [{ label?, text }] }],
  formula?: { heading, expression,
              lines: [{ text, note?: string, emphasis?: boolean }],
              note? } }
```

- 正式概念與公式必須**連回學生剛才取得的 evidence**。有學生量測值的站,優先使用學生自己的數值;不得只丟一個與前面實驗脫節的理論公式。
- `evidence` 一律是行陣列;只有一行的站只放一項。
- `lines[].note` 是附在該行下方的說明(例如「你找到 15 cm」);`emphasis` 只表示強調這一行,不帶文字。
- 元件不內建任何公式或名詞。

### 3.11 Notebook(B)

```text
{ evidenceSummary: EvidenceComparisonModel,
  levels: [{ id, title, desc }],
  selectedLevel: null | 'A' | 'B' | 'C',
  levelA: { given[],
            stems: [{ id, legend, options: [{ value, label }], selectedValue: null | string }],
            nudge? },
  levelB: { prompt, placeholder?, value },
  levelC: { q1: { label, value }, q2: { label, value },
            ideas: { heading, items[], visible: boolean } },
  ready: boolean }
```

- 事件:`onLevel(levelId)`、`onRelation(stemId, value)`、`onDraftChange(fields)`、`onFlush(fields)`。文字欄位的鍵固定為 `freeText`(Level B)、`evidenceText`、`limitationText`(Level C)。
- 元件負責輸入緩衝(300 ms debounce;失焦、`pagehide`、`visibilitychange`、按 CTA 前 flush)、`maxLength` 1000。
- **畫面完全由 view-model 重建**:`selectedLevel`、各 stem 的 `selectedValue`、各文字欄位的 `value` 讓還原後的畫面可由資料重畫。使用者正在輸入或有尚未送出的緩衝時,元件**不得**用較舊的 `value` 覆寫文字框。
- **Level C ideas 是否顯示由 station 以 `ideas.visible` 決定**(例如先寫過限制才顯示);元件不再自己判斷門檻。
- **元件不得直接寫 localStorage。** sanitize、serialize、storage write 全在 station 的 persistence。
- `ready` 由 station 判斷;Level A 必須與 records 推導的關係一致,不放寬。
- 不得對 B/C 做語意評分。

### 3.12 ChallengeCard(A/B)

```text
{ id, title, scenario, count,
  steps: [{ id, question, options: [{ value, label }], unlocked, choice, attempts, correct, feedback }],
  note?: { label, placeholder?, value },
  allCorrect }
```

- 一次只顯示一題;只畫出已解鎖的 step;答對的 step 鎖定;重試/提示由 station 算好放進 `feedback`;不顯示「答錯了」。
- **互動語意(v1 shared renderer):**
  - 選項固定為原生 `<button type="button">`。
  - `onAnswer(stepId, value)` **只能由 click / Enter / Space 的明確啟動產生**;焦點移動、Tab、方向鍵、選取移動都不得觸發,也不算一次 attempt。
  - 已鎖定的 step 再按不觸發。
  - 答對或結構改變而使焦點元素消失時,依 3.1 的焦點規則交接。
  - (CompareCard 沒有 attempts,仍可使用 radio。)
- `note`(選用):結構化的自由輸入。沿用 Notebook 的緩衝與 flush 規則(300 ms debounce;失焦、`pagehide`、`visibilitychange`、按 CTA 前 flush;`maxLength` 1000),事件 `onNoteDraft(text)`、`onNoteFlush(text)`;元件不寫 storage。station 沒有 note 時不提供此欄。

### 3.13 CompletionCard(A)

`{ heading, claims: string[], conclusion?: string[], link?: { href, label } }`。`claims` 最多 3 條,必須是學生真的做過的事,這個保證在 station。

### 3.14 ExperimentBenchShell(C,只定邊界)

只保留:

- **穩定的實驗桌幾何**:切換 trial / phase 時不得產生非預期的高度跳動或重排。station 可採固定高度,或固定長寬比。
- 操作狀態 class:`is-operable` / `is-locked` / `is-active`。
- hit-layer slot(目標桌機 ≥48 px,手機建議 ≥64 px)、status slot。
- ARIA 命名規則:每個可操作物件有名稱與目前狀態描述。
- 行為 utility class:

  ```css
  .sg-direct-manipulation { touch-action: none; }
  .sg-scroll-surface      { touch-action: pan-y; }
  ```

  由 station 決定套在哪個元素,Shell 不判斷哪些元素可拖曳。

明確不抽:座標與 snap、拖曳/放下/選取控制器、renderer、物理。

## 4. 層級邊界

| 層 | 共用? |
|---|---|
| UI 外殼與 DOM 結構、`EvidenceComparisonModel` | 共用 |
| 實驗桌容器、狀態 class、ARIA/hit slot、行為 utility class | 共用(最小) |
| 座標、輸入、drag/drop、renderer | 留 station |
| 科學 model / 公式 / 判定 | 留 station,絕不共用 |
| state machine / reducer / 轉場 | 留 station |
| 教學腳本 | 留 station |
| persistence schema 與 storage 寫入 | 留 station |
| analytics 事件表 | 留 station |

v1.0 級別:GuidedLabShell A、StepNav A、CoachCard A、ActionBar A、CompletionCard A、StatusBar B、DataCard B、EvidenceCard B、CompareCard B、ConceptReveal B、Notebook B、ChallengeCard A/B、ExperimentBenchShell C。

## 5. 跨元件規則

- **朗讀:** 整頁只有 Shell 的 announcer 是 live region;Coach、Status 都不是。
- **焦點:** 依 3.1 規則,只在失去焦點目標時移動(含「焦點元素已被移除」)。
- **目標尺寸:** 桌機 ≥48 px;手機建議 ≥64 px。
- **reduced motion:** 沿用既有行為。
- **版面不跳動:** 切換 trial 時實驗桌高度固定。
- **鍵盤:** 鎖定的物件鍵盤事件不被 `preventDefault`。
- **文字上限:** 輸入欄 `maxLength` 1000 由元件設定;資料清理仍在 station 的 persist 層。
- **axe:** 共用 token 必須維持光學已通過的標準(390/1280)。

## 6. 光學對 contract 的缺口(給將來遷移,不在目前階段修)

| # | 現況 | 遷移方式 |
|---|---|---|
| 1 | StepNav 是無行為的 `<button>` | 改 `<ol>` |
| 2 | 證據是一句話字串 | 轉換層,或 `script.js` 多輸出 `rows` |
| 3 | Compare 用 `changedVariables` 與 `single/multiple/none` | 轉換層,警示改 `notice` |
| 4 | Compare 選項是 `[value, label]` 元組 | 改成 `{ value, label }` |
| 5 | Notebook Level A 固定兩個題幹 | 泛化為 `stems[]` |
| 6 | 公式區塊的 `negativeNote` | 改名 `note` |
| 7 | DataCard 混有次要操作 | 改放 Shell 的 `footer`(v1.1,見 3.1) |
| 8 | 朗讀目前掛在 Coach 上(`#og-coach-text`) | 移到 Shell announcer;announcement 改為 `{ id, text }` |
| 9 | 狀態文字用「接近」之類語意 | 改用 `progress` |

### 6.1 Contract Audit 對上表的核對(Optics `aec25ba`)

| # | 結果 |
|---|---|
| 1 StepNav button | 仍成立 |
| 2 Evidence 字串 | 仍成立(且放在 DataCard 內) |
| 3 Compare 的 changedVariables | 部分轉換:script 已產出 `notice{kind,text}`,rows 仍是扁平,沒有 independent/controlled |
| 4 tuple options | 仍成立(Compare、Notebook A、Challenge) |
| 5 Notebook Level A 固定兩題 | 仍成立 |
| 6 negativeNote | 仍成立 |
| 7 DataCard 混有次要操作 | 仍成立(儲存提示、重新開始、進階連結) |
| 8 朗讀掛在 Coach | 仍成立 |
| 9 狀態文字用「接近」 | 已變形:現為清晰度 1–4 的 icon+文字,沒有 `kind` 欄位 |

Audit 新增的 Optics 遷移項目:手機命中區未達 64 px(CSS 44 / JS 48);Challenge 以 radio `change` 作答;焦點交接目標寫死;Challenge 3 筆記的緩衝寫在 `main.js`;沒有 announcer;完成畫面沒有 claims。以上都是遷移工作,不修改本 spec。

## 7. Contract 驗證計畫

- 每個元件備兩份 fixture:一份取自光學,一份取自浮沉。
- 驗證同一份 contract 能同時渲染兩站,且 DOM、ARIA、焦點、鎖定狀態符合。
- 強制檢查:
  1. fixture 不含理論值欄位。
  2. CompareCard 的 view-model 不含 `correctAnswer`。
  3. 鎖定的物件鍵盤事件不被 `preventDefault`。
  4. 切換 screen 後焦點落點正確。
  5. 相同文字、不同 `announcement.id` 會重新朗讀;相同 `id` 不重寫。
  6. ActionBar:`onAction` 交還的是傳入的**同一個** `action` 值(字串與物件各一份 fixture)。
  7. ChallengeCard:焦點移動、Tab、方向鍵不呼叫 `onAnswer`;一次 click / Enter / Space 恰好呼叫一次;已鎖定的 step 不呼叫。
  8. Notebook:僅憑 view-model(含 `selectedLevel`、`selectedValue`、`value`、`ideas.visible`)即可重建畫面;正在輸入時不被舊 `value` 覆寫。
  9. 焦點交接:焦點元素被重建移除時,移到 `focusTargets` 的第一個可用目標。
- 時機:兩站都實作之後、抽取之前。

## 8. 非目標

不做 `science-lab-config.json` 這類宣告式萬用引擎;不抽 state machine、reducer、persist schema、analytics 事件表、拖曳控制器;不統一視覺主題;不修改光學。
