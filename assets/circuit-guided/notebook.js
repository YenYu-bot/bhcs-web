// Notebook truth and learner-response validation for Circuit Guided B4-A.
// No DOM, localStorage, analytics or persisted correctness flags.
import { observationFor } from './engine.js';

const ids=Object.freeze(['baseline','trial1','trial2-total']);
const clean=s=>typeof s==='string'?s.trim():'';
const meaningful=s=>clean(s).replace(/[\s\p{P}\p{S}]/gu,'').length>=8;
const current=(state,id)=>{
  const r=observationFor(state,id);
  return r?.batteryCurrent?.value??null;
};

export function notebookEvidence(state){
  if(!state||!Array.isArray(state.records))return null;
  const values=ids.map(id=>current(state,id));
  if(values.some(v=>typeof v!=='number'||!Number.isFinite(v)))return null;
  const [baseline,onePath,twoPath]=values;
  return Object.freeze({
    baseline,onePath,twoPath,
    onePathChange:onePath<baseline?'decrease':onePath>baseline?'increase':'same',
    twoPathChange:twoPath<baseline?'decrease':twoPath>baseline?'increase':'same',
    alwaysDecrease:false,
  });
}

export const NOTEBOOK_A_QUESTIONS=Object.freeze({
  baselineCurrent:Object.freeze(['0.5','1.0','2.0']),
  onePathChange:Object.freeze(['decrease','increase','same']),
  twoPathChange:Object.freeze(['decrease','increase','same']),
  alwaysDecrease:Object.freeze(['true','false']),
});

export function notebookAStatus(state,answers){
  const evidence=notebookEvidence(state);
  const expected=evidence?{
    baselineCurrent:evidence.baseline.toFixed(1),
    onePathChange:evidence.onePathChange,
    twoPathChange:evidence.twoPathChange,
    alwaysDecrease:String(evidence.alwaysDecrease),
  }:null;
  const questions={};
  for(const [key,options] of Object.entries(NOTEBOOK_A_QUESTIONS)){
    const answer=typeof answers?.[key]==='string'&&options.includes(answers[key])?answers[key]:null;
    questions[key]={answer,correct:expected!==null&&answer===expected[key]};
  }
  return {ready:expected!==null,questions,allCorrect:expected!==null&&Object.values(questions).every(q=>q.correct)};
}

export function notebookBStatus(text){
  return {ready:meaningful(text),text:clean(text)};
}

export function notebookCStatus({counterexample='',limitation=''}={}){
  const hasCounterexample=meaningful(counterexample);
  const hasLimitation=meaningful(limitation);
  return {
    counterexample:clean(counterexample),
    limitation:clean(limitation),
    hasCounterexample,
    hasLimitation,
    showIdeas:hasLimitation,
    ready:hasCounterexample&&hasLimitation,
  };
}

export const LIMITATION_IDEAS=Object.freeze([
  '電池有內阻','導線有電阻','燈絲電阻會隨溫度改變',
  '電表有內阻','真實電路還有保護元件','本站是低電壓理想模型',
]);
