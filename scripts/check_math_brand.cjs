// P1: preserve worksheet markup and print/layout rules. P2 math engines are verified separately.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),baseline='44d5ff330aef60dbe3cb8c12e8b9a01e44afa59f';
const d=new JSDOM(fs.readFileSync(path.join(root,'tools/math/index.html'),'utf8')).window.document;
const links=[...d.querySelectorAll('a.card')].map(a=>new URL(a.getAttribute('href'),'https://www.bhcs.com.tw/tools/math/'));
assert.equal(links.length,94);const files=[...new Set(links.map(u=>u.pathname.slice(1)))];for(const file of files)assert.ok(fs.existsSync(path.join(root,file)),file+' linked from index but missing');
const p2EngineFiles=new Set(files.filter(file=>/^tools\/math\/g[^/]*-drills\.html$/.test(file)));
const strip=s=>s.replace(/\n<style id="bhcs-math-brand">[\s\S]*?<\/style>\n/g,'').replace(/<meta\s+name="theme-color"\s+content="[^"]+"\s*\/?>/gi,'').replace(/\.expr svg\.fig\{[^}]*\}/g,'');
const requiredBrandVars={green:'#16233A',green2:'#0D1626',mint:'#C8352B',soft:'#F2F4F7',line:'#C9D2DE',ink:'#16233A',muted:'#43516B',bg:'#FCFCFA',red:'#C8352B'};
const brandPalette=hex=>{const h=hex.slice(1),[r,g,b]=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)),hi=Math.max(r,g,b),lo=Math.min(r,g,b);if(hi===lo)return null;if(hi-lo<12&&hi>240)return requiredBrandVars.bg;if(lo>=175&&hi>=225)return requiredBrandVars.soft;if(lo>=125&&hi>=185)return requiredBrandVars.line;if(r>g*1.25&&r>b*1.2)return requiredBrandVars.red;if(hi-lo<45&&hi>75&&hi<190)return requiredBrandVars.muted;return requiredBrandVars.ink;};
const comparable=(file,s)=>{s=strip(s);return p2EngineFiles.has(file)?s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,block=>block.includes('globalThis.__BHCS_TEST__')?'<script data-p2-engine></script>':block):s};
for(const file of files){
 const s=fs.readFileSync(path.join(root,file),'utf8'),oldRef=baseline+':'+file;
 const existed=cp.spawnSync('git',['cat-file','-e',oldRef],{cwd:root}).status===0;
 if(existed){
  const old=cp.execFileSync('git',['show',oldRef],{cwd:root,encoding:'utf8',maxBuffer:4e6});
  assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules outside the authorized P2 engine script');
 }else assert.ok(p2EngineFiles.has(file),file+' is a new linked worksheet without an approved g*-drills engine pattern');
 assert.equal((s.match(/id="bhcs-math-brand"/g)||[]).length,1,file+' missing/duplicated theme');
 assert.match(s,/<meta name="theme-color" content="#16233A">/,file);
 const brandBlock=s.match(/<style id="bhcs-math-brand">([\s\S]*?)<\/style>/)?.[1];assert.ok(brandBlock,file+' missing bhcs brand style block');
 for(const [key,value] of Object.entries(requiredBrandVars))assert.ok(brandBlock.includes(`--bhcs-${key}:${value}`),file+` missing brand variable --bhcs-${key}:${value}`);
 const source=strip(s),colors=[...new Set(source.match(/#[\da-f]{6}\b/gi)||[])];
 for(const color of colors){const target=brandPalette(color);if(!target||target.toLowerCase()===color.toLowerCase())continue;for(const prop of ['fill','stroke']){const rule=`svg [${prop}="${color}" i]{${prop}:${target}}`;assert.ok(brandBlock.toLowerCase().includes(rule.toLowerCase()),file+' missing SVG brand mapping '+rule);}}
 assert.ok(brandBlock.includes('color:#C8352B!important'),file+' missing teacher-answer red rule');
}
console.log(`PASS P1: ${links.length} links, ${files.length} files, worksheet markup/print rules preserved; P2 engine scripts delegated to math regressions`);
module.exports={root,baseline,files,p2EngineFiles,links:links.map(u=>u.pathname.slice(1)+u.search)};
