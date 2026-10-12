# Science Lab 2.0 Component Spec v1.0 final

狀態:Approved(規格層)。這份文件只定義**共用呈現層的 contract**,不含任何實作。
適用站:光學導引站(已實作)與「浮沉與密度」導引站(Pilot #2,待實作)。

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
  stationTitle,
  steps: 固定四項,
  screens: [{ id, headingId, stepId }],
  currentScreen, currentStep,
  focusTargets: string[],               // CSS selector,依優先序
  announcement: null | { id: string, text: string }
}
```

- 插槽:`coach`、`main`、`status`、`action`、`side`。
- 版面:桌機 8:4;手機 DOM 順序固定為 StepNav → Coach → Main → Status → Action → Data,不隨 trial 重排。
- **Announcer:** Shell 內建一個不可見的 `<div class="sg-sr" aria-live="polite" aria-atomic="true">`。
  - 只有 station 提供的 `announcement` 會被寫入。
  - 去重只比較 `id`:相同 `id` 不重寫;**不同 `id` 即使 `text` 相同也要重新朗讀**(實作上先清空再寫入)。
  - `id` 由 station 以事件識別產生(例如 `drop-7`),**不得把次數等去重技巧寫進學生可見的文字**。
- Coach 與 Status 本身都不具 live 語意:視覺元件與朗讀政策分離。
- **焦點交接:** 只在「目前聚焦的元素被鎖定、隱藏、停用,或剛按下的 CTA 消失」時才移動焦點,不搶走正常焦點。移動時依序找 `focusTargets` 中第一個「存在、可見、未 disabled、未標 `data-locked="true"`、可聚焦」的元素。Shell 不理解 phase。

### 3.2 StepNav(A)

- 輸入:`{ steps: [{ id, number, label }], currentStep }`。
- 固定四步:01 接任務 / 02 動手做 / 03 研究手冊 / 04 挑戰題。
- 用 `<ol>` 加 `aria-current="step"`。它是進度指示,不是導航按鈕。

### 3.3 CoachCard(A)

- 輸入:`{ name, main, sub? }`。不含 `mood`。
- 不具 live 語意。

### 3.4 ActionBar(A)

- 輸入:`null | { label, action, enabled }`。
- 同時最多一個主要按鈕;`null` 時隱藏。事件 `onAction(actionId)`。
- 實驗桌上的工具按鈕是 station 的,不是 ActionBar。
- 元件不區分 engine 動作與 UI 狀態動作,由 station 處理。

### 3.5 StatusBar(B)

- 輸入:`{ kind: 'neutral'|'progress'|'success'|'notice'|'warning', icon, text }`。
- 文字與圖示成對,不單靠顏色。不具 live 語意。
- 訊息內容全由 station 提供。

### 3.6 DataCard(B)

```text
{ conditions: [{ label, value, state?: 'normal'|'locked'|'hidden'|'changed' }],
  footerSlots: [...] }
```

`footerSlots` 承載儲存提示、重新開始、進階連結等 station 擁有的次要操作。

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

### 3.9 EvidenceCard(B)

```text
{ items: [{ id, title, rows: [{ label, value }], note? }] }
```

- 回答「剛才觀察到了什麼?」,支援多筆 `rows[]`。
- 不得放理論值。由 station 的 view-model 保證;contract 測試要有一條「fixture 不含理論值欄位」。

### 3.10 ConceptReveal(B)

```text
{ heading?,
  cards: [{ id, title, body[], evidence }],
  formula?: { heading, expression, lines: [{ text, found? }], note? } }
```

- 正式概念與公式必須**連回學生剛才取得的 evidence**。有學生量測值的站,優先使用學生自己的數值;不得只丟一個與前面實驗脫節的理論公式。
- 元件不內建任何公式或名詞。

### 3.11 Notebook(B)

```text
{ evidenceSummary: EvidenceComparisonModel,
  levels: [{ id, title, desc }],
  levelA: { given[], stems: [{ id, legend, options }], nudge? },
  levelB: { prompt, placeholder },
  levelC: { q1, q2, ideas[] },
  ready: boolean }
```

- 事件:`onDraftChange(fields)`、`onFlush(fields)`。
- 元件負責輸入緩衝(300 ms debounce;失焦、`pagehide`、`visibilitychange`、按 CTA 前 flush)、`maxLength` 1000、Level C 的 `ideas` 在學生先寫限制欄之前保持隱藏。
- **元件不得直接寫 localStorage。** sanitize、serialize、storage write 全在 station 的 persistence。
- `ready` 由 station 判斷;Level A 必須與 records 推導的關係一致,不放寬。
- 不得對 B/C 做語意評分。

### 3.12 ChallengeCard(A/B)

```text
{ id, title, scenario, count,
  steps: [{ id, question, options, unlocked, choice, attempts, correct, feedback }],
  note?, allCorrect }
```

一次只顯示一題,答對後鎖定;重試/提示由 station 算好放進 `feedback`;不顯示「答錯了」。

### 3.13 CompletionCard(A)

`{ heading, claims: string[], conclusion?: string[], link?: { href, label } }`。`claims` 最多 3 條,必須是學生真的做過的事,這個保證在 station。

### 3.14 ExperimentBenchShell(C,只定邊界)

只保留:

- 固定比例的容器:切換 phase 不重排、不跳動、不改高度。
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
- **焦點:** 依 3.1 規則,只在失去焦點目標時移動。
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
| 7 | DataCard 混有次要操作 | 用 `footerSlots` |
| 8 | 朗讀目前掛在 Coach 上(`#og-coach-text`) | 移到 Shell announcer;announcement 改為 `{ id, text }` |
| 9 | 狀態文字用「接近」之類語意 | 改用 `progress` |

## 7. Contract 驗證計畫

- 每個元件備兩份 fixture:一份取自光學,一份取自浮沉。
- 驗證同一份 contract 能同時渲染兩站,且 DOM、ARIA、焦點、鎖定狀態符合。
- 強制檢查:
  1. fixture 不含理論值欄位。
  2. CompareCard 的 view-model 不含 `correctAnswer`。
  3. 鎖定的物件鍵盤事件不被 `preventDefault`。
  4. 切換 screen 後焦點落點正確。
  5. 相同文字、不同 `announcement.id` 會重新朗讀;相同 `id` 不重寫。
- 時機:兩站都實作之後、抽取之前。

## 8. 非目標

不做 `science-lab-config.json` 這類宣告式萬用引擎;不抽 state machine、reducer、persist schema、analytics 事件表、拖曳控制器;不統一視覺主題;不修改光學。
