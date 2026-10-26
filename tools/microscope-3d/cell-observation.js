// Conservative pilot: only centered4×/40× cell views are verified.
// Existing deterministic drawing geometry is covered by recorded-path tests; no new optics.
import {compoundIllumination} from './illumination.js?v=eab0f0e4c58b';
import {clarity} from './model.js';
import {referenceVisible} from './course.js?v=4cfd5966f331';
export const specimens={
 letter:{name:'字母e',low:['定位十字'],high:['定位十字']},
 onion:{name:'洋蔥鱗莖表皮',low:['細胞壁'],high:['細胞壁','染色細胞核示意']},
 elodea:{name:'水蘊草葉片',low:['細胞壁'],high:['細胞壁','葉綠體示意']}
};
export function describeObservation(s){
 const lighting=compoundIllumination(s);
 const reference=s.specimen==='letter'&&referenceVisible(s);
 if(s.specimen==='letter')return {referenceVisible:reference,observable:reference&&lighting.readable,structures:reference&&lighting.readable?['定位十字']:[],basis:'letter-reference',reason:!lighting.readable?'照明不足；定位標示仍可見不代表標本可判讀。':reference?'定位十字在視野內。':'定位十字不在視野內。'};
 const supported=['onion','elodea'].includes(s.specimen),center=s.stageX===0&&s.stageY===0,power=[4,40].includes(s.objective),clear=clarity(s)>=80,verified=supported&&center&&power&&clear&&lighting.readable;
 return {referenceVisible:false,observable:verified,structures:verified?[...specimens[s.specimen][s.objective===4?'low':'high']]:[],basis:verified?'centered-cell-model':'cell-unverified',reason:!lighting.readable?'構造未驗證：照明不足，請調整光圈與反光鏡。':verified?'本模型置中視野的構造已達本階段觀察條件。':!center?'構造未驗證：本階段只驗收置中視野，請先回中央。':!power?'構造未驗證：本階段使用4×與40×物鏡。':!clear?`構造未驗證：清晰度${clarity(s)}%，請調到至少80%。`:'此標本不在本階段範圍。'};
}
