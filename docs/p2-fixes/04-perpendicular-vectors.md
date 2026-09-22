# P2 修正 04：空間點線投影的垂直向量

spaceinner/pointdistance、line3d/pointprojection 及 line3d/pointdistance 共用同類構造錯誤：方向 (1,0,1) 時原候選 (自由值,1,0) 不一定垂直。對該方向改為 (1,自由值,-1)，距離題保留原倍率 k；所有六種方向、自由值及倍率範圍均保留。

verify 改走投影係數 ((P-A)·d)/(d·d) 或距離平方公式，獨立檢查垂足與距離，避免只檢查構造向量。

`node scripts/math-regressions/perpendicular-vectors.mjs`：三單元×三難度×200 次，1,800/1,800 無空值、無例外、verify 全過；從實際題面取坐標，獨立求垂足，再比對答案。每單元覆蓋六種方向。原版由同一回歸測試拒絕。

保留原題型與難度；個別生成坐標隨錯誤修正改變。其他空間幾何的候選篩選尚未處理，整體 P2 仍未通過，不合併部署。
