import {outcome} from './inquiry.mjs';
import {acidOutcome} from './acid.mjs';

// Only retained observations are evidence. Current cups and graph links are not
// substitutes for a student's explicit selection in this review.
const freeze = value => {
 if(value && typeof value==='object') {
  Object.values(value).forEach(freeze);
  Object.freeze(value);
 }
 return value;
};
export const OPTIONS=freeze({
 origin:{
  donor:[{value:'Zn',label:'金屬鋅 Zn'},{value:'Cu2',label:'銅離子 Cu²⁺'},{value:'SO4',label:'硫酸根 SO₄²⁻'}],
  acceptor:[{value:'Cu2',label:'銅離子 Cu²⁺'},{value:'Zn',label:'金屬鋅 Zn'},{value:'SO4',label:'硫酸根 SO₄²⁻'}],
  deposit:[{value:'Cu',label:'銅離子得到電子，形成金屬銅'},{value:'Zn',label:'鋅直接變成了銅'},{value:'Cu2',label:'仍然是銅離子，沒有改變'}]
 },
 acids:{answer:[
  {value:'need-direct',label:'還不能排序，需要直接比較鋅與鐵的證據'},
  {value:'Zn-greater',label:'能，表示鋅的活性比鐵大'},
  {value:'Fe-greater',label:'能，表示鐵的活性比鋅大'},
  {value:'equal',label:'能，表示鋅和鐵的活性相同'}
 ]},
 source:{answer:[
  {value:'reference',label:'本課提供、由我採用的 H > Cu 參考資料'},
  {value:'no-bubbles',label:'只靠銅沒有氣泡的這張紀錄'},
  {value:'acid-bubbles',label:'只靠鋅與鐵都有氣泡的紀錄'}
 ]}
});
export const QUESTIONS=freeze({
 origin:{title:'紅棕色的銅從哪裡來？',recordId:'選一張自己的鋅＋硫酸銅觀察紀錄',donor:'在反應模型中，誰失去電子？',acceptor:'誰得到電子？',deposit:'析出的銅是怎麼形成的？'},
 acids:{title:'兩杯都有氣泡，能排出鋅與鐵嗎？',zincId:'選一張自己的鋅＋稀鹽酸紀錄',ironId:'選一張自己的鐵＋稀鹽酸紀錄',answer:'只靠這兩杯都有氣泡，能確定鋅與鐵的活性先後嗎？',evidenceId:'再從自己的鹽類溶液紀錄，選一張能直接支持鋅與鐵先後的證據'},
 source:{title:'H > Cu 的依據從哪裡來？',copperId:'選一張自己的銅＋稀鹽酸紀錄',answer:'這一課的 H > Cu，應該標示哪一種依據？'}
});
const SECTIONS=['origin','acids','source'];
const ID_FIELDS=freeze({origin:{recordId:'r'},acids:{zincId:'a',ironId:'a',evidenceId:'r'},source:{copperId:'a'}});
const isObject=value=>!!value && typeof value==='object' && !Array.isArray(value);
const own=(value,key)=>isObject(value)&&Object.hasOwn(value,key);
const isId=(value,prefix)=>typeof value==='string' && value.trim()===value && (prefix==='r'?/^r[1-9]\d{0,5}$/:/^a[1-9]\d{0,5}$/).test(value);
export function freshReview(){
 return {version:1,open:false,answers:{
  origin:{recordId:null,donor:null,acceptor:null,deposit:null,checked:false},
  acids:{zincId:null,ironId:null,answer:null,evidenceId:null,checked:false},
  source:{copperId:null,answer:null,checked:false}
 }};
}

function retainedRecords(state,prefix){
 const input=prefix==='r'?state?.records:state?.lesson?.records;
 if(!Array.isArray(input))return [];
 const counts=new Map();
 for(const r of input)if(own(r,'id')&&isId(r.id,prefix))counts.set(r.id,(counts.get(r.id)||0)+1);
 return input.filter(r=>own(r,'id')&&own(r,'metal')&&(prefix==='a'||own(r,'solution'))&&isId(r.id,prefix)&&counts.get(r.id)===1&&
  (prefix==='r'?!!outcome(r.metal,r.solution):!!acidOutcome(r.metal)))
  .map(r=>prefix==='r'?{id:r.id,metal:r.metal,solution:r.solution,kind:r.kind==='base'?'base':'extra'}:{id:r.id,metal:r.metal});
}
function normalizeField(section,field,value){
 if(value===null||value==='')return null;
 if(own(ID_FIELDS[section],field))return isId(value,ID_FIELDS[section][field])?value:null;
 return OPTIONS[section]?.[field]?.some(option=>option.value===value)?value:null;
}

