# Pilot #2 Prototype Technical Spec v1.0 final

狀態:Approved。這是「浮沉與密度」導引站原型的實作規格來源。教材內容見 `buoyancy-guided-spec-v1.1.md`,共用呈現層 contract 見 `science-guided-component-spec-v1.0.md`。

## 0. 已定案事項與勘誤(final errata)

1. `mission` 不自動轉場。流程:`welcome --START--> mission --BEGIN--> trial1-test`,CTA「動手試試看」。
2. Completion 三條見 `buoyancy-guided-spec-v1.1.md` 第 12 節。
3. 分支策略:B1 開始時從**當時最新的 `main`** 開全新分支與獨立 Draft PR。禁止堆疊在光學原型的 PR 上,禁止修改光學原型(`optics-guided`)。
4. 配重格數:**質量 = 40 + 20 × 格數**;水中 100 g = **3 格**;濃鹽水中 120 g = **4 格**。(早先 Spec v1.1 草稿的「5 格 / 6 格」是錯的,以本文件為準。)
5. **Physics-derived quantity 責任邊界:**
   - density、relation、outcome、**raw `immersionFraction`**、停住質量,全部由 `model.js` / `engine.js` 派生。
   - `model.js` **只輸出 raw `immersionFraction`**,不輸出 `immersionPercent`。
   - 顯示用的 `immersionPercent`(四捨五入並夾在 1–99,漂浮永不顯示 100%)是顯示規則,由 `engine.deriveView().facts` 從 raw fraction 派生。
   - `script.js` 只格式化 engine 提供的 facts,例如「約 83% 在水面下」。**script 禁止自己做** `Math.round(fraction * 100)`、`mass / volume`、密度比較、immersion 計算、outcome 判定。
   - `script.js` **不 import `model.js`**。液體與物件的顯示名稱用 script 自己的 id→標籤對照表。
   - Concept / Evidence / Compare 需要的 `100÷100=1.0`、`120÷100=1.2`、`300÷500=0.6`、`120÷40=3.0`,數值先由 model/engine 產生(`facts`),再交給 script 呈現。
6. **model 的液體 truth source 包含三種:** `oil` 0.92、`water` 1.00、`brine` 1.20(g/cm³)。**Guided 主流程 engine 只允許 `water` / `brine`**;`oil` 只給 Challenge C1 使用。0.92 只有 `model.js` 這一個來源,`challenges.js` 不得另外硬編。
7. **Announcer:** `announcement: null | { id: string, text: string }`。去重只比較 `id`;不同事件即使 `text` 相同也要朗讀。禁止把「第 N 次」之類寫進學生文案來繞過去重。同步視為 Component Spec 的小型 erratum(已寫入該文件)。`id` 由 engine 的 `state.seq` 產生;`seq` **只在 reducer 真正產生離散 announcement 事件時增加**,不得因 render 或 `deriveView` 增加,reducer 保持 deterministic;`seq` 不存檔。
8. **Persistence 為逐層 checkpoint validation**,上游無效時下游一律丟棄(見第 14 節)。
9. 待決事項 O1–O3 已解決並刪除;O4–O10 保留為 implementation risks(第 21 節)。

## 1. Architecture

```text
model.js      純物理:密度、浮沉判定、raw 浸入分數。無 DOM、無 state、無文字。
engine.js     唯一的真相與 state:pure reducer。不信 UI。派生 facts(含 immersionPercent)。
challenges.js 挑戰題資料與判定(挑戰 C1 的油取自 model 的 LIQUIDS)。
script.js     view-model:教練訊息、CTA、各卡片資料。無 DOM,不 import model。
visual.js     純函式:由 view 算出位置與水線。不判定物理。
render.js     DOM/SVG 繪製與命中層。
input.js      拖進水槽、點擊、鍵盤。不判定物理。
persist.js    序列化與還原。還原時用 engine/model 重建驗證。
analytics.js  匿名里程碑。
main.js       串接。
```

單向依賴:`model ← engine ← script ← main`;`visual`、`render`、`input` 只讀 engine 的 `deriveView` 結果。

