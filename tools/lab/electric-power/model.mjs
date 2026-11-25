// 電流熱效應：算式同 scripts/science/models.mjs 的 electric-power。
// 100 g 的水、起始 25°C、比熱 4.2 J/(g·°C)；電能全部變成水吸收的熱（不計散熱）。
export const WATER = 100, C = 4.2, START = 25;
export const SUPPLY = { V: 6, I: 1 }; // 固定電壓 6 V，或固定電流 1 A

export function heat({ mode, ohm, time }) {
  const I = mode === 'V' ? SUPPLY.V / ohm : SUPPLY.I, V = mode === 'V' ? SUPPLY.V : SUPPLY.I * ohm;
  const P = V * I, E = P * time, dT = E / (WATER * C);
  return { I, V, P, E, cal: E / C, dT, temp: START + dT };
}
export const METERS = [[1000, 1], [500, 2]];
export const kWh = (watts, hours) => watts / 1000 * hours;
