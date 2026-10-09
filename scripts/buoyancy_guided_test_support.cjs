// Shared helpers for the guided-buoyancy browser checks (a copy of the idea in the optics prototype's support file;
// the two are merged when the shared layer is extracted).
// The production page ships no test hook. Checks that need to read state or jump ahead get one by having the browser
// context serve main.js with a few extra lines appended (same module scope, nothing added to the file on disk).
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const MAIN='/assets/buoyancy-guided/main.js';
const HOOK='\nwindow.__bgTest = { dispatch, getState: () => state, view: () => deriveView(state) };\n';

const ADAPTER='/assets/science-events.js';
// The site adapter is replaced in every browser check, so a test never reaches the real analytics transport:
//   spy     (default)  records every call in window.__testScienceEvents and does nothing else
//   throw              an adapter that raises on every call
//   absent             an adapter script that defines nothing
const ADAPTERS={
 spy:'window.__testScienceEvents = [];\nwindow.bhcsScienceTrack = (...args) => { window.__testScienceEvents.push(args); };\n',
 throw:'window.__testScienceEvents = [];\nwindow.bhcsScienceTrack = (...args) => { window.__testScienceEvents.push(args); throw new Error("adapter down"); };\n',
 absent:'/* no adapter on this page */\n',
};

/** Same-origin only; optionally serves main.js with the test hook appended, and always stands in for the site adapter.
 *  `external` collects every non-same-origin URL requested. */
async function guardContext(ctx,base,{hook=false,external=[],adapter='spy'}={}){
 await ctx.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base)){
   const pathname=new URL(url).pathname;
   if(pathname===ADAPTER)return route.fulfill({status:200,contentType:'text/javascript',body:ADAPTERS[adapter]});
   if(hook&&pathname===MAIN)return route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(root,MAIN),'utf8')+HOOK});
   return route.continue();
  }
  external.push(url);
  return route.abort();
 });
}

/** axe-core on the current page state. Fails with a readable list when anything is reported. */
async function axeScan(page,label){
 const file=require.resolve('axe-core',{paths:[__dirname]});
 await page.addScriptTag({path:file});
 const result=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']},resultTypes:['violations']}));
 const lines=result.violations.map(v=>`${v.id} (${v.impact}): ${v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(' | ')}`);
 if(lines.length)throw new Error(`axe @ ${label}: ${lines.join(' ;; ')}`);
 return result.violations.length;
}
module.exports={guardContext,axeScan,MAIN};