責任邊界:physics 只在 `model.js`;真相與 state 只在 `engine.js`;學生看到的文字只在 `script.js`;storage 只在 `persist.js`;analytics 詞彙只在 `analytics.js`。

CSS 前綴:原型先用 `bg-`(buoyancy guided),抽取時再統一改 `sg-`。

不建立 `assets/science-guided/`,不複製或實作 shared component,不碰 optics-guided。view-model 的形狀必須符合 Component Spec contract,讓日後抽取是機械式的。

## 2. File layout

```text
tools/science/buoyancy-guided.html

assets/buoyancy-guided/
  package.json                 {"type":"module"}
  model.js  engine.js  challenges.js
  script.js  visual.js  render.js
  input.js  persist.js  analytics.js  main.js
  buoyancy-guided.css          (不另建 input.css)

scripts/
  test_buoyancy_guided_{model,engine,input,visual,script,persist,analytics,site}.mjs
  check_buoyancy_guided_{input,view,flow}_browser.cjs
  buoyancy_guided_test_support.cjs     複製光學 support 的內容,不 import 光學檔案
```

## 3. Physics model(`model.js`)

常數(單一 truth source,`Object.freeze`):

```text
LIQUIDS = { oil:{id,density:0.92}, water:{id,density:1.00}, brine:{id,density:1.20} }   g/cm³
BLOCK   = { volumeCm3:100, shellMassG:40, ballastStepG:20, slotsMin:0, slotsMax:6 }
TRIAL3  = { wood:{massG:300, volumeCm3:500}, stone:{massG:120, volumeCm3:40} }
DENSITY_EPSILON = 1e-9
```

最小 API:

```text
density({massG, volumeCm3})
relation(objectDensity, liquidDensity)                → 'lighter' | 'equal' | 'heavier'
outcomeIn({massG, volumeCm3, liquidDensity})          → { objectDensity, liquidDensity, relation,
                                                          outcome: 'float'|'stay'|'sink',
                                                          immersionFraction: number|null }
blockMassG(slots)                                     → 40 + 20×slots
blockOutcome({slots, liquidId})
objectOutcome({objectId, liquidId})
```

定義:

1. 物體密度 = 質量 ÷ 體積。
2. `d = ρ物 − ρ液`:`d < −ε` → lighter;`|d| ≤ ε` → equal;`d > ε` → heavier。
3. lighter → `float`,`immersionFraction = ρ物 ÷ ρ液`,範圍 (0, 1)。
4. equal → `stay`,`immersionFraction = null`。
5. heavier → `sink`,`immersionFraction = null`。
6. model **不產生** `immersionPercent`、顯示文字、中文 label、CSS class、動畫參數。

數值容差:禁止用 `===` 比較浮點數,一律走 `relation()`。`ε = 1e-9`(絕對,g/cm³)。

輸入驗證(fail-fast,拋 `RangeError`,不 silent clamp):NaN、±Infinity、質量 ≤ 0、體積 ≤ 0、液體密度 ≤ 0、`slots` 非整數或超出 0–6、未知 `liquidId`、未知 `objectId`。

單一來源:`density`、`outcomeIn`、`relation` 與 immersion 的計算只能出現在 `model.js`、`engine.js` 與測試。

## 4. 數值驗算

水(1.00):

| 格數 | 質量 | ρ物 | 結果 | raw 浸入 |
|---|---|---|---|---|
| 0 | 40 g | 0.4 | float | 0.4 |
| 1 | 60 g | 0.6 | float | 0.6 |
| 2 | 80 g | 0.8 | float | 0.8 |
| 3 | 100 g | 1.0 | **stay** | null |
| 4 | 120 g | 1.2 | sink | null |
| 5 | 140 g | 1.4 | sink | null |
| 6 | 160 g | 1.6 | sink | null |

濃鹽水(1.20):

| 格數 | 質量 | ρ物 | 結果 | raw 浸入 |
|---|---|---|---|---|
| 0 | 40 g | 0.4 | float | 1/3 |
| 1 | 60 g | 0.6 | float | 0.5 |
| 2 | 80 g | 0.8 | float | 2/3 |
| 3 | 100 g | 1.0 | float | 5/6 |
| 4 | 120 g | 1.2 | **stay** | null |
| 5 | 140 g | 1.4 | sink | null |
| 6 | 160 g | 1.6 | sink | null |

