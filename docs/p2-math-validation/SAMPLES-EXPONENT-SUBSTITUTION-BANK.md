# exponent/substitution 前後五題樣本

固定亂數種子：`20260922`；數型：`integer`。本次只新增 `bankSize(ctx)` 宣告，`gen()`、題面與答案均未修改。下表的修正前／後字串逐字相同。

| # | 難度 | 題面（修正前＝修正後） | 答案（修正前＝修正後） | sig |
|---:|---|---|---|---|
| 1 | 基礎 | 已知 a<sup>x</sup>＋a<sup>−x</sup>＝√10，求 <span class="fr"><span class="n">a<sup>3x</sup>＋a<sup>−3x</sup></span><span class="d">a<sup>2x</sup>＋a<sup>−2x</sup></span></span>。 | <span class="fr"><span class="n">7√10</span><span class="d">8</span></span> | `substitution:s:10` |
| 2 | 進階 | 已知 a<sup>x</sup>＝√（18），求 <span class="fr"><span class="n">a<sup>3x</sup>−a<sup>−3x</sup></span><span class="d">a<sup>x</sup>＋a<sup>−x</sup></span></span>。 | <span class="fr"><span class="n">5831</span><span class="d">342</span></span> | `substitution:v:integer:18/1` |
| 3 | 挑戰 | 設 7<sup>t</sup>−7<sup>−t</sup>＝a，將 <span class="fr"><span class="n">7<sup>2t</sup>−7<sup>−2t</sup></span><span class="d">7<sup>3t</sup>＋7<sup>−3t</sup></span></span> 以 a 表示。 | <span class="fr"><span class="n">a</span><span class="d">a<sup>2</sup>＋1</span></span> | `substitution:y:7:t` |
| 4 | 基礎 | 已知 a<sup>x</sup>＝√（14），求 <span class="fr"><span class="n">a<sup>3x</sup>−a<sup>−3x</sup></span><span class="d">a<sup>x</sup>＋a<sup>−x</sup></span></span>。 | <span class="fr"><span class="n">2743</span><span class="d">210</span></span> | `substitution:v:integer:14/1` |
| 5 | 進階 | 已知 a<sup>x</sup>＋a<sup>−x</sup>＝√5，求 <span class="fr"><span class="n">a<sup>3x</sup>＋a<sup>−3x</sup></span><span class="d">a<sup>2x</sup>＋a<sup>−2x</sup></span></span>。 | <span class="fr"><span class="n">2√5</span><span class="d">3</span></span> | `substitution:s:5` |

## 容量核對

正式 `contentGuard` 過濾後，基礎與進階各有 19 個有效 sig；挑戰因另有符號結構，超過 UI 一卷 40 題，故不宣告有限容量。

```text
{"test":"exponent-substitution-bank-size","basic":19,"advanced":19,"challenge":"unbounded-for-UI","passed":true}
```
