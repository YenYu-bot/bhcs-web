# G8 r4 交接摘要（依 r3、r5 與 r5 引擎重建）

原始 r4 README 未隨目前可用的交付檔提供；本檔不是 Claude 的原始 r4 README。r5 README 說明 r4 在 r3 六個 topic 之上加入 `quadapps`、`triineq`，r5 僅修改 `parallel/zigzag` 題幹。實際發布檔請以 `docs/g8-r5/README.md` 與 `tools/math/g8-drills.html` 為準。

## r4 新增的兩個 topic

- `quadapps`：一元二次方程式應用題。r5 引擎涵蓋面積、數字、路寬、握手與分配、買賣、直角三角形，要求列式並捨去不符合情境的根。
- `triineq`：三角形的邊角關係。r5 引擎涵蓋三角不等式、第三邊範圍、整數邊長與等腰、大邊對大角、樞紐定理。

## ChatGPT 套用時要做的

1. 使用 r5 累積版 `tools/math/g8-drills.html`；保留 r1～r3 的 README，並加入本摘要與 r5 README。
2. 國二數學索引及 `ziyuan.html` 依 r5 `TOPICS` 順序加入八張卡片，保留既有 `g8-quadratic-arithmetic-sequence.html`。新舊檔互連：舊雙工作台導向 `quadapps` 與 `geoseq`，新引擎導回舊雙工作台。
3. `sitemap.xml` 加入新引擎；執行 `build_science.mjs` 更新資源宣告，重產並提交 P2 報告，執行品牌與 topic discovery 檢查。新引擎不做不存在的歷史位元組比對，其餘品牌及列印檢查照跑。