Trial 3(水):木塊 300÷500 = 0.6 → float,0.6;石頭 120÷40 = 3.0 → sink。
Challenge:C1 100 g/100 cm³(ρ 1.0)在油(0.92)→ sink;C2 80 g 方塊水中 0.8、濃鹽水中 2/3(顯示 67%)。

## 5. State machine(`engine.js`)

介面:`reduce(state, action) → { state, events, transitions, accepted }`,純函式,不改輸入 state。

Phases(18):`welcome, mission, trial1-test, trial1-complete, trial1-recorded, trial2-switch-liquid, trial2-test, trial2-complete, trial2-recorded, compare, trial3-drop, trial3-observed, concept, notebook, challenge-1, challenge-2, challenge-3, complete`

State 主要欄位:`phase, liquidId, slots, tank:{objectId|null}, dropCount, failedDrops, records:{1,2,3}, trial2:{firstDrop}, trial3:{tried:{wood,stone}}, compare, conclusion, challenges, seq`。

共通規則:水槽最多一個物件;配重與液體只能在水槽為空時改;結果永遠由 model 在 engine 內算出,**不接受 UI 傳來的 density/outcome/immersion**;engine 主流程只允許 `water`/`brine`。

| Phase | 可執行 | 自動轉場 | CTA 轉場 | 寫入 | 鎖定 |
|---|---|---|---|---|---|
| `welcome` | START | — | START → mission | — | 全部 |
| `mission` | BEGIN | — | **BEGIN → trial1-test** | 初始化:水、1 格、方塊在桌上 | 全部 |
| `trial1-test` | ADD/REMOVE_BALLAST、PUT_IN(block)、TAKE_OUT | 放入後 `stay` → trial1-complete | — | dropCount、failedDrops | 液體 |
| `trial1-complete` | 同上 | — | RECORD_TRIAL → trial1-recorded | record1 | 液體 |
| `trial1-recorded` | — | → trial2-switch-liquid | — | 方塊回到桌上 | 全部 |
| `trial2-switch-liquid` | SELECT_LIQUID、PUT_IN(block) | 在濃鹽水放入 → trial2-test | — | trial2.firstDrop | 配重 |
| `trial2-test` | ADD/REMOVE_BALLAST、PUT_IN、TAKE_OUT | 放入後 `stay` → trial2-complete | — | dropCount | 液體 |
| `trial2-complete` | 同上 | — | RECORD_TRIAL → trial2-recorded | record2 | 液體 |
| `trial2-recorded` | — | — | CONTINUE → compare | — | 全部 |
| `compare` | ANSWER_COMPARE | — | CONTINUE(全部符合證據)→ trial3-drop | 答案 | 實驗桌 |
| `trial3-drop` | PUT_IN(wood\|stone)、TAKE_OUT | 兩者都放過 → trial3-observed | — | trial3.tried | 配重、液體(自動換回水) |
| `trial3-observed` | — | — | CONTINUE → concept | record3 | 全部 |
| `concept` | — | — | CONTINUE → notebook | — | — |
| `notebook` | SAVE_CONCLUSION | — | CONTINUE(Level A 與 records 推導一致,或 B/C 已完成)→ challenge-1 | conclusion | — |
| `challenge-1/2/3` | ANSWER_CHALLENGE | — | CONTINUE(該題全部答對)→ 下一個 / complete | answers | 已答對的步驟 |
| `complete` | RESTART | — | — | — | — |

動作與拒絕理由:

