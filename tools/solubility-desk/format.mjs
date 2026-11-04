// Preserve meaningful nonzero amounts at a saturation boundary.
export function formatMass(n) {
  if (n === 0) return '0';
  if (n > 0 && n < 0.001) return '＜0.001';
  return String(Number(n.toFixed(3)));
}
export function formatPercent(n) { return n.toFixed(1).replace(/\.0$/, ''); }
