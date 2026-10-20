// Browser storage adapter; only validated, normalized source state is written.
// Never serialize solver results or use storage to dispatch analytics.
import {STORAGE_KEY,createPayload,restorePayload} from './persist.js';
export function createCircuitStorage(storage){
  function load(){
    try{const raw=storage.getItem(STORAGE_KEY);return raw===null?{status:'empty',data:null}:{status:'restored',data:restorePayload(JSON.parse(raw))};}
    catch{return {status:'unavailable',data:null}}
  }
  function save(snapshot){
    const normalized=createPayload(snapshot);
    if(!normalized)return {status:'invalid'};
    try{storage.setItem(STORAGE_KEY,JSON.stringify(normalized));return{status:'saved'}}
    catch{return{status:'unavailable'}}
  }
  function clear(){try{storage.removeItem(STORAGE_KEY);return true}catch{return false}}
  return {load(){const result=load();return result.status==='restored'&&!result.data?{status:'invalid',data:null}:result},save,clear};
}