| 動作 | 前置條件 | 拒絕理由 |
|---|---|---|
| START / BEGIN / CONTINUE | phase 與閘門符合 | `wrong-phase` / `locked` |
| ADD_BALLAST / REMOVE_BALLAST | phase 允許、水槽為空、0–6 | `wrong-phase` / `object-in-tank` / `out-of-range` |
| SELECT_LIQUID {liquidId} | `trial2-switch-liquid` 且水槽為空,liquidId ∈ {water, brine} | `wrong-phase` / `object-in-tank` / `invalid` |
| PUT_IN {objectId} | 該 phase 允許該物件、水槽為空、(trial2-switch-liquid)必須在濃鹽水 | `wrong-phase` / `object-in-tank` / `invalid` / `wrong-liquid` |
| TAKE_OUT | 水槽裡有物件 | `object-on-table` |
| RECORD_TRIAL {trial} | 對應 phase、方塊在水槽、**engine 用 model 重算**為 `stay` | `wrong-phase` / `not-stay` / `invalid` |
| ANSWER_COMPARE / SAVE_CONCLUSION / ANSWER_CHALLENGE | 同光學慣例 | `wrong-phase` / `invalid` / `locked` |
| RESTART | 任何 phase | — |
| 其他 | — | `unknown-action` |

- `RECORD_TRIAL`:即使 UI 在不是「停在液體中」時送出也被拒,因為 engine 從 `tank`、`slots`、`liquidId` 重算。
- Trial 2:先換液體;第一次放入必須用 Trial 1 的格數(配重鎖定,格數 = record1.slots);放入後才解鎖配重。
- Trial 3:wood 與 stone 各至少真正 `PUT_IN` 一次才轉場;重複放入不多算也不報錯。
- `*-complete` 階段仍允許 TAKE_OUT 與調配重;記錄按鈕只在方塊目前在水槽且重算為 `stay` 時啟用;轉場只往前。
- 提示(只講現象,絕不說出 100/120):連續兩次放入都不是 `stay` → 提示一(看看方塊在水裡的位置);第三次 → 提示二(浮起來試試增加質量,沉下去試試減少質量);第五次 → 提示三(每次只改一格再放進去)。計數器隨 trial 重設。
- `state.seq`:只在 reducer 產生會朗讀的離散事件時加一;`deriveView` 純讀取,不改 state。

`deriveView(state)` 提供 `facts`:每筆 record 的質量、密度、outcome、raw `immersionFraction`、**`immersionPercent`**;concept 用的四組比值;compare 用的質量與結果。

## 6. Records

只存操作事實,結果與數值全部派生:

```text
record1 = { trial:1, liquidId:'water', slots, dropCount, recentDrops:[{slots, liquidId}] }
record2 = { trial:2, liquidId:'brine', slots, firstDrop:{slots, liquidId}, dropCount, recentDrops,
            independentVariable:'liquid' }
record3 = { trial:3, liquidId:'water', tried:{wood:true, stone:true} }
```

- 派生(從不存):質量、密度、outcome、immersion。
- identity:record1 的 `slots` 必須等於水中停住格數(3);record2 等於濃鹽水停住格數(4),且 `firstDrop.slots` 等於 record1.slots。
- dropLog 策略:不存完整歷史。每個 trial 只存 `dropCount`(整數,上限 999)與 `recentDrops`(最多 8 筆,先進先出);record2 另存 `firstDrop`。
- 學生 EvidenceCard 看到:液體、停住質量、最近幾筆放入的結果與浸入百分比、Trial 3 的標籤與結果。不顯示任何密度數值直到 concept。

## 7. Input

不複製光學的一維 snap 控制器。

- 互動元件:方塊命中層(`button`,可拖也可點)、水槽命中區(放下區域,不可聚焦)、配重「−」「+」與「放入水中」「拿出來」(原生 `button`)、液體 `radio`、Trial 3 貨架卡(各自有放入/拿出按鈕與可拖的命中層)。
- 滑鼠/觸控:方塊可拖進水槽,放開時在水槽區內 → `PUT_IN`;在區外 → 彈回並顯示中性提示「要放進水槽裡才有結果」,不派發動作。水槽內的物件拖出並放開 → `TAKE_OUT`。拖曳不是唯一方式,點擊方塊命中層本身等於切換放入/拿出。
- 拖曳判定:移動超過 3 px 才算拖曳;拖曳後抑制隨後的 click。使用 pointer capture(特性偵測)。
- 命中層尺寸:桌機 ≥48 px,手機(≤767 px)≥64 px。可操作的方塊命中層 `touch-action: none`;鎖定時不設,維持實驗桌的 `pan-y`。
- 沒有 snap。學生不控制水中深度,所有放入的終點位置由 visual 決定。
- 鍵盤:方塊與貨架物件 Enter/Space 放入或拿出;配重、液體、工具按鈕都是原生控制項。鎖定的控制項**不呼叫 `preventDefault`**。
- 鎖定表現:`aria-disabled="true"` + `data-locked="true"`,視覺上不再像可拖,指標事件被忽略。
- 焦點:只在目前聚焦元素被鎖定/隱藏/停用,或剛按下的 CTA 消失時才移動;順序為目前可用的物件命中層 → CTA → 該 screen 標題。

