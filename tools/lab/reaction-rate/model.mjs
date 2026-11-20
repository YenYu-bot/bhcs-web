// CaCO3 + 2 HCl -> CaCl2 + CO2 + H2O. Ideal-gas endpoint, uncalibrated shrinking-sphere time model.
export const MODEL_VERSION='marble-acid-shrinking-1';
export const BASELINE=Object.freeze({size:'lump'});
export const KEYS=Object.freeze(['size']);
export const PARTICLE_COUNTS=Object.freeze({lump:1,granule:8,powder:1000});
export const CONSTANTS=Object.freeze({massG:.20,molarMassG:100,densityGcm3:2.7,acidVolumeL:.050,acidMolarity:1,temperatureK:298.15,pressureKPa:101.3,gasConstant:8.314,syringeCapacityML:100,baselineTime:180});
export const CO2_MOLES=CONSTANTS.massG/CONSTANTS.molarMassG;
export const VMAX_ML=CO2_MOLES*CONSTANTS.gasConstant*CONSTANTS.temperatureK/CONSTANTS.pressureKPa*1000;
export function validateSettings(s){if(!s||typeof s!=='object'||Array.isArray(s)||Object.keys(s).length!==1||!Object.hasOwn(s,'size')||!Object.hasOwn(PARTICLE_COUNTS,s.size))throw new TypeError('本實驗只能選擇大理石形狀');return Object.freeze({size:s.size});}
export function calculate(input){const s=validateSettings(input),particleCount=PARTICLE_COUNTS[s.size],radiusMm=Math.cbrt(3*CONSTANTS.massG/(4*Math.PI*CONSTANTS.densityGcm3*particleCount))*10,time=180/Math.cbrt(particleCount);return Object.freeze({time,product:VMAX_ML,initialRate:3*VMAX_ML/time,radiusMm,particleCount,retreatSpeedMmPerSecond:radiusMm/time,acidInitialMoles:.05,acidConsumedMoles:.004,acidRemainingMoles:.046,kind:s.size==='lump'?'same':'faster'});}
const validTime=t=>{if(typeof t!=='number'||!Number.isFinite(t)||t<0)throw new TypeError('無效的模型時間');};
export function radiusFraction(s,t){validTime(t);return Math.max(1-t/calculate(s).time,0);}
export function quantity(s,t){const x=radiusFraction(s,t);return VMAX_ML*(1-x*x*x);}
export function remainingMass(s,t){const x=radiusFraction(s,t);return CONSTANTS.massG*x*x*x;}
export function instantRate(s,t){const x=radiusFraction(s,t);return calculate(s).initialRate*x*x;}
export function changedFactors(a,b=BASELINE){return validateSettings(a).size===validateSettings(b).size?[]:['size'];}
export function classify(s){s=validateSettings(s);const baseline=s.size==='lump';return Object.freeze({baseline,eligible:!baseline,factor:baseline?null:'size',reason:baseline?'這是同質量塊狀基準':''});}