// `checked` only remembers an explicit check, never its outcome. The assessment
// below recalculates every dependency, including after removal of a reference.
export function restoreReview(data,state){
 const review=freshReview();
 if(!own(data,'version')||data.version!==1||!own(data,'answers')||!isObject(data.answers))return review;
 review.open=own(data,'open')&&data.open===true;
 const records=state===undefined?null:{r:retainedRecords(state,'r'),a:retainedRecords(state,'a')};
 for(const section of SECTIONS){
  const source=own(data.answers,section)?data.answers[section]:null,target=review.answers[section];
  if(!isObject(source))continue;
  let unchanged=true;
  for(const field of Object.keys(target).filter(field=>field!=='checked')){
   let value=normalizeField(section,field,own(source,field)?source[field]:null);
   const prefix=ID_FIELDS[section][field];
   if(prefix&&value!==null&&records&&!records[prefix].some(r=>r.id===value))value=null;
   target[field]=value;
   if(value!==source[field])unchanged=false;
  }
  target.checked=own(source,'checked')&&source.checked===true&&unchanged&&Object.entries(target).every(([key,value])=>key==='checked'||value!==null);
 }
 return review;
}
export function setReviewOpen(review,open){
 const next=restoreReview(review);
 if(typeof open==='boolean')next.open=open;
 return next;
}
export function updateReview(review,section,field,value){
 const next=restoreReview(review);
 if(typeof section!=='string'||typeof field!=='string'||!SECTIONS.includes(section)||!own(next.answers[section],field))return next;
 if(field==='checked'){
  if(typeof value==='boolean')next.answers[section].checked=value;
  return next;
 }
 const normalized=normalizeField(section,field,value);
 // Invalid UI/programmatic values are ignored; explicit null/empty clears.
 if(normalized===null&&value!==null&&value!=='')return next;
 if(next.answers[section][field]!==normalized){
  next.answers[section][field]=normalized;
  next.answers[section].checked=false;
 }
 return next;
}

