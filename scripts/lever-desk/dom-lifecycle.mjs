// Supplemental test-only lifecycle adapter for existing jsdom 26.
// Original ported tests remain byte-identical after reversing path adaptations.
// Their app modules execute in Node's realm, so unqualified timers otherwise
// survive window.close(), unlike timers in an actual destroyed browser document.
// Never suppress callback exceptions; only cancel owned timers at fixture close.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),jsdom=require('jsdom');
const NativeJSDOM=jsdom.JSDOM,nativeSetTimeout=globalThis.setTimeout,nativeClearTimeout=globalThis.clearTimeout;
const fixtures=new WeakMap(),owners=new Map();
globalThis.setTimeout=function(callback,delay,...args){
 const fixture=fixtures.get(globalThis.window);
 let id;
 id=nativeSetTimeout(function(...values){
  if(fixture){fixture.delete(id);owners.delete(id);}
  return callback(...values);
 },delay,...args);
 if(fixture){fixture.add(id);owners.set(id,fixture);}
 return id;
};
globalThis.clearTimeout=function(id){
 const fixture=owners.get(id);if(fixture){fixture.delete(id);owners.delete(id);}
 return nativeClearTimeout(id);
};
jsdom.JSDOM=class LifecycleJSDOM extends NativeJSDOM{
 constructor(...args){
  super(...args);const w=this.window,owned=new Set(),close=w.close.bind(w);
  fixtures.set(w,owned);
  w.close=function(){
   for(const id of owned){nativeClearTimeout(id);owners.delete(id);}
   owned.clear();fixtures.delete(w);
   return close();
  };
 }
};
