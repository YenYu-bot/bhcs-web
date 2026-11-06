import {freshSession as freshV2,restoreSession as restoreV2,migrateV1 as migrateOld} from './inquiry.mjs';
import {freshAcid,restoreAcid} from './acid.mjs';
import {freshReview,restoreReview} from './review.mjs';

export function freshSession(){return {...freshV2(),version:4,lesson:freshAcid(),review:freshReview()};}
export function migrateV2(raw){const s=restoreV2(raw);return s?{...s,version:4,lesson:freshAcid(),review:freshReview()}:null;}
export function migrateV1(raw){const s=migrateOld(raw);return s?{...s,version:4,lesson:freshAcid(),review:freshReview()}:null;}

// Both evidence chapters keep their original strict validation. Only the new
// optional review is normalized independently, so bad answers cannot erase work.
function restoreExperiments(d){
 const base=restoreV2(JSON.stringify({...d,version:2})),lesson=restoreAcid(d.lesson);
 return base&&lesson?{...base,version:4,lesson}:null;
}
export function migrateV3(raw){
 try{const d=JSON.parse(raw);if(d?.version!==3)return null;const s=restoreExperiments(d);return s?{...s,review:freshReview()}:null;}catch{return null;}
}
export function restoreSession(raw){
 try{const d=JSON.parse(raw);if(d?.version!==4)return null;const s=restoreExperiments(d);return s?{...s,review:restoreReview(d.review,s)}:null;}catch{return null;}
}
