// 直流馬達實驗桌模型：從正前方（轉軸方向）看線圈的兩條邊。
// 左邊導線的受力：電流流出紙面、磁場由左向右（左 N 右 S）時向上；任一個反過來就向下。右邊導線相反。
// 左邊向上、右邊向下 → 線圈順時針轉。
export function motor({ battery, magnet, commutator, pos, cells }) {
  if (!['fwd', 'rev'].includes(battery) || !['NS', 'SN'].includes(magnet) || typeof commutator !== 'boolean' || !['start', 'half'].includes(pos) || ![1, 2].includes(cells)) throw new RangeError('motor settings');
  const b = battery === 'fwd' ? 1 : -1, m = magnet === 'NS' ? 1 : -1;
  // 有換向器：轉過半圈後，在左邊的那條導線電流方向和原來在左邊的一樣；沒有換向器：導線帶著原來的電流方向換到另一邊
  const leftCurrent = pos === 'half' && !commutator ? -b : b; // ＋1 流出紙面
  const leftForce = leftCurrent * m, startTorque = b * m;
  return {
    leftCurrent, leftForce, rightForce: -leftForce,
    torque: leftForce, startTorque, keeps: leftForce === startTorque,
    // 甲導線一開始在左邊；轉半圈後在右邊
    wireA: pos === 'start' ? 'left' : 'right', currentA: pos === 'start' ? b : (commutator ? -b : b),
    spin: commutator ? (startTorque > 0 ? '順時針連續轉動' : '逆時針連續轉動') : '轉不到一圈就被拉回，最後停住',
    strength: cells
  };
}
