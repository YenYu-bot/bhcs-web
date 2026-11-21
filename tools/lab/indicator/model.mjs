// 酸鹼指示劑實驗桌模型：各溶液的大約 pH 與三種指示劑的顏色。
export const SOL = { hcl: ['稀鹽酸', 1], vinegar: ['食醋', 3], water: ['純水', 7], soda: ['小蘇打水', 9], naoh: ['氫氧化鈉溶液', 13] };
export const IND = { litmus: '石蕊', phenol: '酚酞', universal: '廣用指示劑' };
export function indicate({ sol, ind }) {
  if (!SOL[sol] || !IND[ind]) throw new RangeError('indicator settings');
  const [name, ph] = SOL[sol], kind = ph < 7 ? 'acid' : ph > 7 ? 'base' : 'neutral';
  let color, hex;
  if (ind === 'litmus') [color, hex] = ph < 4.5 ? ['紅色', '#E4573F'] : ph > 8.3 ? ['藍色', '#3F6FD6'] : ['紫色', '#8E5BB5'];
  else if (ind === 'phenol') [color, hex] = ph < 8.2 ? ['無色', '#EAF4FB'] : ph < 10 ? ['淡粉紅色', '#F5B5CF'] : ['紅色', '#D9347A'];
  else [color, hex] = ph <= 2 ? ['紅色', '#E4573F'] : ph <= 4 ? ['橙色', '#F0913A'] : ph <= 6 ? ['黃色', '#F2D03B'] : ph <= 7 ? ['綠色', '#4FAE5A'] : ph <= 10 ? ['藍色', '#3F7FD6'] : ['紫色', '#7A4BB5'];
  return { name, ph, kind, color, hex };
}
