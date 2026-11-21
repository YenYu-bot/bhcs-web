// 熱與物態實驗桌模型：從 −20°C 的冰開始，用每分鐘 1000 卡的加熱器加熱（熱量全部被吸收，1 大氣壓）。
export const C_ICE = 0.5, C_WATER = 1, L_MELT = 80, L_BOIL = 540, RATE = 1000, T0 = -20;
export function heat({ mass, time }) {
  if (!(mass > 0) || !(time >= 0)) throw new RangeError('phase settings');
  const Q = RATE * time, a = mass * C_ICE * -T0, b = mass * L_MELT, c = mass * C_WATER * 100, d = mass * L_BOIL;
  if (Q < a) return { Q, temp: T0 + Q / (mass * C_ICE), phase: 'ice', frac: 0 };
  if (Q < a + b) return { Q, temp: 0, phase: 'melting', frac: (Q - a) / b };
  if (Q < a + b + c) return { Q, temp: (Q - a - b) / (mass * C_WATER), phase: 'water', frac: 0 };
  if (Q < a + b + c + d) return { Q, temp: 100, phase: 'boiling', frac: (Q - a - b - c) / d };
  return { Q, temp: 100, phase: 'steam', frac: 1 };
}
