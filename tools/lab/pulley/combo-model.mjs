// 滑輪組（理想模型）：沒有摩擦，滑輪與繩子不計重量。
// 拉住下方動滑輪的繩子有 n 段：拉力 = 重量 ÷ n，木箱升高 h 時繩子要拉 n × h，功 = 拉力 × 繩長 = 重量 × h。
import { WEIGHT_N, TARGET_CM } from '../../pulley-desk/model.mjs';

export const COMBOS = Object.freeze({
  combo2: Object.freeze({ id: 'combo2', name: '一定一動', segments: 2, fixedWheels: 1, movableWheels: 1 }),
  combo4: Object.freeze({ id: 'combo4', name: '二定二動', segments: 4, fixedWheels: 2, movableWheels: 2 })
});

export function calculateCombo(id, h) {
  const c = COMBOS[id];
  if (!c) throw Error('未知滑輪組');
  if (!Number.isInteger(h) || h < 0 || h > TARGET_CM) throw Error('高度須為 0 至 20 cm 的整數');
  const n = c.segments;
  return { device: id, weightN: WEIGHT_N, supportSegments: n, forceN: WEIGHT_N / n, heightCm: h, ropeCm: n * h,
    inputWorkNcm: (WEIGHT_N / n) * (n * h), outputWorkNcm: WEIGHT_N * h };
}
