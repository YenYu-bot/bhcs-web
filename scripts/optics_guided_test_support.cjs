// Shared helpers for the guided-optics browser checks.
// The production page ships no test hook. Checks that need to read state or jump ahead get one by having the browser
// context serve main.js with a few extra lines appended (same module scope, nothing added to the file on disk).
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const MAIN='/assets/optics-guided/main.js';
const HOOK='\nwindow.__opticsGuided = { dispatch, getState: () => state, view: () => deriveView(state), store };\n';

/**
 * Applies the network rules every guided-optics check shares: same-origin only, the Google loader answered with an empty
 * script (so analytics code paths run but nothing leaves the machine), and optionally the test hook.
 * `external` collects every non-same-origin URL that was requested.
 */
async function guardContext(ctx,base,{hook=false,external=[]}={}){
 await ctx.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base)){
   if(hook&&new URL(url).pathname===MAIN)return route.fulfill({status:200,contentType:'text/javascript',body:fs.readFileSync(path.join(root,MAIN),'utf8')+HOOK});
   return route.continue();
  }
  external.push(url);
  if(/^https:\/\/www\.googletagmanager\.com\/gtag\/js/.test(url))return route.fulfill({status:200,contentType:'text/javascript',body:'/* test stub */'});
  return route.abort();
 });
}

/** Records every gtag() call (across reloads) in `calls`, by defining gtag before any page script runs. */
async function captureGtag(ctx,calls){
 await ctx.exposeBinding('__gtagLog',(_src,args)=>{calls.push(args)});
 await ctx.addInitScript(()=>{window.dataLayer=window.dataLayer||[];window.gtag=function(){window.__gtagLog(Array.from(arguments).map(a=>a instanceof Date?'DATE':a))}});
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
module.exports={guardContext,captureGtag,axeScan,MAIN};
