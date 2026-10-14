// Shared helpers for the guided-microscope browser checks.
// The production page ships no test hook. Checks that need to read state or jump ahead get one by having the browser
// context serve main.js with a few extra lines appended (same module scope, nothing added to the file on disk).
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const MAIN='/assets/microscope-guided/main.js';
const HOOK='\nwindow.__mgTest = { dispatch, getState: () => state, view: () => deriveView(state) };\n';
const ADAPTER='/assets/science-events.js';
// The site adapter is replaced in every browser check, so a test never reaches the real analytics transport:
// it records every call in window.__testScienceEvents and does nothing else.
const ADAPTER_BODY='window.__testScienceEvents = [];\nwindow.bhcsScienceTrack = (...args) => { window.__testScienceEvents.push(args); };\n';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'};

/** A static file server for the repository root. */
function createServer(){
 return http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/favicon.ico'){res.writeHead(204).end();return}
  const file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  try{res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
 });
}

/** Same-origin only; optionally serves main.js with the test hook appended. `external` collects every non-same-origin URL requested. */
async function guardContext(ctx,base,{hook=false,external=[]}={}){
 await ctx.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base)){
   const pathname=new URL(url).pathname;
   if(pathname===ADAPTER)return route.fulfill({status:200,contentType:'text/javascript',body:ADAPTER_BODY});
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
const launchOptions=()=>process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{};
module.exports={createServer,guardContext,axeScan,launchOptions,MAIN,root};
