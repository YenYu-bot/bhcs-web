// 水壓與氣壓：新版實驗桌模型。
// 水壓、針筒氣壓的算式同 scripts/science/models.mjs 的 'pressure-fluid'，只把 g 從 9.8 改成 10（新版各站統一 1 公斤重 ＝ 10 N）。
// 氣壓計依課本定值：1 大氣壓 ＝ 101.3 kPa ＝ 76 cm 水銀柱，柱高與外界氣壓成正比（不由 g 推算）。
// scripts/lab_pressure_model.test.mjs 逐一比對。
export const ATM = 101.3;            // kPa
export const ATM_CMHG = 76;          // cm 水銀柱
export const G = 10, WATER = 1000;   // N/kg、kg/m³
export const water = depth => { const relative = WATER * G * depth / 1000; return Object.freeze({ depth, relative, absolute: ATM + relative }); };
export const gas = volume => Object.freeze({ volume, absolute: ATM / volume });
export const mercury = air => Object.freeze({ air, height: ATM_CMHG * air / ATM });