## 8. Visual / render

`visual.js` 為純函式,只讀 view,不重新判定物理:`poseFor({objectId, where, outcome, immersionFraction})` → `{x, y, w, h, waterlineY|null, contact}`;`layout()`。動畫只是舊 pose 到新 pose 的補間,不是判定;reduced motion 直接顯示終態。

- viewBox 750×420,SVG 圖形(不引用圖檔);液面 Y 固定,不隨放入物體升高(理想化)。
- 方塊邊長以 ∛體積縮放(方塊約 70 px、木塊約 120 px、石頭約 52 px)。
- 配重指示:方塊內部 6 個小格,填滿 `slots` 個;**方塊外形與格數無關**。
- 不變量(單元測試強制):
  1. float:頂端在液面之上,水線位置嚴格由 `immersionFraction` 線性決定,83% 的水線比 60% 更靠近方塊頂端;不整顆出水、不整顆沒入。
  2. stay:完全浸沒,頂端低於液面至少 12 px,底部離槽底至少 24 px,不像沉底。
  3. sink:底部正好貼著槽底(`contact = true`)。
  4. 在桌上時:固定在桌面,不在水槽範圍內。
- 濃鹽水顏色略深並有文字標籤,不單靠顏色。天平顯示「質量 N g」。

## 9. Script / view-model(`script.js`)

輸出形狀對齊 Component Spec contract:

| 函式 | 對應 contract |
|---|---|
| `MESSAGES`、`reduceCoach` | CoachCard(`{ name, main, sub? }`) |
| `screenFor`、`stepFor`、`ctaFor` | GuidedLabShell / StepNav / ActionBar |
| `statusModel(view)` | StatusBar |
| `dataModel` | DataCard |
| `evidenceModel` | EvidenceCard |
| `compareModel` | CompareCard(`EvidenceComparisonModel + notice + questions`) |
| `conceptModel` | ConceptReveal |
| `notebookModel` | Notebook(含 `evidenceSummary`) |
| `challengeModel` | ChallengeCard |
| `completeModel` | CompletionCard |
| `announcement(result)` | `null | { id, text }` |

- Concept 之前學生可見字串一律不得含:密度、漂浮、懸浮、下沉、浮力、受力、排開、阿基米德、相對密度。現象一律用「浮起來 / 停在液體中 / 沉到底 / 水面下約 N%」。「質量」「體積」「g」「cm³」允許。
- 洩漏防護:單元測試列舉所有 pre-concept 的 `MESSAGES`、提示、狀態文字、aria 標籤;瀏覽器測試在每個 pre-concept phase 掃描整頁 `innerText` 與所有 `aria-label`。
- 朗讀:只有 Shell 式 announcer 是 `aria-live="polite" aria-atomic="true"`;Coach、Status 不是。只對離散事件更新;不同事件即使文字相同也要朗讀。

## 10. Compare

```text
independentVariable: { label:'液體', from:'水', to:'濃鹽水' }
controlledVariables: [ {label:'方塊體積', value:'100 cm³'}, {label:'放入方式', value:'相同'},
                       {label:'判定', value:'停在液體中'} ]
observedResponse: [
  { label:`原本 ${m1} g 的方塊`,   first:'停在水中', second:`浮起來(約 ${pct}%)` },
  { label:'讓方塊停住所需質量',    first:`${m1} g`,  second:`${m2} g` }
]
procedureNote: '先只換液體,再用相同方法重新測量。'
notice: { kind:'info', text:'這次改的是液體;其他條件保持相同。' }
```

