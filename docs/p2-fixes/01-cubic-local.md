# P2 修正 01：三次函數局部一次式

根因：cubic/global 的 combined 題型呼叫不存在的 localAt，造成 ReferenceError。
補上精確有理數計算 f(r) 與 x=r 附近一次項係數 3ar²+2br+c；保留既有題型、數字範圍與難度。

驗證：`node scripts/math-regressions/cubic-local.mjs`，三難度各直接 200 次，共 600 次；117 題 combined 由答案多項式獨立代入，並用對稱差分扣除三次項核算局部斜率；無例外、所有非空候選 verify 通過。原始版本確實因 localAt 未定義被同一測試拒絕。

限制：83 次既有 null 候選仍保留，屬另一生成根因；本 PR 沒有宣称通過整份 P2。未修改 UI／列印樣式，尚未做修正後視覺驗收。依賴草稿 PR #22 的測試基線，不合併、不部署。
