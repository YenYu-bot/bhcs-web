// 能量轉換：g ＝ 10，算式同 scripts/science/models.mjs 的 energy（只把 9.8 換成 10）；scripts/lab_energy_model.test.mjs 比對。
export const G = 10;
export function energy({ mass, height, progress, loss }) {
  const total = mass * G * height, dropped = total * progress / 100, potential = total - dropped, thermal = dropped * loss / 100, kinetic = dropped - thermal;
  return { total, potential, kinetic, thermal, speed: Math.sqrt(2 * kinetic / mass), h: height * (1 - progress / 100) };
}