所有數字來自學生的 records 經 engine facts;view-model **不含 `correctAnswer`**,只含 `selectedValue`、`disabled`、`feedback`。對錯在 engine。

## 11. Concept

由 records 與 engine facts 產生,不把學生證據寫死在 HTML。數字:停住質量 ÷ 100 = 1.0 / 1.2;300 ÷ 500 = 0.6;120 ÷ 40 = 3.0,由 engine facts 提供,script 只格式化。先卡片(密度、三種結果),再公式 `ρ = m ÷ V` 緊貼學生的數字;不描述受力。

## 12. Notebook

- Level A(engine 把關):`relationLiquid`(更大/更小/一樣,期望值由 record2 與 record1 的停住質量比較得出)、`relationWood`(質量/體積/密度,期望值由 record3 合法性與 concept 數字得出,幾乎是常數,見 O7);`given` 兩句由 records 填入。選錯 → CTA disabled、`CONTINUE` 被 engine 拒絕。
- Level B:≥2 字。Level C:證據欄 + 限制欄各 ≥2 字;limitation ideas 在學生先寫限制後展開。上限 1000 字。
- 元件只負責 `onDraftChange` / `onFlush` 的緩衝;sanitize、serialize、storage write 全在 `persist.js`。

## 13. Challenges(`challenges.js`)

規則:不顯示「答錯」。第一次答錯給通用「剛才哪個結果變得更明顯?」;第二次起給提示;答對後鎖定;選項順序固定;`judgeChallenge(id, step, choice)` → `true | false | null`。油的密度取自 `model.js` 的 `LIQUIDS.oil`。

| 題 | 步驟 | 選項 | 正確 |
|---|---|---|---|
| C1 食用油 | `c1-outcome` | 浮起來 / 停在液體中 / 沉到底 | 沉到底 |
| C2 80 g/100 cm³ | `c2-where` | 整顆在水面上 / 約 80% 在水面下 / 停在水中 / 沉到底 | 約 80% 在水面下 |
| | `c2-brine` | 變大 / 變小 / 不變 | 變小 |
| C3 鋁箔船 | `c3-reason` | ①質量變小 ②鋁箔和裡面的空氣一起占了更大的整體體積,同樣的質量分布在更大的體積中,所以整體平均密度變小 ③水只會托住船形的東西 ④東西攤得越開就越會浮 | ② |

回饋與提示文字見 `buoyancy-guided-spec-v1.1.md` 第 11 節。

## 14. Persistence(`persist.js`)

Key:`bhcs-buoyancy-guided:v1`(不碰 legacy 頁與光學的 key)。

serialize 存:`v:1`、records(第 6 節的最小事實)、compare 答案、conclusion(文字截到 1000)、challenges、`phase`(僅作參考)。不存:動畫、拖曳中狀態、水槽裡有什麼、焦點、`seq`。

**restore 為逐層 checkpoint validation。原則:上游無效,下游一律丟棄(含 Notebook 文字與 Challenge 答案),不保留。**

| 層 | 驗證失敗時,恢復到 | 丟棄 |
|---|---|---|
| 封包(`v === 1`、是物件) | 全新開始 | 全部 |
| record1 無效 | `welcome` | record2、compare、record3、notebook、challenge |
| record1 有效、record2 無效 | `trial2-switch-liquid`(水、record1 格數、方塊在桌上) | compare、record3、notebook、challenge |
| record1+2 有效、compare 未完成或無效 | `compare` | record3、notebook、challenge |
| compare 有效、record3 無效 | `trial3-drop`(`tried` 旗標逐項接受) | notebook、challenge |
| record3 有效 | 才允許 `concept` / `notebook` / `challenge` | — |

