// Pilot #6 B2 browser-test support. The fixture exists only in memory; no production Guided page is created here.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),FIXTURE='/__circuit-guided-b2.html';
const HTML=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>電路接線實驗桌 B2 測試</title><link rel="stylesheet" href="/assets/circuit-guided/circuit-guided.css">
<style>body{margin:0;padding:16px;background:#fcfcfa}main{max-width:980px;margin:auto}.filler{height:1200px}</style></head><body><main><h1>電路接線實驗桌</h1><div id="host"></div><div class="filler" data-role="filler"></div></main>
<script type="module">
import {solveCircuit,FIXED_CIRCUITS,MAX_WIRES} from '/assets/circuit-guided/model.js';
import {createCircuitBench} from '/assets/circuit-guided/render.js';
import {bindCircuitInput} from '/assets/circuit-guided/input.js';
let raw={wires:[],switchClosed:false},locked=false;const log=[],host=document.getElementById('host'),bench=createCircuitBench(host);
const key=(a,b)=>[a,b].sort().join('|'),meter=(x,u)=>({state:x.state,text:x.reading===null?'—':x.reading.value.toFixed(1)+' '+u});
function view(){const r=solveCircuit(raw);return{locked,switchClosed:raw.switchClosed,wires:raw.wires,status:r.status,
lamps:{L1:{brightness:r.lamps.L1.brightness,bypassed:r.lamps.L1.bypassed},L2:{brightness:r.lamps.L2.brightness,bypassed:r.lamps.L2.bypassed}},
ammeter:meter(r.ammeter,'A'),voltmeter:meter(r.voltmeter,'V')}}
const paint=()=>bench.update(view());const canConnect=(a,b)=>raw.wires.length<MAX_WIRES&&!raw.wires.some(w=>key(w.from,w.to)===key(a,b));
const canDisconnect=(a,b)=>raw.wires.some(w=>key(w.from,w.to)===key(a,b));
bindCircuitInput({root:bench.element,getLocked:()=>locked,getSwitchClosed:()=>raw.switchClosed,canConnect,canDisconnect,canToggleSwitch:()=>true,
onConnect:(a,b)=>{log.push(['connect',a,b]);raw.wires.push({from:a,to:b});paint()},
onDisconnect:(a,b)=>{log.push(['disconnect',a,b]);const k=key(a,b);raw.wires=raw.wires.filter(w=>key(w.from,w.to)!==k);paint()},
onToggleSwitch:(v)=>{log.push(['switch',v]);raw.switchClosed=v;paint()}});
function setFixed(name,closed=false){raw={wires:FIXED_CIRCUITS[name].map(w=>({...w})),switchClosed:closed};paint()}
paint();window.__cgg={state:()=>structuredClone(raw),log:()=>structuredClone(log),setLocked:v=>{locked=v===true;paint()},setFixed,toggle:v=>{raw.switchClosed=v===true;paint()},
setRaw:v=>{raw={wires:(v.wires||[]).map(w=>({...w})),switchClosed:v.switchClosed===true};paint()},result:()=>solveCircuit(raw)};window.__cggReady=true;
</script></body></html>`;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
function createServer(){return http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(u.pathname==='/favicon.ico'){res.writeHead(204).end();return}if(u.pathname===FIXTURE){res.writeHead(200,{'Content-Type':mime['.html']}).end(HTML);return}
const f=path.resolve(root,'.'+u.pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return}try{res.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f))}catch{res.writeHead(404).end()}})}
async function guard(ctx,base,external){await ctx.route('**/*',route=>{const u=route.request().url();if(u.startsWith(base))return route.continue();external.push(u);return route.abort()})}
async function openFixture(browser,base,{viewport,touch=false,reducedMotion,forcedColors,external=[],errors=[]}){const ctx=await browser.newContext({viewport,hasTouch:touch,isMobile:touch,...(reducedMotion?{reducedMotion}:{}),...(forcedColors?{forcedColors}:{})});await guard(ctx,base,external);const page=await ctx.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.goto(base+FIXTURE);await page.waitForFunction(()=>window.__cggReady===true);return{ctx,page}}
async function axeScan(page,label){const file=require.resolve('axe-core',{paths:[__dirname]});await page.addScriptTag({path:file});const out=await page.evaluate(()=>window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']},resultTypes:['violations']}));if(out.violations.length)throw new Error('axe @ '+label+': '+out.violations.map(v=>v.id+': '+v.nodes.slice(0,2).map(n=>n.target.join(' ')).join(' | ')).join(' ;; '))}
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const launchOptions=()=>process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{};
async function touchDrag(page,from,to,steps=8){const c=await page.context().newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});for(let i=1;i<=steps;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/steps,y:from.y+(to.y-from.y)*i/steps}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(page)}
module.exports={root,FIXTURE,createServer,openFixture,axeScan,settle,launchOptions,touchDrag};