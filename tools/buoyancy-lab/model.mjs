/** Deterministic teaching model; no timers, DOM, or storage. */
export const MODEL_VERSION='buoyancy-1.2-g10';
export const FLUIDS=Object.freeze({water:Object.freeze({name:'清水',density:1000}),brine:Object.freeze({name:'濃鹽水',density:1200})});
let serial=0;
const clone=x=>structuredClone(x);
// Integrity checksum detects accidental or out-of-band state edits; not a security signature.
const checksum=x=>{const copy={...x};delete copy.integrity;let h=2166136261;for(const c of JSON.stringify(copy)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(16)};
const seal=x=>{x.integrity=checksum(x);return freeze(x)};
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x)}return x};
export function createRun(fluid='water') {if(!FLUIDS[fluid])throw Error('未知液體');const id=`run-${Date.now()}-${++serial}`;return seal({runId:id,modelVersion:MODEL_VERSION,objectId:'aluminum-A',fluidId:fluid,density:FLUIDS[fluid].density,V:50,g:10,revision:0,stage:0,valid:true,invalidReason:'',zeroed:false,hung:false,dry:true,contact:false,wConfirmed:false,tankReady:false,filling:false,wasteAtOutlet:false,cupLocation:'shelf',cupId:`cup-${id}`,tareId:null,step:0,f:0,outVolume:0,cupVolume:0,pendingVolume:0,dripping:false,locked:false,evidence:{W:null,T:null,mass:null},observed:false,calcCorrect:false,calculation:null,explanation:''})}
export function parseForce(input){if(typeof input!=='string'&&typeof input!=='number')return null;const s=String(input).trim();if(!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))return null;const [whole,frac='']=s.split('.');if(frac.length>3)return null;const n=Number(whole||0)*1000+Number((frac+'000').slice(0,3));return Number.isSafeInteger(n)?n:null}
export function reading(s){return {forceN:s.hung?(1350-s.density*0.5*s.f)/1000:0,massG:s.cupLocation==='scale'&&s.tareId===s.cupId?s.cupVolume*s.density/1000:null,volumeCm3:s.cupVolume}}
export function validate(s){
 if(!s||s.integrity!==checksum(s))return '本輪狀態在操作程序外改變，請重新準備。';
 if(!s||!FLUIDS[s.fluidId]||s.modelVersion!==MODEL_VERSION||s.objectId!=='aluminum-A'||s.density!==FLUIDS[s.fluidId].density||s.V!==50||s.g!==10)return '模型或液體設定改變，請重新準備。';
 if(!Number.isInteger(s.step)||s.step<0||s.step>10||s.f!==s.step/10)return '浸沒狀態異常，請重新準備。';
 if(![s.outVolume,s.cupVolume,s.pendingVolume].every(Number.isFinite)||s.outVolume!==5*s.step||s.cupVolume<0||s.pendingVolume<0||s.outVolume>50||Math.abs(s.cupVolume+s.pendingVolume-s.outVolume)>1e-9)return '排液守恆失效，請重新準備。';
 if(s.contact)return '鋁塊碰到槽底或槽壁，本輪失效。';
 if(s.step>0&&(!s.hung||!s.tankReady||s.tareId!==s.cupId||s.wasteAtOutlet||(!s.evidence.T&&s.cupLocation!=='outlet')))return '收集或吊掛狀態改變，本輪失效。';
 if(s.wasteAtOutlet&&s.cupLocation==='outlet')return '出口只能放一只杯子。';
 if(s.step>0&&!s.evidence.W)return '缺少本輪空氣中基準。';
 for(const [k,e] of Object.entries(s.evidence)){if(!e)continue;if(e.runId!==s.runId||e.modelVersion!==s.modelVersion||e.objectId!==s.objectId||e.fluidId!==s.fluidId||e.cupId!==s.cupId||e.revision>s.revision||e.revision<0||!e.conditions||e.conditions.revision!==e.revision)return '證據來源不一致，請重新準備。';const expected=k==='W'?1350:k==='T'?1350-s.density*.5:s.density*.05;if(e.value!==expected)return '原始讀值被改變，本輪失效。';if(k!=='W'&&(e.tareId!==s.tareId||s.step!==10||!s.locked))return '液中證據條件已改變，本輪失效。';const c=e.conditions;if(!c.zeroed||!c.hung||c.contact||c.dripping)return '原始量測條件無效。';if(k==='W'&&(!c.dry||c.f!==0))return '空氣中基準條件無效。';if(k!=='W'&&(c.f!==1||!c.locked||!c.tankReady))return '完全浸沒條件無效。';if(k==='T'&&c.cupLocation!=='outlet'||k==='mass'&&c.cupLocation!=='scale')return '原始收集杯位置無效。'}
 return '';
}
const tooPrecise=v=>/^\d*\.\d{4,}$/.test(String(v??'').trim());
const requireState=(ok,msg)=>{if(!ok)throw Error(msg)};
function evidence(s,value){return {runId:s.runId,modelVersion:s.modelVersion,objectId:s.objectId,fluidId:s.fluidId,cupId:s.cupId,tareId:s.tareId,revision:s.revision,value,conditions:{revision:s.revision,zeroed:s.zeroed,dry:s.dry,hung:s.hung,f:s.f,tankReady:s.tankReady,cupLocation:s.cupLocation,dripping:s.dripping,locked:s.locked,contact:s.contact}}}
export function act(state,type,p={}){
 if(p.expectedRunId!==undefined&&p.expectedRunId!==state.runId)return state;if(p.expectedRevision!==undefined&&p.expectedRevision!==state.revision)return state;
 const invalid=validate(state);if(invalid)return freeze({...clone(state),valid:false,invalidReason:invalid});requireState(state.valid,state.invalidReason||'請重新準備這一輪。');const s=clone(state);s.revision++;
 switch(type){
 case 'zero':requireState(!s.hung&&!s.evidence.W,'必須先讓空秤歸零。');s.zeroed=true;break;
 case 'hang':requireState(s.zeroed&&!s.hung&&!s.evidence.W,'請先空秤歸零。');s.hung=true;break;
 case 'recordW':if(s.evidence.W)return state;requireState(s.zeroed&&s.hung&&s.dry&&!s.contact&&s.step===0,'請先掛上乾燥鋁塊，保持懸空。');s.evidence.W=evidence(s,1350);break;
 case 'transcribeW':requireState(s.evidence.W,'請先記下空氣中讀值。');requireState(!tooPrecise(p.value),'請輸入最多三位小數（單位 N），不需補更多位數。');requireState(parseForce(p.value)===1350,'再看彈簧秤，注意小數點與 N。');if(s.wConfirmed)return state;s.wConfirmed=true;s.stage=1;break;
 case 'placeWaste':requireState(s.wConfirmed&&!s.tankReady&&!s.filling&&s.cupLocation!=='outlet','請先完成空氣中讀值，出口需空出。');s.wasteAtOutlet=true;break;
 case 'fill':requireState(s.wConfirmed&&s.wasteAtOutlet&&!s.tankReady&&!s.filling&&s.step===0,'請先放好廢液杯，鋁塊須在溢流口上方。');s.filling=true;s.dripping=true;break;
 case 'settle':if(!s.dripping)return state;if(s.filling){s.filling=false;s.tankReady=true;}else{s.cupVolume+=s.pendingVolume;s.pendingVolume=0;}s.dripping=false;break;
 case 'removeWaste':requireState(s.tankReady&&!s.dripping&&s.wasteAtOutlet,'等準備滴流停止，再移走廢液杯。');s.wasteAtOutlet=false;break;
 case 'cupToScale':requireState(!s.dripping&&(s.step===0&&s.tankReady||s.step===10&&s.evidence.T&&s.observed),'請等滴流停止並完成本階段觀察，再移杯。');s.cupLocation='scale';break;
 case 'tare':requireState(s.cupLocation==='scale'&&s.step===0&&s.cupVolume===0&&!s.evidence.T,'杯內有排液時不可去皮，否則會扣掉液體。');s.tareId=s.cupId;break;
 case 'cupToOutlet':requireState(s.tankReady&&!s.dripping&&!s.wasteAtOutlet&&s.tareId===s.cupId&&s.step===0,'請先移走廢液杯，並將同一只空杯去皮。');s.cupLocation='outlet';break;
 case 'lower':requireState(s.wConfirmed&&s.tankReady&&s.cupLocation==='outlet'&&s.tareId===s.cupId&&!s.dripping,'請先完成準備、收集杯就位並等滴流停止。');if(s.step===10)return state;s.step++;s.f=s.step/10;s.outVolume=s.step*5;s.pendingVolume+=5;s.dripping=true;s.dry=false;s.locked=s.step===10;break;
 case 'recordT':if(s.evidence.T)return state;requireState(s.step===10&&s.locked&&!s.dripping&&s.cupVolume===50,'尚未完全浸沒或仍在滴流，不能記正式 T。');s.evidence.T=evidence(s,1350-s.density*.5);break;
 case 'observe':requireState(s.evidence.T,'請先記下液中讀值。');requireState(p.answer==='smaller','把兩張讀值卡並排看。');if(s.observed)return state;s.observed=true;s.stage=2;break;
 case 'recordMass':if(s.evidence.mass)return state;requireState(s.evidence.T&&s.observed&&s.cupLocation==='scale'&&s.tareId===s.cupId&&!s.dripping&&s.cupVolume===50,'請把完整收集杯放回原天平。');s.evidence.mass=evidence(s,s.density*.05);break;
 case 'calculate':requireState(s.evidence.W&&s.evidence.T&&s.evidence.mass,'先取得同一輪的三筆證據。');requireState(String(p.difference??'').trim()&&String(p.displaced??'').trim(),'先填兩個計算結果。');requireState(!tooPrecise(p.difference)&&!tooPrecise(p.displaced),'請輸入最多三位小數（單位 N），不需補更多位數。');requireState(parseForce(p.difference)===s.density*.5,'再檢查 W − T 的相減與小數點。');requireState(parseForce(p.displaced)===s.density*.5,'先把 g ÷ 1000 換成 kg，再乘以 10。');s.calcCorrect=true;s.calculation={difference:parseForce(p.difference),displaced:parseForce(p.displaced)};break;
 case 'explain':requireState(s.calcCorrect,'請先核對兩個計算。');requireState(String(p.text??'').trim(),'請先寫下你的觀察與證據。');s.explanation=String(p.text).trim();s.stage=3;break;
 default:throw Error('不支援的操作');
 }
 s.integrity=checksum(s);const reason=validate(s);if(reason){s.valid=false;s.invalidReason=reason}return freeze(s);
}
export function saveSnapshot(s,explanation=s.explanation){requireState(s.valid&&!validate(s)&&s.calcCorrect&&s.evidence.mass&&String(explanation).trim(),'本輪證據或解釋尚未完成。');return seal({...clone(s),explanation:String(explanation).trim(),savedAt:new Date().toISOString(),idempotencyKey:s.runId})}
export function compatible(a,b){return !!(a&&b&&a.valid&&b.valid&&!validate(a)&&!validate(b)&&a.calcCorrect&&b.calcCorrect&&a.explanation&&b.explanation&&a.modelVersion===b.modelVersion&&a.objectId===b.objectId&&a.fluidId!==b.fluidId&&[a.fluidId,b.fluidId].includes('water')&&[a.fluidId,b.fluidId].includes('brine'))}
