// P1: preserve worksheet markup and print/layout rules. P2 math engines are verified separately.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),baseline='44d5ff330aef60dbe3cb8c12e8b9a01e44afa59f';
const d=new JSDOM(fs.readFileSync(path.join(root,'tools/math/index.html'),'utf8')).window.document;
const links=[...d.querySelectorAll('a.card')].map(a=>new URL(a.getAttribute('href'),'https://www.bhcs.com.tw/tools/math/'));
assert.equal(links.length,91);const files=[...new Set(links.map(u=>u.pathname.slice(1)))];assert.equal(files.length,39);
const p2EngineFiles=new Set(['tools/math/g6-drills.html','tools/math/g10-drills.html','tools/math/g11-drills.html']);
const strip=s=>s.replace(/\n<style id="bhcs-math-brand">[\s\S]*?<\/style>\n/g,'').replace(/<meta\s+name="theme-color"\s+content="[^"]+"\s*\/?>/gi,'').replace(/\.expr svg\.fig\{[^}]*\}/g,'');
const comparable=(file,s)=>{s=strip(s);return p2EngineFiles.has(file)?s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,block=>block.includes('globalThis.__BHCS_TEST__')?'<script data-p2-engine></script>':block):s};
for(const file of files){
 const s=fs.readFileSync(path.join(root,file),'utf8'),old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(comparable(file,s),comparable(file,old),file+' changes worksheet markup or print/layout rules outside the authorized P2 engine script');
 assert.equal((s.match(/id="bhcs-math-brand"/g)||[]).length,1,file+' missing/duplicated theme');
 assert.match(s,/<meta name="theme-color" content="#16233A">/,file);
}
console.log(`PASS P1: ${links.length} links, ${files.length} files, worksheet markup/print rules preserved; P2 engine scripts delegated to math regressions`);
module.exports={root,baseline,files,p2EngineFiles,links:links.map(u=>u.pathname.slice(1)+u.search)};