- identity 驗證:用常數與 model 重建每筆 record(record1 格數 = 3、record2 格數 = 4、`firstDrop.slots` = record1.slots);`recentDrops` 只保留合法的 `slots`/`liquidId`,結果與百分比一律重算。偽造的 `stayMass`、`outcome`、`immersion` 不影響結果,因為它們不從存檔讀取。
- Notebook:只在上游全部有效時恢復;Level A 與 records 不一致 → 回到 `notebook` 並清掉不合法的關係欄位。
- Challenge:只在 Notebook 就緒時恢復,逐步用 engine 重新判定,回到第一個未完成的挑戰;全部完成才回 `complete`。
- 最終 phase = 存檔記錄的進度與「已驗證的最高層」兩者中較早的那個,絕不晚於已驗證的層。
- 文字欄位(1000 字上限、清理)只在其前置層全部有效時才處理。
- 還原不派發動作,也不送 analytics。
- localStorage 被封鎖或拋例外:`createStore` 全部包 try/catch,讀寫變成 no-op,lab 照常完成,頁尾顯示「這台裝置不能儲存進度」。

## 15. Analytics(`analytics.js`)

Lab id:`buoyancy-guided`。事件(station-specific):`lab_start`、`trial_recorded`、`compare_complete`、`counterexample_observed`、`notebook_complete`、`challenge_complete`、`lab_complete`。

- 進入 `trial1-test` → `lab_start`;每次 `record-written` → `trial_recorded`(三次);進入 `trial3-drop` → `compare_complete`;進入 `trial3-observed` → `counterexample_observed`;進入 `challenge-1` → `notebook_complete`;進入 `challenge-2`、`challenge-3` → `challenge_complete`;進入 `complete` → `challenge_complete` + `lab_complete`。
- 經 `window.bhcsScienceTrack(action, 'buoyancy-guided')` 送出;不改 `science-events.js`,不改光學。
- 不送:精確質量、密度、dropLog、答案、任何文字、姓名。還原存檔不送事件。

## 16. Accessibility

- 390 與 1280 都不橫捲;手機 DOM 順序:StepNav → Coach → 主內容 → 狀態列 → CTA → 資料卡。
- StepNav 用 `<ol>` + `aria-current="step"`。
- live region 只有 announcer;Coach、Status 不是。
- 滑鼠、觸控、鍵盤都能完成整條主流程;拖曳永遠有等價按鈕。reduced motion 直接切到終態。
- 每個物件有名稱與目前狀態;浮/停/沉有文字與圖示,不靠顏色。axe 掃描與光學相同標準。

## 17. Tests

單元(8 支):`model`、`engine`、`script`、`visual`、`input`、`persist`、`analytics`、`site`。

- model:整個格子表(7 格 × 2 液體)、油的案例、木塊/石頭在水/濃鹽水/油、容差邊界、無效輸入拋錯、單一來源掃描。
- engine:合法/非法動作、Trial 1 記錄(含非 stay 時 RECORD_TRIAL 被拒)、Trial 2「先換液體」與鎖定順序、Trial 3 兩個物件、重複動作、Notebook 閘、Challenge 閘、不 mutate 輸入、`seq` 只在 announcement 事件增加、`facts.immersionPercent` 夾在 1–99。
- script:洩漏防護、evidence 來自 records、Compare view-model 不含 correctAnswer、Concept 數字來自 engine facts、announcement 以 id 去重;**script 不 import model、不含 `Math.round(` 乘 100 或質量除以體積**的掃描。
- visual:四條不變量、配重不改外形、83%/60% 水線單調。
- input:拖放、slop、無效放開、click 抑制、鎖定時不 `preventDefault`、鍵盤。
- persist:有效還原、偽造 slots/outcome、**逐層弄壞並斷言下游資料確實不存在**、malformed、未來版本、blocked storage、還原不送事件。
- analytics:里程碑對應、無重複、不送資料。
- site:靜態守則(第 18 節)。

瀏覽器(3 支,Playwright 1.58.2):`input`、`view`(390/1280、無溢出、不跳動、水線狀態)、`flow`(完整首次路徑、Compare、Trial 3、Concept、Notebook、Challenges、焦點、announcer、axe)。

每個增量完成時做 mutation 檢查(刻意弄壞再看測試失敗,恢復後不 commit 破壞版本)。

## 18. CI 與靜態守則

