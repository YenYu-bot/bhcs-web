// Actual DOM parser and event dispatch via jsdom. Not a layout or touch browser.
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const DIST=new URL('../../tools/buoyancy-lab/',import.meta.url);
let seq=0;
export async function loadApp({current=null,legacy=null,sourcePath=new URL('app.mjs',DIST)}={}){
 const dom=new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>',{url:'https://private-prototype.test/'});
 const data=new Map([['yu-buoyancy-prototype-v1.2-g10',current],['yu-buoyancy-prototype-v1.1',legacy]]),writes=[];
 globalThis.document=dom.window.document;globalThis.window=dom.window;
 globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{writes.push({key:k,value:v});data.set(k,v)}};
 let source=fs.readFileSync(sourcePath,'utf8').replace(/from '\.\//g,`from '${DIST.href}`);source+='\nexport const audit={get state(){return {run,records,revisions,storageOK,storageMessage}},setRun(s){run=s},setExplanation(s){draft.explanation=s},action};';
 const m=await import('data:text/javascript;base64,'+Buffer.from(source+`\n//${seq++}`).toString('base64'));
 return {dom,api:m.audit,root:document.querySelector('#app'),writes,data,buttons:()=>[...document.querySelectorAll('button')],find:k=>document.querySelector(`[data-action="${k}"]`),edit:id=>document.querySelector(`[data-edit="${id}"]`)};
}
