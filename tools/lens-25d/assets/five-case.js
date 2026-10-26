// Five-case presentation orchestrator. This is not the original three-trial reducer.
// Optical classification, magnification and clarity remain exclusively in frozen model.js.
import { calculateLensState, calculateClarity } from './optics-guided/model.js';
export const CASES = Object.freeze([
  { id:'outside2f', label:'2f 外', u:30 }, { id:'at2f', label:'2f 上', u:20 },
  { id:'between', label:'f～2f 間', u:15 }, { id:'focal', label:'f 上', u:10 },
  { id:'inside', label:'f 內', u:5 },
].map(Object.freeze));
export const ZONES = Object.freeze(['near','middle','far']);
const classify = lens => lens.imageType==='infinite'?'focal':lens.imageType==='virtual'?'inside':lens.imageSize==='smaller'?'outside2f':lens.imageSize==='same'?'at2f':'between';
const zoneOf = s => s<17?'near':s<29?'middle':'far';
export function createState(){return {f:10,u:30,s:20,records:Object.fromEntries(CASES.map(c=>[c.id,null])),history:[],search:{zones:[]},through:false,confirmed:false,pendingScreenStart:null};}
const physics = state => {const lensState=calculateLensState({f:state.f,u:state.u});return {lensState,clarity:calculateClarity({lensState,screenPosition:state.s})};};
const sameSnapshot = (record,state,kind) => !!record && record.u===state.u && record.f===state.f && record.screenPosition===state.s && record.evidenceKind===kind;
export function deriveView(state){
 const {lensState,clarity}=physics(state), caseId=classify(lensState), explored=ZONES.filter(z=>state.search.zones.includes(z)), complete=explored.length===3;
 const evidenceKind=lensState.imageType==='infinite'?'focal':lensState.imageType==='virtual'?'virtual':'screen';
 const alreadyRecordedSnapshot=sameSnapshot(state.records[caseId],state,evidenceKind);
 return {alreadyRecordedSnapshot,f:state.f,u:state.u,s:state.s,phase:state.through?'trial3-view-through-lens':'explore',lensState,clarity,caseId,
  ranges:{candle:{min:5,max:35,locked:false},screen:{min:8,max:40,locked:false}},
  recordEnabled:clarity.effectiveClarityLevel===1&&!state.confirmed&&!sameSnapshot(state.records[caseId],state,'screen'),
  search:{zones:explored,explored,unexplored:ZONES.filter(z=>!explored.includes(z)),complete,ctaUnlocked:complete},
  through:state.through,confirmed:state.confirmed,evidence:state.records[caseId]};
}
function clearCondition(state){state.search={zones:[]};state.through=false;state.confirmed=false;state.pendingScreenStart=null;}
function record(state,kind){
 const {lensState,clarity}=physics(state),caseId=classify(lensState);
 if(sameSnapshot(state.records[caseId],state,kind)) return false;
 state.records[caseId]={caseId,f:state.f,u:state.u,observedScreenPosition:kind==='screen'?state.s:null,screenPosition:state.s,
  imageType:lensState.imageType,imageOrientation:lensState.imageOrientation,imageSize:lensState.imageSize,
  magnification:lensState.magnification,absoluteMagnification:lensState.absoluteMagnification,theoreticalV:lensState.theoreticalV,
  evidenceKind:kind,searchedZones:[...state.search.zones],clarity:clarity.effectiveClarityLevel};
 state.history.push(structuredClone(state.records[caseId]));
 state.confirmed=true;return true;
}
export function dispatchState(previous,action){
 const state=structuredClone(previous);const fail=reason=>({state:previous,accepted:false,reason});
 const view=deriveView(state);
 switch(action?.type){
  case 'EXIT_THROUGH': clearCondition(state);break;
  case 'RESET': return {state:createState(),accepted:true};
  case 'SELECT_CASE': {const c=CASES.find(c=>c.id===action.id);if(!c)return fail('unknown-case');state.u=c.u;state.s=20;clearCondition(state);break;}
  case 'MOVE_CANDLE': {
   if(typeof action.position!=='number'||!Number.isFinite(action.position))return fail('invalid-position');
   const u=Math.max(5,Math.min(35,action.position));if(u!==state.u){state.u=u;clearCondition(state);}break;
  }
  case 'MOVE_SCREEN': {
   if(typeof action.position!=='number'||!Number.isFinite(action.position))return fail('invalid-position');
   const s=Math.max(8,Math.min(40,action.position));if(s!==state.s){if(state.pendingScreenStart===null)state.pendingScreenStart=state.s;state.s=s;state.confirmed=false;state.through=false;}break;
  }
  case 'SETTLE_SCREEN': {
   if(state.pendingScreenStart!==null&&state.pendingScreenStart!==state.s&&['infinite','virtual'].includes(view.lensState.imageType)){
    const zone=zoneOf(state.s);if(!state.search.zones.includes(zone))state.search.zones.push(zone);state.search.zones.sort((a,b)=>ZONES.indexOf(a)-ZONES.indexOf(b));
   }state.pendingScreenStart=null;break;
  }
  case 'RECORD': if(!view.recordEnabled||!record(state,'screen'))return fail('not-recordable');break;
  case 'CONFIRM_FOCAL': if(view.lensState.imageType!=='infinite'||!view.search.complete||state.confirmed||!record(state,'focal'))return fail('focal-not-ready');break;
  case 'VIEW_THROUGH': if(view.lensState.imageType!=='virtual'||!view.search.complete||state.confirmed||state.through)return fail('virtual-not-ready');state.through=true;break;
  case 'CONFIRM_VIRTUAL': if(view.lensState.imageType!=='virtual'||!view.search.complete||!state.through||state.confirmed||!record(state,'virtual'))return fail('virtual-not-observed');break;
  default:return fail('unknown-action');
 }
 return {state,accepted:true};
}
