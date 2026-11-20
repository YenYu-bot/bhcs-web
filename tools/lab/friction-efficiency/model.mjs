// 摩擦與機械效率：同一個 10 N 木箱、同一個斜面（沿坡 100 cm、高 60 cm），只換坡面。
// 慢慢等速拉：拉力 ＝ 重力沿坡分力 6 N ＋ 摩擦力；摩擦力 ＝ 摩擦係數 × 正向力 8 N。
// 光滑、粗糙兩種坡面與 tools/friction-efficiency-desk/model.mjs 完全相同（scripts/lab_friction_efficiency_model.test.mjs 逐公分比對）；
// 砂紙坡面是新版加的第三種，摩擦係數 1/2。g ＝ 10（1 公斤重 ＝ 10 N）。
export const WEIGHT_N = 10;
export const LENGTH_CM = 100;
export const HEIGHT_CM = 60;
export const ALONG_N = WEIGHT_N * HEIGHT_CM / LENGTH_CM;          // 6 N
export const NORMAL_N = WEIGHT_N * 80 / LENGTH_CM;                // 8 N（底邊 80 cm）
export const SURFACES = Object.freeze({
  ideal: Object.freeze({ name: '光滑坡面', muNum: 0, muDen: 4 }),
  rough: Object.freeze({ name: '粗糙坡面', muNum: 1, muDen: 4 }),
  sand: Object.freeze({ name: '砂紙坡面', muNum: 2, muDen: 4 })
});
const round = v => Math.round(v * 1000) / 1000;

export function derive(surfaceId, sCm) {
  const sf = SURFACES[surfaceId];
  if (!sf) throw new RangeError('沒有這種坡面');
  if (!Number.isInteger(sCm) || sCm < 0 || sCm > LENGTH_CM) throw new RangeError('位置須在斜面上');
  const friction = NORMAL_N * sf.muNum / sf.muDen;
  const force = ALONG_N + friction;
  const h = HEIGHT_CM * sCm / LENGTH_CM;
  const input = round(force * sCm / 100);        // 拉力做的功（輸入功）J
  const useful = round(WEIGHT_N * h / 100);      // 木箱增加的位能（有效功）J
  const heat = round(friction * sCm / 100);      // 克服摩擦做的功，變成熱 J
  return Object.freeze({ surfaceId, s: sCm, h, force, friction, normal: NORMAL_N, input, useful, heat,
    efficiency: sCm === 0 ? null : round(useful / input * 100) });
}
