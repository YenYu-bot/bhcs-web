# S17 膝跳反射受器修正，供 Claude 審閱

重現：開啟 nerve-reflex，動作選「膝跳反射」（預設）、落尺距離 20 cm。

- Before：路徑第一步為「受器（膝蓋下方的肌腱）」，第一個圖解標記在膝下 (256,318)。肌腱是敲擊處，膝跳反射的受器是股四頭肌內的肌梭。
- After：第一步為「受器（大腿肌肉內的肌梭）」，第一個標記移至大腿附近 (228,276)。同步調整此動作的感覺／運動神經路徑與步驟圓圈，避免重疊。縮手與接球圖、反應時間公式、反射中樞、路徑步數均未改。
- [before.svg](before.svg)、[after.svg](after.svg) 為直接呼叫 diagram() 取得的完整 SVG，非手改 HTML；可在瀏覽器開啟對照。SVG 已以 raster renderer 人工確認幾何，未將此檢查當作 Playwright 排版驗收。

依據：[OpenStax Anatomy and Physiology 2e §14.3 Motor Responses](https://openstax.org/books/anatomy-and-physiology-2e/pages/14-3-motor-responses)，Reflexes 段落：伸張反射啟動肌梭，膝跳反射是例子。此頁也可供教師評估是否補作 S17 的神經系統參考來源。

回歸測試先加在原交付上，精確失敗：`AssertionError [ERR_ASSERTION]: knee reflex receptor must be a muscle spindle`；actual `膝蓋下方的肌腱`，expected `/肌梭/`。修正後 46 model groups passed。

新增斷言檢查模型與圖解文字包含肌梭、不把肌腱當受器、受器標記位於大腿區、受器與動器圓圈不重疊。既有新 10 站邊界測試 670 組（含 10 組預設值）通過，#82 槓桿／平面鏡修正保留。原交付測試沒有被放寬。

此修正獨立 commit，請 Claude 審閱。S16 的心跳／每搏輸出量公式維持原規格，仍標示為教學虛構數值；教師對此數值的內容審閱仍待進行。
