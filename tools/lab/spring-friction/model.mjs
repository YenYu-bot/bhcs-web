// 彈簧與摩擦：新版實驗桌模型。
// 算式與 scripts/science/models.mjs 的 'spring-friction' 相同，只把 g 從 9.8 改成 10（新版各站統一「1 公斤重 ＝ 10 N」）。
// scripts/lab_spring_friction_model.test.mjs 逐一比對：除了 g，所有輸出照比例一致。
export const G = 10;                 // N/kg
export const K = 50;                 // 彈簧常數 N/m
export const LIMIT_CM = 30;          // 彈性限度（伸長）
export const MU = Object.freeze({ static: 0.3, kinetic: 0.2 });   // models.mjs 'smooth' 表面
export const BLOCK_KG = 2, EXTRA_KG = 2;
export const FACES = Object.freeze({ wide: { name: '寬面朝下', area: 60 }, narrow: { name: '窄面朝下', area: 30 } });

export function spring(massKg) {
  const F = massKg * G, x = F / K * 100;
  return Object.freeze({ massKg, F, x, over: x > LIMIT_CM + 1e-9 });
}
export function friction({ massKg = BLOCK_KG, pull }) {
  const N = massKg * G, fs = MU.static * N, fk = MU.kinetic * N;
  const edge = Math.abs(pull - fs) < 1e-6, moving = !edge && pull > fs;
  return Object.freeze({ N, fs, fk, pull, friction: moving ? fk : pull, kind: edge ? 'edge' : moving ? 'moving' : 'rest', a: moving ? (pull - fk) / massKg : 0 });
}
