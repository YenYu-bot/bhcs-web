export const SCHEMA_VERSION=2;
export const SCENARIO_VERSION='motion-graphs-five-cases-v2';
export const MAX_REVISION=1000000;
export const CASE_IDS=Object.freeze(['R','Uplus','Uminus','Aminus','Aplus']);
export const CASE_LABELS=Object.freeze(Object.fromEntries(CASE_IDS.map((id,i)=>[id,`案例${i+1}`])));
const PARAMETERS={R:[0,0],Uplus:[2,0],Uminus:[-2,0],Aminus:[4,-2],Aplus:[-4,2]};
export const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
export const clone=v=>JSON.parse(JSON.stringify(v));
export function derive(caseId,t){if(!Object.hasOwn(PARAMETERS,caseId)||!Number.isFinite(t)||t<0||t>4)throw new RangeError('Invalid case/time');const[v0,a]=PARAMETERS[caseId];const x=1+v0*t+a*t*t/2,v=v0+a*t;const path=caseId==='R'?0:caseId.startsWith('U')?2*t:t<=2?4*t-t*t:4+(t-2)*(t-2);return freeze({t,x,v,a,displacement:x-1,path});}
const options=values=>values.map(([value,label])=>({value,label}));
const T=options([0,1,2,3,4].map(v=>[v,`${v} 秒`]));
const cases=ids=>options(ids.map(id=>[id,CASE_LABELS[id]]));
const N=(path,label,unit='')=>({path,label,type:'number',unit});
const S=(path,label,opts)=>({path,label,type:'select',options:opts});
const M=(path,label,opts)=>({path,label,type:'multiselect',options:opts});
const time=(path,label)=>S(path,label,T);
const direction=options([['right','向右'],['left','向左'],['still','靜止']]);
const trend=options([['slower','速率變小'],['faster','速率變大'],['steady','速率不變']]);
const sign=options([['positive','正'],['zero','零'],['negative','負']]);
const yesno=options([['yes','是'],['no','否']]);
const slope=options([['positive','斜率為正'],['negative','斜率為負'],['zero','斜率為零']]);
const steepness=options([['growing','斜率絕對值變大'],['shrinking','斜率絕對值變小'],['steady','斜率絕對值不變']]);
const q={};
function add(id,title,prompt,fields,caseId=null){q[id]={id,title,prompt,layer:id[0],caseId,fields,parents:[]};}
for(const c of CASE_IDS.slice(0,3))add(`A1.${c}`,`${CASE_LABELS[c]}：位置的變化`,'選兩個已觀測時刻，用位置的變化求這一段的速度。',[time('tA','較早時刻'),time('tB','較晚時刻'),N('deltaXRaw','位置變化 Δx','m'),N('deltaTRaw','經過時間 Δt','s'),N('velocityRaw','這一段速度 Δx／Δt','m/s'),S('motionChoice','位置圖的形狀',options([['horizontal','水平'],['rising','隨時間上升'],['falling','隨時間下降']]))],c);
add('A1.intercept','位置除以時間就夠嗎？','查看案例2的起點與2秒位置，再判斷能否直接用 x／t 算這段速度。',[S('canUseXOverT','可以直接用 x／t 嗎？',yesno),time('tInitial','引用的初始時刻'),N('xInitialRaw','該初始位置','m'),time('tFinal','引用的後一時刻'),N('xFinalRaw','該後一位置','m')],'Uplus');
const matchFields=[];for(const[c,p]of[['R','r'],['Uplus','plus'],['Uminus','minus']])matchFields.push(time(`${p}TA`,`${CASE_LABELS[c]}：早時刻`),time(`${p}TB`,`${CASE_LABELS[c]}：晚時刻`),S(`${p}Graph`,`${CASE_LABELS[c]}對應哪種速度圖？`,options([['zero','在零速度的水平線'],['positive','在正速度的水平線'],['negative','在負速度的水平線']])));
add('A2.match','位置圖與速度圖配對','引用各案例的兩個時刻，再替同一運動選速度圖。',matchFields);
add('A2.zero','水平線一定是靜止嗎？','在前三個案例中選真正靜止者，再選出你的判斷依據。',[M('stationaryCases','哪些案例真正靜止？',cases(CASE_IDS.slice(0,3))),S('reason','判斷依據',options([['speed-zero','速度本身為零'],['slope-zero','速度圖斜率為零'],['position-positive','位置為正數']])),time('rTA','案例1的較早證據時刻'),time('rTB','案例1的較晚證據時刻')]);
for(const c of CASE_IDS.slice(3))add(`B.first.${c}`,`${CASE_LABELS[c]}：前半段速度變化`,'只使用前半段已觀測證據，核對兩次速度變化，再判斷1秒時的方向與快慢。',[time('tA','第一個時刻'),time('tB','第二個時刻'),time('tC','第三個時刻'),N('deltaV1Raw','第一段 Δv','m/s'),N('deltaT1Raw','第一段 Δt','s'),N('deltaV2Raw','第二段 Δv','m/s'),N('deltaT2Raw','第二段 Δt','s'),N('accelerationRaw','兩段共同的 Δv／Δt','m/s²'),S('direction','1秒時的方向',direction),S('trend','前半段速率如何改變？',trend)],c);
const gridFields=[];for(const[p,label]of[['pp','v正、a正'],['pn','v正、a負'],['np','v負、a正'],['nn','v負、a負']])gridFields.push(S(`${p}Case`,`${label}：證據案例`,cases(CASE_IDS.slice(3))),time(`${p}T`,`${label}：證據時刻`),S(`${p}Direction`,`${label}：方向`,direction),S(`${p}Trend`,`${label}：速率變化`,trend),S(`${p}XtSlope`,`${label}：位置圖局部斜率`,slope),S(`${p}XtSteepness`,`${label}：此半段位置圖陡度`,steepness));
add('B.signGrid','四種正負組合找證據','每格引用不同的案例／時刻，同時讀速度與位置圖；不能把同一證據重複填滿。',gridFields);
for(const c of CASE_IDS.slice(3))add(`C.reverse.${c}`,`${CASE_LABELS[c]}：是否折返？`,'選轉折前、當下及之後的時刻，找速度變號與位置極值。',[time('tBefore','之前時刻'),time('tZero','中間時刻'),time('tAfter','之後時刻'),S('beforeSign','之前速度符號',sign),S('zeroSign','中間速度符號',sign),S('afterSign','之後速度符號',sign),N('turnTimeRaw','轉向時刻','s'),S('extremum','位置圖在該時刻為',options([['maximum','極大位置'],['minimum','極小位置'],['neither','不是極值']]))],c);
add('C.zeroInstant','一瞬間零速度與一直停住','選一個等加速度案例的相鄰證據，和案例1比較。',[S('caseId','引用案例',cases(CASE_IDS.slice(3))),time('tBefore','之前時刻'),time('tZero','中間時刻'),time('tAfter','之後時刻'),S('zeroInstant','中間這一瞬間速度為零嗎？',yesno),S('wholeIntervalStill','整段一直靜止嗎？',yesno),S('comparisonCase','用哪個案例作持續靜止的比較？',cases(CASE_IDS))]);
add('C.truncated','只看到前半段能說什麼？','這題只看0至2秒的已保存證據窗，不把後半段當成已看到。',[S('caseId','證據案例',cases(CASE_IDS.slice(3))),time('windowStart','證據窗起點'),time('windowEnd','證據窗終點'),S('returnObserved','在此證據窗內已觀察到返回嗎？',yesno),S('reason','證據支持的說法',options([['only-reached-zero','只看到速度到零，還沒看到之後的方向'],['already-returned','已經看到返回'],['negative-a-means-left','加速度負就表示往左']]))]);
add('C.negativeUniform','一直向左就是折返嗎？','引用案例3的兩個時刻，區分負速度與速度變號。',[S('caseId','引用案例',cases(CASE_IDS)),time('tA','較早證據時刻'),time('tB','較晚證據時刻'),S('turning','這個案例曾折返嗎？',yesno),S('reason','理由',options([['velocity-keeps-negative','速度一直為負，沒有變號'],['position-crossed-zero','位置穿過零就是折返'],['negative-position','位置為負就是折返']]))],'Uminus');
for(const c of ['Uplus','Uminus'])add(`D.rectangle.${c}`,`${CASE_LABELS[c]}：長方形面積`,'選完整區間，先算面積大小，再判斷位移的正負。',[time('tA','區間起點'),time('tB','區間終點'),N('baseRaw','底：經過時間','s'),N('heightMagnitudeRaw','高：速度大小','m/s'),N('areaMagnitudeRaw','面積大小','m'),N('signedDisplacementRaw','帶符號位移','m')],c);
for(const c of CASE_IDS.slice(3))add(`D.triangle.${c}`,`${CASE_LABELS[c]}：兩個區域合起來`,'選兩半區間，分別算三角形面積與符號，再與首尾位置交叉檢查。',[time('firstStart','第一區起點'),time('firstEnd','第一區終點'),time('secondStart','第二區起點'),time('secondEnd','第二區終點'),N('base1Raw','第一區底','s'),N('height1Raw','第一區高的大小','m/s'),N('area1Raw','第一區面積大小','m'),S('sign1','第一區位移符號',sign),N('base2Raw','第二區底','s'),N('height2Raw','第二區高的大小','m/s'),N('area2Raw','第二區面積大小','m'),S('sign2','第二區位移符號',sign),N('displacementRaw','全程位移','m'),N('pathRaw','全程路程','m'),time('startT','首位置時刻'),time('endT','末位置時刻'),N('startPositionRaw','首位置','m'),N('endPositionRaw','末位置','m')],c);
add('D.compare','位移相同，運動也相同嗎？','三組分開選，使用各案例的資料與圖，而不是單看最後停在哪裡。',[M('zeroDisplacementCases','哪些全程位移為零？',cases(['R','Aminus','Aplus'])),M('zeroPathCases','哪些全程路程為零？',cases(['R','Aminus','Aplus'])),M('turningCases','哪些曾經折返？',cases(['R','Aminus','Aplus']))]);
const GROUPS=[['A1.R','A1.Uplus','A1.Uminus'],['A1.intercept'],['A2.match'],['A2.zero'],['B.first.Aminus','B.first.Aplus'],['B.signGrid'],['C.reverse.Aminus','C.reverse.Aplus'],['C.zeroInstant'],['C.truncated'],['C.negativeUniform'],['D.rectangle.Uplus','D.rectangle.Uminus'],['D.triangle.Aminus','D.triangle.Aplus'],['D.compare']];
GROUPS.forEach((group,i)=>group.forEach(id=>q[id].parents=i?GROUPS[i-1]:[]));
export const QUESTION_IDS=freeze(GROUPS.flat());
export const QUESTION_DEFS=freeze(q);
export const CERTIFICATE_IDS=freeze(['foundation-observed','velocity-ready','accel-second-half','area-ready']);
export const CERTIFICATE_QUESTIONS=freeze({'foundation-observed':QUESTION_IDS.slice(0,4),'velocity-ready':['A2.match','A2.zero'],'accel-second-half':['B.first.Aminus','B.first.Aplus'],'area-ready':['B.signGrid','C.reverse.Aminus','C.reverse.Aplus','C.zeroInstant','C.truncated','C.negativeUniform']});
export function emptyResponse(id){return Object.fromEntries(QUESTION_DEFS[id].fields.map(f=>[f.path,f.type==='number'?'':f.type==='multiselect'?[]:null]));}
export function ancestors(id){const seen=new Set();function visit(key){for(const p of QUESTION_DEFS[key].parents){visit(p);seen.add(p);}}visit(id);return QUESTION_IDS.filter(key=>seen.has(key));}
export function parseNumber(raw){if(typeof raw!=='string'||raw.length>16)return {status:'format'};const s=raw.trim().replaceAll('−','-');if(!s)return {status:'empty'};if(!/^[+-]?\d{1,9}(?:\.\d{1,2})?$/.test(s))return {status:'format'};const negative=s[0]==='-',unsigned=s.replace(/^[+-]/,'');const[a,b='']=unsigned.split('.');const magnitude=Number(a)*100+Number(b.padEnd(2,'0'));const hundredths=magnitude===0?0:(negative?-1:1)*magnitude;return {status:'valid',hundredths,value:hundredths/100};}
/** SHA-256 of UTF-8 canonical data. Synchronous to keep model transitions atomic. */
export function hash(text){
 const bytes=new TextEncoder().encode(text),length=bytes.length,paddedLength=Math.ceil((length+9)/64)*64,data=new Uint8Array(paddedLength);data.set(bytes);data[length]=128;const view=new DataView(data.buffer);view.setUint32(paddedLength-8,Math.floor(length/536870912));view.setUint32(paddedLength-4,(length*8)>>>0);
 const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
 const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64),rotr=(x,n)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<paddedLength;offset+=64){for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4);for(let i=16;i<64;i++){const a=w[i-15],b=w[i-2],s0=rotr(a,7)^rotr(a,18)^(a>>>3),s1=rotr(b,17)^rotr(b,19)^(b>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;}let[a,b,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){const s1=rotr(e,6)^rotr(e,11)^rotr(e,25),ch=(e&f)^(~e&g),t1=(h+s1+ch+K[i]+w[i])>>>0,s0=rotr(a,2)^rotr(a,13)^rotr(a,22),maj=(a&b)^(a&c)^(b&c),t2=(s0+maj)>>>0;h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;}[a,b,c,d,e,f,g,h].forEach((v,i)=>H[i]=(H[i]+v)>>>0);}
 return H.map(v=>v.toString(16).padStart(8,'0')).join('');
}
export function canonical(value){if(value===null||typeof value!=='object')return JSON.stringify(value);if(Array.isArray(value))return`[${value.map(canonical).join(',')}]`;return`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;}
export const fingerprint=value=>hash(canonical(value));
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const integer=(v,min=0,max=MAX_REVISION)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const ident=v=>typeof v==='string'&&v.length>0&&v.length<=200;
const digest=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const same=(a,b)=>canonical(a)===canonical(b);
function keys(v,allowed){if(!obj(v)||Object.keys(v).length!==allowed.length||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unknown or missing fields');}
export function validateResponse(id,response){try{const fields=QUESTION_DEFS[id]?.fields;if(!fields)return false;keys(response,fields.map(f=>f.path));for(const f of fields){const v=response[f.path];if(f.type==='number'){if(typeof v!=='string'||v.length>16)return false;}else if(f.type==='select'){if(v!==null&&!f.options.some(o=>o.value===v))return false;}else if(!Array.isArray(v)||v.length>f.options.length||new Set(v).size!==v.length||v.some(x=>!f.options.some(o=>o.value===x)))return false;}return true;}catch{return false;}}
export function sampleFingerprint(caseData,sample){return fingerprint([caseData.caseId,caseData.runId,caseData.scenarioVersion,sample]);}
export function caseFingerprint(c){return fingerprint([c.caseId,c.runId,c.scenarioVersion,c.samples]);}
export function selectedEvidence(s,id,r){
 const refs=[],missing=[];
 const add=(c,t)=>{const data=s.cases[c],sample=data?.samples[t];if(!CASE_IDS.includes(c)||!integer(t,0,4)||!sample||sample.t!==t){missing.push(`${c}:${t}`);return;}const key=`${c}:${t}`;if(refs.some(v=>`${v.caseId}:${v.t}`===key))return;refs.push({caseId:c,caseRunId:data.runId,scenarioVersion:SCENARIO_VERSION,t,sampleFingerprint:sampleFingerprint(data,sample)});};
 const range=(c,start,end)=>{for(let t=start;t<=end;t++)add(c,t);};
 if(id.startsWith('A1.')&&id!=='A1.intercept'){const c=id.slice(3);add(c,r.tA);add(c,r.tB);}
 else if(id==='A1.intercept'){add('Uplus',r.tInitial);add('Uplus',r.tFinal);}
 else if(id==='A2.match'){for(const[c,p]of[['R','r'],['Uplus','plus'],['Uminus','minus']]){add(c,r[`${p}TA`]);add(c,r[`${p}TB`]);}}
 else if(id==='A2.zero'){add('R',r.rTA);add('R',r.rTB);range('Uplus',0,4);range('Uminus',0,4);}
 else if(id.startsWith('B.first.')){const c=id.slice(8);for(const f of['tA','tB','tC'])add(c,r[f]);}
 else if(id==='B.signGrid'){for(const p of['pp','pn','np','nn']){const t=r[`${p}T`],c=r[`${p}Case`];if(!integer(t,0,4)){missing.push(p);continue;}for(const n of[t-1,t,t+1])add(c,n);}}
 else if(id.startsWith('C.reverse.')){for(const f of['tBefore','tZero','tAfter'])add(id.slice(10),r[f]);}
 else if(id==='C.zeroInstant'){for(const f of['tBefore','tZero','tAfter'])add(r.caseId,r[f]);range(r.comparisonCase,0,4);}
 else if(id==='C.truncated'){if(integer(r.windowStart,0,4)&&integer(r.windowEnd,0,4)&&r.windowStart<=r.windowEnd)range(r.caseId,r.windowStart,r.windowEnd);else missing.push('window');}
 else if(id==='C.negativeUniform'){add(r.caseId,r.tA);add(r.caseId,r.tB);}
 else if(id.startsWith('D.rectangle.')){const c=id.slice(12);add(c,r.tA);add(c,r.tB);}
 else if(id.startsWith('D.triangle.')){const c=id.slice(11);for(const f of['firstStart','firstEnd','secondStart','secondEnd','startT','endT'])add(c,r[f]);}
 else if(id==='D.compare'){for(const c of['R','Aminus','Aplus'])range(c,0,4);}
 refs.sort((a,b)=>CASE_IDS.indexOf(a.caseId)-CASE_IDS.indexOf(b.caseId)||a.t-b.t);return {refs,missing};
}
export function evaluateQuestion(s,id,r){
 if(!validateResponse(id,r))return {passed:false,ready:false,issues:['invalid-response'],selectedEvidence:[]};
 const issues=[],ev=selectedEvidence(s,id,r),eq=(f,v)=>{if(r[f]!==v)issues.push(f);},num=(f,v)=>{const p=parseNumber(r[f]);if(p.status!=='valid'||p.hundredths!==v*100)issues.push(f);},set=(f,v)=>{if(!same([...r[f]].sort(),[...v].sort()))issues.push(f);},ordered=(a,b)=>{if(!integer(r[a],0,4)||!integer(r[b],0,4)||r[a]>=r[b])issues.push(a,b);};
 let completeEvidence=true;
 const requireThrough=(c,t)=>{if((s.cases[c]?.observedInteger??-1)<t)completeEvidence=false;};
 if(id.startsWith('A1.')&&id!=='A1.intercept'){
  const c=id.slice(3);requireThrough(c,4);ordered('tA','tB');if(integer(r.tA,0,4)&&integer(r.tB,0,4)&&r.tA<r.tB){const dt=r.tB-r.tA,dx=derive(c,r.tB).x-derive(c,r.tA).x;num('deltaXRaw',dx);num('deltaTRaw',dt);num('velocityRaw',dx/dt);}if(c==='Uplus'){eq('tA',1);eq('tB',3);}eq('motionChoice',c==='R'?'horizontal':c==='Uplus'?'rising':'falling');
 }else if(id==='A1.intercept'){eq('canUseXOverT','no');eq('tInitial',0);eq('tFinal',2);num('xInitialRaw',1);num('xFinalRaw',5);}
 else if(id==='A2.match'){for(const[c,p,g]of[['R','r','zero'],['Uplus','plus','positive'],['Uminus','minus','negative']]){requireThrough(c,4);ordered(`${p}TA`,`${p}TB`);eq(`${p}Graph`,g);}}
 else if(id==='A2.zero'){set('stationaryCases',['R']);eq('reason','speed-zero');ordered('rTA','rTB');}
 else if(id.startsWith('B.first.')){const c=id.slice(8),a=c==='Aminus'?-2:2;requireThrough(c,2);eq('tA',0);eq('tB',1);eq('tC',2);num('deltaV1Raw',a);num('deltaT1Raw',1);num('deltaV2Raw',a);num('deltaT2Raw',1);num('accelerationRaw',a);eq('direction',c==='Aminus'?'right':'left');eq('trend','slower');}
 else if(id==='B.signGrid'){
  requireThrough('Aminus',4);requireThrough('Aplus',4);const used=new Set();for(const[p,c,t,d,tr,sg,st]of[['pp','Aplus',3,'right','faster','positive','growing'],['pn','Aminus',1,'right','slower','positive','shrinking'],['np','Aplus',1,'left','slower','negative','shrinking'],['nn','Aminus',3,'left','faster','negative','growing']]){eq(`${p}Case`,c);eq(`${p}T`,t);eq(`${p}Direction`,d);eq(`${p}Trend`,tr);eq(`${p}XtSlope`,sg);eq(`${p}XtSteepness`,st);used.add(`${r[`${p}Case`]}:${r[`${p}T`]}`);}if(used.size!==4)issues.push('duplicate-evidence');
 }else if(id.startsWith('C.reverse.')){const c=id.slice(10);eq('tBefore',1);eq('tZero',2);eq('tAfter',3);eq('beforeSign',c==='Aminus'?'positive':'negative');eq('zeroSign','zero');eq('afterSign',c==='Aminus'?'negative':'positive');num('turnTimeRaw',2);eq('extremum',c==='Aminus'?'maximum':'minimum');}
 else if(id==='C.zeroInstant'){if(!['Aminus','Aplus'].includes(r.caseId))issues.push('caseId');eq('tBefore',1);eq('tZero',2);eq('tAfter',3);eq('zeroInstant','yes');eq('wholeIntervalStill','no');eq('comparisonCase','R');}
 else if(id==='C.truncated'){if(!['Aminus','Aplus'].includes(r.caseId))issues.push('caseId');eq('windowStart',0);eq('windowEnd',2);eq('returnObserved','no');eq('reason','only-reached-zero');}
 else if(id==='C.negativeUniform'){eq('caseId','Uminus');ordered('tA','tB');eq('turning','no');eq('reason','velocity-keeps-negative');}
 else if(id.startsWith('D.rectangle.')){const c=id.slice(12);eq('tA',0);eq('tB',4);num('baseRaw',4);num('heightMagnitudeRaw',2);num('areaMagnitudeRaw',8);num('signedDisplacementRaw',c==='Uplus'?8:-8);}
 else if(id.startsWith('D.triangle.')){const c=id.slice(11);for(const[f,v]of[['firstStart',0],['firstEnd',2],['secondStart',2],['secondEnd',4],['startT',0],['endT',4]])eq(f,v);for(const[f,v]of[['base1Raw',2],['height1Raw',4],['area1Raw',4],['base2Raw',2],['height2Raw',4],['area2Raw',4],['displacementRaw',0],['pathRaw',8],['startPositionRaw',1],['endPositionRaw',1]])num(f,v);eq('sign1',c==='Aminus'?'positive':'negative');eq('sign2',c==='Aminus'?'negative':'positive');}
 else if(id==='D.compare'){set('zeroDisplacementCases',['R','Aminus','Aplus']);set('zeroPathCases',['R']);set('turningCases',['Aminus','Aplus']);}
 const ready=ev.missing.length===0&&completeEvidence;return {passed:ready&&issues.length===0,ready,issues:[...new Set(issues)],selectedEvidence:ev.refs};
}
export function emptySnapshot(courseRunId,caseRunIds){const caseMap={};for(const id of CASE_IDS){const c={caseId:id,runId:caseRunIds[id],scenarioVersion:SCENARIO_VERSION,samples:[],observedInteger:null,sampleFingerprint:''};c.sampleFingerprint=caseFingerprint(c);caseMap[id]=c;}return {schemaVersion:SCHEMA_VERSION,scenarioVersion:SCENARIO_VERSION,courseRunId,storageRevision:0,cases:caseMap,answers:Object.fromEntries(QUESTION_IDS.map(id=>[id,{revision:0,response:emptyResponse(id),currentCheck:null}])),certificates:[],history:[],reflection:''};}
export function makeCheck(s,id){const answer=s.answers[id],evaluation=evaluateQuestion(s,id,answer.response);return {questionId:id,answerRevision:answer.revision,responseFingerprint:fingerprint(answer.response),selectedEvidence:evaluation.selectedEvidence,evidenceFingerprint:fingerprint(evaluation.selectedEvidence),upstream:ancestors(id).map(parent=>({questionId:parent,checkFingerprint:fingerprint(s.answers[parent].currentCheck)})),passed:evaluation.passed};}
export function hasCertificate(s,id){return s.certificates.some(c=>c.certificateId===id);}
export function questionLayerAvailable(s,id){if(id.startsWith('A1.'))return true;if(id.startsWith('A2.'))return hasCertificate(s,'foundation-observed');if(id.startsWith('B.first.'))return hasCertificate(s,'velocity-ready');if(id==='B.signGrid'||id.startsWith('C.'))return hasCertificate(s,'accel-second-half');return hasCertificate(s,'area-ready');}
export function statusOf(s){const passedQuestions=QUESTION_IDS.filter(id=>s.answers[id].currentCheck?.passed===true),passed=new Set(passedQuestions),caseWindows=Object.fromEntries(CASE_IDS.map(c=>[c,c.startsWith('A')?(hasCertificate(s,'velocity-ready')?(hasCertificate(s,'accel-second-half')?4:2):0):4]));return {passedQuestions,availableQuestions:QUESTION_IDS.filter(id=>questionLayerAvailable(s,id)&&QUESTION_DEFS[id].parents.every(p=>passed.has(p))),reviewQuestions:QUESTION_IDS.filter(id=>s.answers[id].revision>0||s.answers[id].currentCheck!==null),canVelocity:hasCertificate(s,'foundation-observed'),hasFoundation:hasCertificate(s,'foundation-observed'),caseWindows,complete:passedQuestions.length===QUESTION_IDS.length&&CASE_IDS.every(c=>s.cases[c].observedInteger===4)};}
function validateCurrentCheck(s,id,answer,proofs,relaxedExternal=new Set()){
 const c=answer.currentCheck;keys(c,['questionId','answerRevision','responseFingerprint','selectedEvidence','evidenceFingerprint','upstream','passed']);
 if(c.questionId!==id||c.answerRevision!==answer.revision||!digest(c.responseFingerprint)||c.responseFingerprint!==fingerprint(answer.response)||typeof c.passed!=='boolean'||!Array.isArray(c.selectedEvidence)||!digest(c.evidenceFingerprint)||!Array.isArray(c.upstream))throw Error('Invalid current check fields');
 const result=evaluateQuestion(s,id,answer.response);if(!result.ready||!same(c.selectedEvidence,result.selectedEvidence)||c.evidenceFingerprint!==fingerprint(result.selectedEvidence)||c.passed!==result.passed)throw Error('Invalid check evidence or result');
 const required=ancestors(id);if(c.upstream.length!==required.length)throw Error('Missing upstream checks');
 c.upstream.forEach((u,i)=>{keys(u,['questionId','checkFingerprint']);const parent=required[i];if(u.questionId!==parent||!digest(u.checkFingerprint)||!proofs[parent]?.currentCheck?.passed)throw Error('Invalid upstream dependency');if(!relaxedExternal.has(parent)&&u.checkFingerprint!==fingerprint(proofs[parent].currentCheck))throw Error('Stale upstream check');});
}
function validateAnswer(id,answer){keys(answer,['revision','response','currentCheck']);if(!integer(answer.revision)||!validateResponse(id,answer.response))throw Error('Invalid answer');}
function validateCertificates(s){
 if(!Array.isArray(s.certificates)||s.certificates.length>4)throw Error('Invalid certificates');const historical={};
 s.certificates.forEach((cert,index)=>{
  keys(cert,['certificateId','parentCertificateId','courseRunId','scenarioVersion','proofs']);const id=CERTIFICATE_IDS[index],required=CERTIFICATE_QUESTIONS[id];
  if(cert.certificateId!==id||cert.parentCertificateId!==(index?CERTIFICATE_IDS[index-1]:null)||cert.courseRunId!==s.courseRunId||cert.scenarioVersion!==SCENARIO_VERSION||!Array.isArray(cert.proofs)||cert.proofs.length!==required.length)throw Error('Invalid certificate parent chain');
  const external=new Set(Object.keys(historical));
  cert.proofs.forEach((proof,i)=>{keys(proof,['questionId','revision','response','currentCheck']);const qid=required[i];if(proof.questionId!==qid)throw Error('Invalid certificate question');const answer={revision:proof.revision,response:proof.response,currentCheck:proof.currentCheck};validateAnswer(qid,answer);if(!answer.currentCheck?.passed)throw Error('Invalid certificate result');validateCurrentCheck(s,qid,answer,historical,external);historical[qid]=answer;});
 });return historical;
}
export function validateSnapshot(value){try{
 keys(value,['schemaVersion','scenarioVersion','courseRunId','storageRevision','cases','answers','certificates','history','reflection']);
 if(value.schemaVersion!==SCHEMA_VERSION||value.scenarioVersion!==SCENARIO_VERSION||!ident(value.courseRunId)||!integer(value.storageRevision)||typeof value.reflection!=='string'||value.reflection.length>500)throw Error('Invalid course header');
 keys(value.cases,CASE_IDS);const runIds=[];
 for(const id of CASE_IDS){const c=value.cases[id];keys(c,['caseId','runId','scenarioVersion','samples','observedInteger','sampleFingerprint']);if(c.caseId!==id||!ident(c.runId)||c.scenarioVersion!==SCENARIO_VERSION||!Array.isArray(c.samples)||c.samples.length>5||c.observedInteger!==(c.samples.length?c.samples.length-1:null)||!digest(c.sampleFingerprint))throw Error('Invalid case prefix');runIds.push(c.runId);c.samples.forEach((sample,t)=>{keys(sample,['t','x','captureMode','sequence']);if(sample.t!==t||sample.sequence!==t||sample.x!==derive(id,t).x||!(t===0?sample.captureMode==='initial':['animated','step'].includes(sample.captureMode)))throw Error('Invalid model observation');});if(c.sampleFingerprint!==caseFingerprint(c))throw Error('Invalid case fingerprint');}
 if(new Set(runIds).size!==CASE_IDS.length||runIds.includes(value.courseRunId))throw Error('Duplicate run identity');
 validateCertificates(value);
 for(const id of ['Aminus','Aplus']){const c=value.cases[id];if(c.samples.length&&!hasCertificate(value,'velocity-ready'))throw Error('Acceleration evidence without prerequisite certificate');if(c.observedInteger>2&&!hasCertificate(value,'accel-second-half'))throw Error('Second half without certificate');}
 keys(value.answers,QUESTION_IDS);const checked={};for(const id of QUESTION_IDS){const a=value.answers[id];validateAnswer(id,a);if(!questionLayerAvailable(value,id)&&(!same(a.response,emptyResponse(id))||a.revision!==0||a.currentCheck!==null))throw Error('Later answers without certificate');if(a.currentCheck!==null)validateCurrentCheck(value,id,a,checked);checked[id]=a;}
 if(!Array.isArray(value.history)||value.history.length>100)throw Error('Invalid history');for(const h of value.history){keys(h,['questionId','revision','passed','createdAt']);if(!QUESTION_IDS.includes(h.questionId)||!integer(h.revision)||typeof h.passed!=='boolean'||typeof h.createdAt!=='string'||!Number.isFinite(Date.parse(h.createdAt)))throw Error('Invalid history item');}
 if(new TextEncoder().encode(JSON.stringify(value)).byteLength>128*1024)throw Error('Course capacity exceeded');
 return {ok:true,snapshot:freeze(clone(value))};
 }catch(error){return {ok:false,error:error.message};}}
