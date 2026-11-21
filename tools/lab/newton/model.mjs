// 力與運動實驗桌模型：水平軌道上的小車。合力 ＝ 拉力 − 摩擦力；靜止且拉力不超過摩擦力時不動。
export function motion({ mass, force, friction, v0 }) {
  if (!(mass > 0) || force < 0 || friction < 0 || v0 < 0) throw new RangeError('motion settings');
  let net = force - friction;
  if (v0 === 0 && net < 0) net = 0;
  const a = net / mass, stop = a < 0 ? -v0 / a : Infinity;
  const at = t => { const u = Math.min(t, stop); return { v: Math.max(0, v0 + a * u), x: v0 * u + 0.5 * a * u * u }; };
  return { net, a, v2: at(2).v, x1: at(1).x, x2: at(2).x, at, state: net === 0 ? (v0 > 0 ? '等速' : '靜止') : a > 0 ? '加速' : '減速' };
}
