// 理想斜面（不計摩擦、等速慢慢拉）：拉力 = 重量 × 高 ÷ 斜面長；沿坡拉 s 時，木箱升高 = 高 × s ÷ 斜面長。
// 已與 tools/incline-desk（40/20、80/20）及 tools/friction-efficiency-desk 光滑面（100/60）逐公分比對。
export const WEIGHT_N = 10;
export const LENGTHS = Object.freeze([40, 50, 80, 100]);
export const HEIGHTS = Object.freeze([10, 20, 30]);
export function idealIncline(lengthCm, heightCm, sCm) {
  if (!Number.isInteger(lengthCm) || !Number.isInteger(heightCm) || heightCm <= 0 || heightCm >= lengthCm) throw new RangeError('斜面長度須大於高度');
  if (!Number.isInteger(sCm) || sCm < 0 || sCm > lengthCm) throw new RangeError('位置須在斜面上');
  return { L: lengthCm, H: heightCm, s: sCm, force: WEIGHT_N * heightCm / lengthCm, h: heightCm * sCm / lengthCm, friction: 0 };
}