function result(answer,{missing,reason,feedback,valid=false,success,correction,...metadata}){
 const complete=Object.entries(answer).every(([key,value])=>key==='checked'||value!==null);
 const checked=answer.checked===true;
 const status=missing?'missing':!checked?'ready':valid?'verified':'revise';
 return {status,checked,complete,canCheck:!missing,valid:!missing&&valid,
  reason:missing?reason:!checked?'check-needed':valid?'verified':reason,
  feedback:missing?feedback:!checked?'已選好紀錄與答案，請按「檢查」再對照證據。':valid?success:correction,
  ...metadata};
}
function assessOrigin(answer,salt){
 const record=salt.find(r=>r.id===answer.recordId)||null;
 const required=record?.metal==='Zn'&&record.solution==='CuSO4';
 const missing=!record||!answer.donor||!answer.acceptor||!answer.deposit;
 const valid=required&&answer.donor==='Zn'&&answer.acceptor==='Cu2'&&answer.deposit==='Cu';
 let reason='record-needed',feedback='請先選一張自己完成的鋅＋硫酸銅紀錄，再回答三個問題。';
 if(answer.recordId&&!record){reason='record-unavailable';feedback='選取的紀錄已不存在或無效。請重新選擇自己保留的鋅＋硫酸銅紀錄。';}
 else if(record&&missing){reason='answer-needed';feedback='請回答誰失去電子、誰得到電子，以及銅從哪裡來，再檢查。';}
 let correction;
 if(!required){reason=missing?reason:'different-record';correction='這張不是鋅＋硫酸銅紀錄。請引用自己的鋅＋硫酸銅觀察，再用反應模型解釋。';}
 else if(answer.donor!=='Zn'){reason=missing?reason:'donor';correction='依已知材料與反應模型，金屬鋅 Zn 失去電子，成為溶液中的 Zn²⁺；硫酸根是旁觀離子。';}
 else if(answer.acceptor!=='Cu2'){reason=missing?reason:'acceptor';correction='得到電子的是溶液中的 Cu²⁺，它形成金屬銅；鋅失去電子，硫酸根是旁觀離子。';}
 else if(answer.deposit!=='Cu'){reason=missing?reason:'deposit';correction='紅棕色析出物是觀察；依已知材料與反應模型，銅來自 Cu²⁺ 得到電子，不是鋅變成銅。';}
 return result(answer,{missing,reason,feedback,valid,correction,record,
  observation:record?outcome(record.metal,record.solution).observation:null,
  success:'紅棕色析出物與藍色變淡是觀察。依已知材料與反應模型，Zn 失去電子成為 Zn²⁺，Cu²⁺ 得到電子形成金屬銅；銅來自溶液中的銅離子，不是鋅變成銅。'});
}
function assessAcids(answer,salt,acid){
 const zincRecord=acid.find(r=>r.id===answer.zincId)||null;
 const ironRecord=acid.find(r=>r.id===answer.ironId)||null;
 const evidenceRecord=salt.find(r=>r.id===answer.evidenceId)||null;
 const missing=!zincRecord||!ironRecord||!evidenceRecord||!answer.answer;
 const acidPair=zincRecord?.metal==='Zn'&&ironRecord?.metal==='Fe';
 const direct=evidenceRecord?.metal==='Zn'&&evidenceRecord.solution==='FeSO4';
 const valid=acidPair&&answer.answer==='need-direct'&&direct;
 let reason='records-needed',feedback='請選自己的鋅、鐵稀鹽酸紀錄，回答問題，再選一張鹽類溶液紀錄作為直接比較的證據。';
 if((answer.zincId&&!zincRecord)||(answer.ironId&&!ironRecord)||(answer.evidenceId&&!evidenceRecord)){
  reason='record-unavailable';feedback='有一張選取的紀錄已不存在或無效。請重新選擇保留的實驗紀錄，不能用未做過的實驗作證據。';
 }else if(zincRecord&&ironRecord&&evidenceRecord&&!answer.answer){reason='answer-needed';feedback='請先回答兩杯都有氣泡是否足以排序，再檢查。';}
 let correction;
 if(!acidPair){reason=missing?reason:'different-acid-record';correction='請分別引用鋅＋稀鹽酸與鐵＋稀鹽酸的紀錄，其他金屬或重複同一杯不能代替這兩項觀察。';}
 else if(answer.answer!=='need-direct'){reason=missing?reason:'acid-ranking';correction='兩杯都有氣泡，只表示兩者在本課已知材料與反應模型下都能產生氫氣；不能據此判定鋅、鐵誰較活潑，也不能判定活性相同。需要直接比較鋅與鐵的證據。';}
 else if(!direct){
  const negative=evidenceRecord&&!outcome(evidenceRecord.metal,evidenceRecord.solution).reacts;
  reason=missing?reason:negative?'negative-only':'different-pair';
  correction=evidenceRecord?.metal==='Fe'&&evidenceRecord.solution==='ZnSO4'
   ?'鐵＋硫酸鋅未見明顯變化，是有效的觀察紀錄，但單靠未見變化不能證明鋅比鐵活潑。請找鋅＋硫酸亞鐵有析出物的直接證據。'
   :negative?'這張紀錄未見明顯置換現象；單靠未見變化不足以確定鋅、鐵先後。請找鋅＋硫酸亞鐵有析出物的直接證據。'
   :'這張硫酸銅紀錄比較的是金屬與銅，不能直接排出鋅和鐵。請找鋅＋硫酸亞鐵有析出物的紀錄。';
 }
 return result(answer,{missing,reason,feedback,valid,correction,zincRecord,ironRecord,evidenceRecord,
  success:'兩杯的氣泡觀察不能排出鋅、鐵先後。你引用的鋅＋硫酸亞鐵紀錄有灰黑色析出物；依已知材料與置換模型，析出物是鐵，這項直接證據支持 Zn > Fe。'});
}
function assessSource(answer,acid,referenceAdopted){
 const record=acid.find(r=>r.id===answer.copperId)||null;
 const missing=!record||!answer.answer||!referenceAdopted;
 const valid=record?.metal==='Cu'&&answer.answer==='reference'&&referenceAdopted;
 let reason='record-needed',feedback='請先選自己的銅＋稀鹽酸觀察紀錄，再辨認 H > Cu 的依據。';
 if(answer.copperId&&!record){reason='record-unavailable';feedback='選取的紀錄已不存在或無效。請重新選擇自己保留的銅＋稀鹽酸紀錄。';}
 else if(record&&!answer.answer){reason='answer-needed';feedback='請選出這一課 H > Cu 的依據來源。';}
 else if(record&&answer.answer&&!referenceAdopted){reason='reference-needed';feedback='H > Cu 的參考資料尚未採用。請回到既有的「參考資料」卡，閱讀並自行採用；銅沒有氣泡的觀察不能代替這個來源。';}
 let correction;
 if(record?.metal!=='Cu'){reason=missing?reason:'different-acid-record';correction='這題要引用銅＋稀鹽酸的紀錄，鋅或鐵的氣泡紀錄不能代替銅的觀察。';}
 else if(answer.answer!=='reference'){reason=missing?reason:'reference-source';correction='銅未見氣泡不能單獨證明 H > Cu，鋅與鐵的氣泡也不能補上這項比較。H > Cu 應標成已採用的參考資料，而不是這張紀錄的直接證明。';}
 return result(answer,{missing,reason,feedback,valid,correction,record,referenceAdopted,
  success:'銅未見明顯氣泡是你的觀察；H > Cu 來自你明確採用的參考資料。這兩種來源要分開，不能把「沒看見氣泡」單獨當作排序證明。'});
}
export function assessReview(state){
 const review=restoreReview(state?.review);
 const salt=retainedRecords(state,'r'),acid=retainedRecords(state,'a');
 const sections={
  origin:assessOrigin(review.answers.origin,salt),
  acids:assessAcids(review.answers.acids,salt,acid),
  source:assessSource(review.answers.source,acid,own(state?.lesson?.links,'HCu')&&state.lesson.links.HCu==='reference')
 };
 const counts={verified:0,total:SECTIONS.length,ready:0,missing:0,revise:0};
 Object.values(sections).forEach(section=>counts[section.status]++);
 const complete=counts.verified===counts.total;
 return {...sections,sections,counts,verifiedCount:counts.verified,total:counts.total,complete,
  status:complete?'verified':counts.revise?'revise':counts.missing===counts.total?'missing':'ready'};
}
