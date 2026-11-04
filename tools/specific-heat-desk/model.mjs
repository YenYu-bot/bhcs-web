/** Fixed teaching model. No user-variable material constants or power. */
export const MODEL_VERSION = 'specific-heat-v1';
export const CONFIGS = Object.freeze({
 water100: Object.freeze({id:'water100', material:'water', label:'水 100 g', mass:100, c:4.2}),
 iron100: Object.freeze({id:'iron100', material:'iron', label:'鐵 100 g', mass:100, c:.45}),
 iron200: Object.freeze({id:'iron200', material:'iron', label:'鐵 200 g', mass:200, c:.45})
});
export const POWER=21, INITIAL_TEMPERATURE=20, DURATION=60;
export function sample(id,time) {
 const c=typeof id==='string'&&Object.hasOwn(CONFIGS,id)?CONFIGS[id]:null;
 if (!c || typeof time!=='number' || !Number.isFinite(time) || time<0 || time>60) throw new RangeError('不支援的樣本或模型時間');
 return Object.freeze({configId:id,time,temperature:20+21*time/(c.mass*c.c)});
}
export const displayTemperature = value => value.toFixed(1);
export function parseNumber(raw) {
 const s=String(raw).normalize('NFKC').trim();
 // Units are separate labels. Reject malformed grouping, exponents and kJ.
 if(!/^[+-]?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(s)) return NaN;
 const n=Number(s.replaceAll(',','')); return Number.isFinite(n)?n:NaN;
}
