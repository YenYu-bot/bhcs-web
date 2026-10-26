// In-memory observations only. No browser storage, network, or course-state writes.
import {clarity,fov} from './model.js';
import {compoundIllumination,illuminationSettings} from './illumination.js?v=eab0f0e4c58b';
import {stereoClarity,stereoFov,stereoObservable} from './stereo-model.js?v=c92e0903f33e';
import {describeObservation,specimens} from './cell-observation.js?v=07abc8ce6c63';
const fields=['objective','coarse','fine','light','stageX','stageY'];
const sourceLabels={manual:'自行記錄',focus:'任務①低倍','direction-start':'任務②起點','direction-move':'任務②移動後','compare-low':'任務③低倍','compare-high':'任務③高倍','cell-low':'細胞低倍','cell-high':'細胞高倍','stereo-focus':'解剖低倍起點','stereo-start':'解剖低倍起點','stereo-move':'解剖移動後','stereo-low':'解剖低倍','stereo-high':'解剖高倍'};
const clone=r=>JSON.parse(JSON.stringify(r));const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
export function createNotebook({sessionId=`page-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,clock=()=>Date.now(),limit=12}={}){
 let rows=[],round=1,serial=0,lastManualCapture=-Infinity;const events=new Set();
 const records=()=>rows.map(r=>freeze(clone(r)));
 function capture(state,{source='manual',eventId}={}){
  const now=clock();if(eventId&&events.has(eventId))return {ok:false,reason:'這次觀察已記錄，沒有重複加入。'};
  if(source==='manual'&&now-lastManualCapture<350)return {ok:false,reason:'剛記下一筆，請稍候再記錄。'};
  if(rows.length>=limit)return {ok:false,reason:`本頁已滿${limit}筆；請先下載或刪除舊紀錄，再記錄。這次沒有加入筆記。`};
  const stereo=state?.instrument==='stereo',instrument=stereo?'stereo':'compound';
  const valid=state&&(stereo?['token','leaf'].includes(state.specimen)&&[20,40].includes(state.total)&&['focus','stageX','stageY','lamp'].every(k=>Number.isFinite(state[k]))&&Math.abs(state.focus)<=5&&state.lamp>=0&&state.lamp<=100:['letter','onion','elodea'].includes(state.specimen)&&fields.every(k=>Number.isFinite(state[k]))&&[4,10,40].includes(state.objective)&&Math.abs(state.coarse)<=5&&Math.abs(state.fine)<=10&&state.light>=0&&state.light<=100)&&Math.abs(state.stageX)<=270&&Math.abs(state.stageY)<=270&&sourceLabels[source];
  if(!valid)return {ok:false,reason:'目前條件無法記錄，請重新操作後再試。'};
  const illum=stereo?{kind:'reflected',lamp:state.lamp,relative:state.lamp/100,readable:state.lamp>=25,status:state.lamp>=25?'照明適合':'偏暗'}:{kind:'transmitted',...illuminationSettings(state),relative:compoundIllumination(state).factor,readable:compoundIllumination(state).readable,status:compoundIllumination(state).status};
  const observable=stereo?stereoObservable(state):describeObservation(state).observable;
  const descriptor=stereo?{referenceVisible:false,observable,structures:observable?[state.specimen==='token'?'刻紋與方向標記':'葉片表面脈紋']:[],basis:observable?'stereo-surface-model':'stereo-unverified',reason:observable?'本模型表面標記可判讀。':'表面構造未驗證：請確認照明、對焦與標記位置。'}:describeObservation(state);
  const row=freeze({version:3,kind:'microscope-model-simulation',id:`${sessionId}-r${round}-n${++serial}`,sessionId,round,sequence:serial,source,sourceLabel:sourceLabels[source],instrument,instrumentLabel:stereo?'解剖顯微鏡':'複式顯微鏡',specimen:state.specimen,specimenLabel:stereo?(state.specimen==='token'?'刻紋小圓片':'葉片表面'):specimens[state.specimen].name,objective:stereo?state.total/10:state.objective,total:stereo?state.total:state.objective*10,field:stereo?stereoFov(state.total):fov(state.objective),clarity:stereo?stereoClarity(state):clarity(state),stageX:state.stageX,stageY:state.stageY,coarse:stereo?null:state.coarse,fine:stereo?null:state.fine,focus:stereo?state.focus:null,light:stereo?state.lamp:state.light,illumination:illum,...descriptor});
  rows.push(row);if(source==='manual')lastManualCapture=now;if(eventId)events.add(eventId);return {ok:true,row:clone(row),reason:`第${row.sequence}筆已加入本頁暫存；重新整理會消失。`};
 }
 function compare(lowId,highId){const low=rows.find(r=>r.id===lowId),high=rows.find(r=>r.id===highId),reasons=[];
  if(!low||!high)return {valid:false,reasons:['請選擇仍保留在筆記中的低倍與高倍兩筆紀錄。']};
  if(low.id===high.id)reasons.push('必須是兩筆不同的觀察。');
  if(low.instrument!==high.instrument)reasons.push('兩筆來自不同儀器，不能當成同一組倍率比較。');
  if(low.instrument==='compound'?(low.objective!==4||high.objective!==40):(low.total!==20||high.total!==40))reasons.push(low.instrument==='compound'?'需要4×物鏡的低倍與40×物鏡的高倍，不是10×物鏡。':'解剖比較需要總倍率20×先於40×。');
  if(low.illumination.kind!==high.illumination.kind||['apertureIndex','mirrorAngle','lamp'].some(k=>low.illumination[k]!==high.illumination[k]))reasons.push('照明設定或通光條件不同。');
  if(low.sequence>=high.sequence)reasons.push('低倍觀察必須先於高倍觀察。');
  if(low.sessionId!==high.sessionId||low.round!==high.round)reasons.push('兩筆不在同一觀察回合；重新開始或重做任務後，請重新建立一組。');
  for(const [k,label]of [['specimen','標本'],['stageX','左右位置'],['stageY','上下位置'],['light','照明'],['coarse','粗動位置']])if(low[k]!==high[k])reasons.push(`${label}不同。`);
  for(const [r,label]of [[low,'低倍'],[high,'高倍']]){if(r.clarity<80)reasons.push(`${label}清晰度${r.clarity}%，未達80%。`);if(!r.observable)reasons.push(`${label}${r.reason}`);}
  return {valid:reasons.length===0,reasons,low:clone(low),high:clone(high)};
 }
 return {capture,records,compare,newRound(){round++;lastManualCapture=-Infinity;return round;},round:()=>round,sessionId,limit,remove(id){const count=rows.length;rows=rows.filter(r=>r.id!==id);return rows.length!==count;},clear(){rows=[];lastManualCapture=-Infinity;}};
}
export function notebookCSV(rows){
 if(!rows.length)throw new Error('尚無紀錄可下載。');
 const headers=['資料性質','版本','紀錄編號','頁面工作階段','觀察回合','次序','來源','儀器','照明類型','光圈孔位','反光鏡角度','燈光設定','相對通光','照明可判讀','解剖對焦','標本代碼','標本名稱','物鏡倍率','總倍率','視野直徑mm','清晰度%','左右位置','上下位置','粗動','微動','照明','字母定位十字可見','構造已驗證','構造','判讀依據'];
 const escape=v=>'"'+String(v).replaceAll('"','""')+'"';
 const values=r=>['顯微鏡模型示意，非真實量測',r.version,r.id,r.sessionId,r.round,r.sequence,r.sourceLabel,r.instrumentLabel,r.illumination.kind,r.illumination.apertureIndex??'',r.illumination.mirrorAngle??'',r.illumination.lamp??r.light,r.illumination.relative,r.illumination.readable?'是':'否',r.focus??'',r.specimen,r.specimenLabel,r.objective,r.total,r.field,r.clarity,r.stageX,r.stageY,r.coarse,r.fine,r.light,r.referenceVisible?'是':'否',r.observable?'是':'否',r.structures.join('、'),r.basis];
 return '\uFEFF'+[headers,...rows.map(values)].map(row=>row.map(escape).join(',')).join('\r\n')+'\r\n';
}
