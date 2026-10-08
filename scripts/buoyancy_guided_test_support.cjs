// Shared helpers for the guided-buoyancy browser checks (a copy of the idea in the optics prototype's support file;
// the two are merged when the shared layer is extracted).
// The production page ships no test hook. Checks that need to read state or jump ahead get one by having the browser
// context serve main.js with a few extra lines appended (same module scope, nothing added to the file on disk).
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const MAIN='/assets/buoyancy-guided/main.js';
const HOOK='\nwindow.__bgTest = { dispatch, getState: () => state, view: () => deriveView(state) };\n';

/** Same-origin only; optionally serves main.js with the test hook appended. `external` collects every non-same-origin URL requested. */
async function guardContext(ctx,base,{hook=false,external=[]}={}){
 await ctx.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base)){
   if(hook&&new URL(url).pathname===MAIN)return route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(root,MAIN),'utf8')+HOOK});
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