- 新頁面:`noindex`、自我 canonical,不進 sitemap / ziyuan / science 目錄 / 資源計數 / 首頁 / mini-lab;不替換也不改 legacy `buoyancy-density-lab.html`。
- 不加入既有 42 站的 researcher harness;走自己的三個瀏覽器閘。
- production `main.js` 不得有 `?debug=1` 或 `window.__buoyancyGuided`;測試用 Playwright route 注入。
- `.github/workflows/researcher-lab-check.yml` 加三個 guided buoyancy 步驟與兩個 artifact;`scripts/package.json` 的 `test` 串在確認後加入。
- builder 之後 `git diff --exit-code` 必須乾淨(實際執行)。
- **分支與 PR:** 從最新 `main` 開新分支與獨立 Draft PR,不堆疊在光學原型的 PR 上。
- 本機瀏覽器版本與 CI 不同時,以 CI 為準;腳本支援 `PLAYWRIGHT_CHROMIUM_EXECUTABLE`。

## 19. 實作切分

| 增量 | 檔案 | 測試 | Gate | 禁止跨越 |
|---|---|---|---|---|
| B1 model(含建立分支與 Draft PR、docs baseline) | `package.json`、`model.js` | `test_..._model` | 全格子表、容差、無效輸入、油案例 | 不得有 DOM、state、文字 |
| B2 engine | `engine.js`、`challenges.js` | `test_..._engine` | 18 個 phase 的合法/非法動作、閘門、不 mutate、`seq` 規則 | 不重算 physics;不得有 DOM、文字、storage |
| B3 input | `input.js`、最小 HTML 骨架與 CSS | `test_..._input`、`check_..._input_browser` | 滑鼠/觸控/鍵盤、鎖定、無效放開 | 不判定結果;不碰 persistence |
| B4 visual/render | `visual.js`、`render.js` | `test_..._visual`、`check_..._view_browser` | 四條不變量、390/1280、不跳動 | 不重新判定物理 |
| B5 script | `script.js`、`main.js` 教學流程 | `test_..._script` | 洩漏防護、evidence/Compare/Concept 來自 engine facts | 不寫 storage;不含判定;不 import model |
| B6 notebook/challenges/persist | Notebook/Challenge/Complete 的 UI、`persist.js` | `test_..._persist` | 逐層 checkpoint、偽造存檔被拒、還原不送事件、blocked storage | 元件不直接寫 storage |
| B7 integration/CI | `analytics.js`、site 守則、workflow、`check_..._flow_browser` | `test_..._analytics`、`test_..._site` | 靜態守則、axe、GitHub Actions 全綠、builder 後 diff 乾淨 | 不改 sitemap/ziyuan/catalog/resource/optics/legacy 頁 |
| B8 first-time user test | 測試單 | — | 5 位學生,門檻見教材 Spec 第 14 節 | 不與先前項目混做 |

## 20. Contract 驗證

B7 完成後,才開始比對兩站 view-model 與 Component Spec 的差距。抽取共用程式碼是另一個決策,不在本規格內。

## 21. 風險(implementation risks)

| # | 項目 | 處理 |
|---|---|---|
| O4 | 兩個原型的 PR 都改 workflow 與 `package.json` | 分開驗證,最後合併時處理衝突 |
| O5 | 現在用 `bg-`,抽取時改 `sg-` | 接受一次性改名成本 |
| O6 | 測試 support 複製了光學的內容 | 抽取時再合併 |
| O7 | Level A 第二題期望值幾乎是常數 | 沿用 Approved 內容;若 I8 發現鑑別力不足再改 |
| O8 | 液面不隨放入而升高 | 列為模型限制,Advanced 才有真實水位 |
| O9 | 離散配重可能被當成「按 +/− 猜結果」 | 靠鎖定順序(必須先拿出才能調)、提示不給答案,並由 I8 的放入次數驗證 |
| O10 | 本機 Chromium 版本與 CI 的 Playwright 1.58.2 不同 | 最終以 CI 為準 |

本規格的限制:所有數字、不變量、API 都是設計。懸浮點手感、動畫與配重操作是否變成盲猜,必須在原型與 I8 驗證。

## 22. 狀態

Pilot #2 Prototype Technical Spec v1.0 final
