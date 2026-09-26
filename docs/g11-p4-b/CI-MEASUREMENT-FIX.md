# #57：390px 水平溢出的 CI 判定與量測修正

## 判定依據

- PR 修正前 head：`96f504b8ba93a68955a2c32f675a55e7eccaa6a1`。
- main／merge-base：`8082004dc7843b7da3b481e72a0f77e11748679d`。
- `git diff $(git merge-base origin/main HEAD)..HEAD -- tools/math/g7-linear-equation.html` 為空；直接比對 `origin/main` 與 HEAD 亦為空。
- 兩邊該檔 blob SHA 都是 `69ade53c82a4f7d4129ee23d39695d2f703048fe`，內容逐位元組相同。
- main 最新 Researcher run：[36213720308](https://github.com/YenYu-bot/bhcs-web/actions/runs/36213720308)，head `8082004`，2026-09-26 台灣時間 11:15:43 更新為 success。
- 已下載該 run 的 `public-site-review` artifact（ID `10896946957`）並讀取 `results.json`：

```json
[
  {"file":"tools/math/g7-linear-equation.html","width":390,"overflow":0,"badImages":[],"h1":1,"pass":true},
  {"file":"tools/math/g7-linear-equation.html","width":1280,"overflow":0,"badImages":[],"h1":1,"pass":true}
]
```

- #57 的 [run 36220616522 / job 108345055073](https://github.com/YenYu-bot/bhcs-web/actions/runs/36220616522/job/108345055073) 在同檔 390px 顯示 `overflow:4`、`error:"horizontal overflow"`。
- 依使用者指定分類：main 通過、#57 失敗且檔案相同，走「偶發」處理分支。這項比對本身不能證明根因是字型；原腳本其實已在導覽後等待 `document.fonts.ready`。

## 修改與重跑

- 對失敗 job `108345055073` 提交一次 rerun，API 回覆 `success:true`；未查重跑結果。
- 僅修改檢查工具 `scripts/check_site_browser.cjs`：在每次讀取尺寸前再次等待 `document.fonts.ready`，再等兩個 animation frames。
- 390px 且第一次 overflow 為 1～2px 時，只重量一次，保留 `initialOverflow`、`remeasured` 診斷欄位，再使用第二次結果判定。
- 維持原 `overflow <= 2` 門檻；4px 不會被這個重測分支直接接受，第二次讀到 4px 仍失敗。
- 沒有修改 G7 HTML、CSS、顏色、版型或 G11 出題器。

## 本機驗證與限制

- `node --check scripts/check_site_browser.cjs`、`git diff --check` 通過。
- 對實際量測函式注入延遲的 fonts.ready 與尺寸序列，7／7 通過；每次量測前均確認字型已完成且等待兩個 frames。

| 寬度 | 尺寸序列（overflow） | 讀取次數 | 最終 overflow |
|---|---|---:|---:|
| 390 | 0 | 1 | 0 |
| 390 | 1 → 0 | 2 | 0 |
| 390 | 2 → 0 | 2 | 0 |
| 390 | 2 → 2 | 2 | 2 |
| 390 | 2 → 4 | 2 | 4（維持失敗） |
| 390 | 4 | 1 | 4（維持失敗） |
| 1280 | 2 | 1 | 2 |

本機沒有已安裝的 Chromium；安裝下載回傳無效 ZIP（`End of central directory record signature not found`），因此本次沒有宣稱完成真實瀏覽器驗證。push 將觸發新 head 的 CI；本輪 push 後不查 CI，下一輪只查一次。
