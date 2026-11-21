// 光合作用實驗桌模型（示意數值）：水蘊草每分鐘冒出的氧氣泡數。
// 速率由最不足的因素決定：光照（弱 1、中 2、強 3，各 ×10）和二氧化碳（低：上限 20；高：上限 40），再乘上溫度的影響（25°C 最適合）。
export const TEMP = { 10: 0.5, 25: 1, 40: 0.5 }, CO2 = { low: 20, high: 40 };
export function photo({ light, co2, temp }) {
  if (![1, 2, 3].includes(light) || !(co2 in CO2) || !(temp in TEMP)) throw new RangeError('photosynthesis settings');
  const byLight = light * 10, cap = CO2[co2], base = Math.min(byLight, cap);
  return { rate: base * TEMP[temp], base, limit: byLight < cap ? 'light' : byLight > cap ? 'co2' : 'both', tempFactor: TEMP[temp] };
}
