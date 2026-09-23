# 4 站「改條件後仍可儲存」：根因與修正（2026-09-22，Claude）

## 結論

**不是四站的失效邏輯有問題，是共用外殼在切換畫面時會把焦點搶走。** 四站頁面本身在 390 與 1280、改 range（鍵盤 ArrowRight）與改 select 的所有路徑都會正確鎖住兩個儲存鍵；CI run #171 的失敗是操作序列與一個延後一幀的 focus 之間的競態。

同時更正 Claude 先前的說法：之前宣稱在 buoyancy 站「真瀏覽器重現真 bug」是錯的——當時腳本改到的是第一個可見的 `#level`（顯示模式）下拉，改顯示模式本來就不該讓讀值失效。依 ChatGPT 提供的精確步驟（`#mass` range＋ArrowRight）重測，四站兩種寬度全部正確鎖住。**正式站沒有資料正確性問題。**

## 根因

`assets/researcher-lab.js` 的 `show(id)` 在切換畫面後做：

```js
requestAnimationFrame(()=>screenHeading(id)?.focus({preventScroll:true}))
```

測試按下「回去做第二筆」→ `show('bench')` → 立刻 `control.focus()` → `keyboard.press('ArrowRight')`。若那一幀的 rAF 在 focus 之後、按鍵之前觸發，焦點被標題搶走，方向鍵落在標題上，滑桿值沒變，失效邏輯自然不會觸發。實測（同一個 JS task 內先 click 再 focus 滑桿，等兩幀後看 `activeElement`）：

| 站 | 修正前 | 修正後 |
|---|---|---|
| buoyancy-density `#mass` | 焦點被 `labTitle` 搶走 | 留在 `mass` |
| force-motion `#mass` | 焦點被 `lab-title` 搶走 | 留在 `mass` |

這也解釋為什麼 1280 才失敗、run #174 又全綠：純粹是那幾毫秒的先後。

## 修正（只改一處）

`show()` 的延後聚焦改為：**只有當目前焦點不在目標畫面內時，才把焦點移到標題。** 使用者（或測試）已經主動聚焦到畫面內的控制項時，不再搶。

```js
requestAnimationFrame(()=>{if(!target.contains(document.activeElement))screenHeading(id)?.focus({preventScroll:true})})
```

版本號 `researcherCssVersion` → `20260922-focus-guard-9`，重建產出。

## 驗證（本機 Chromium）

- 依 CI 精確步驟（`[data-start]` → 操作鍵 → 收進手冊 → 手冊 → 回去做第二筆 → focus range → ArrowRight → 等兩幀）：四站 × 390／1280，原始與代理儲存鍵皆 disabled，8/8。
- 不等待、同一 task 內連續操作的競態模擬：24/24 通過。
- `check_researcher_operations` 40/40、`check_researcher_composition` 126/126、`check_researcher_browser` 8/8、batch1 PASS。
- jsdom 測試未執行。

## 給測試端的建議（ChatGPT 的檔案，Claude 未改）

`check_researcher_operations.cjs` 在 `[data-return-second].click()` 之後、抓控制項之前加一次 `await settle(page)`。頁面修正後即使不加也不會再競態，但測試本身不該依賴實作細節。
