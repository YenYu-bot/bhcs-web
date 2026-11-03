// Fixed-rate teaching model, not a named chemical reaction or measured sensor data.
export const MODEL_VERSION='reaction-rate-teaching-1';
export const BASELINE=Object.freeze({conc:1,temp:25,size:'lump',cat:'none',amount:5});
export const KEYS=Object.freeze(['conc','temp','size','cat','amount']);
export const SIZE_FACTORS=Object.freeze({lump:1,granule:3,powder:9});
const grid=(n,min,max,step)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max&&Math.abs((n-min)/step-Math.round((n-min)/step))<1e-8;
export function validateSettings(s){
 if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).some(k=>!KEYS.includes(k))||!grid(s.conc,.1,2,.1)||!grid(s.temp,5,65,5)||!grid(s.amount,1,10,1)||!Object.hasOwn(SIZE_FACTORS,s.size)||!['none','yes'].includes(s.cat))throw new TypeError('無效的實驗條件');
 return Object.freeze(Object.fromEntries(KEYS.map(k=>[k,s[k]])));
}
export function calculate(input){const s=validateSettings(input),sizeF=SIZE_FACTORS[s.size],catF=s.cat==='yes'?4:1,tempF=2**((s.temp-25)/10),rate=s.conc*tempF*sizeF*catF;return Object.freeze({rate,time:s.amount*60/rate,product:s.amount,tempF,sizeF,catF,kind:Math.abs(rate-1)<1e-9?'same':rate>1?'faster':'slower'});}
// Newly specified linear presentation interpolation of the existing fixed-rate endpoints.
export function quantity(s,t){if(typeof t!=='number'||!Number.isFinite(t)||t<0)throw new TypeError('無效的模型時間');const r=calculate(s);return t>=r.time?r.product:Math.min(r.product,r.rate*t/60);}
export function changedFactors(a,b=BASELINE){a=validateSettings(a);b=validateSettings(b);return KEYS.filter(k=>a[k]!==b[k]);}
export function classify(s){const d=changedFactors(s),r=calculate(s);let reason='';if(!d.length)reason='這是基準條件';else if(s.conc!==1||s.amount!==5)reason='主線須保持濃度 1 M、甲總量 5 單位';else if(s.temp>35)reason='主線溫度上限是 35°C';else if(d.length!==1)reason='同時改了多項，不能單獨歸因';else if(r.time>100)reason='有用的觀察，但還未在 100 模型秒內完成';return Object.freeze({baseline:d.length===0,eligible:!reason,factor:d.length===1?d[0]:null,reason});}
