// P1 only: reject changes to existing mathematics, markup and print/layout rules.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),baseline='44d5ff330aef60dbe3cb8c12e8b9a01e44afa59f';
const d=new JSDOM(fs.readFileSync(path.join(root,'tools/math/index.html'),'utf8')).window.document;
const links=[...d.querySelectorAll('a.card')].map(a=>new URL(a.getAttribute('href'),'https://www.bhcs.com.tw/tools/math/'));
assert.equal(links.length,88);const files=[...new Set(links.map(u=>u.pathname.slice(1)))];assert.equal(files.length,39);
const strip=s=>s.replace(/\n<style id="bhcs-math-brand">[\s\S]*?<\/style>\n/g,'').replace(/<meta\s+name="theme-color"\s+content="[^"]+"\s*\/?>/gi,'');
for(const file of files){
 const s=fs.readFileSync(path.join(root,file),'utf8'),old=cp.execFileSync('git',['show',baseline+':'+file],{cwd:root,encoding:'utf8',maxBuffer:4e6});
 assert.equal(strip(s),strip(old),file+' changes more than the P1 style block/theme-color');
 assert.equal((s.match(/id="bhcs-math-brand"/g)||[]).length,1,file+' missing/duplicated theme');
 assert.match(s,/<meta name="theme-color" content="#16233A">/,file);
}
console.log(`PASS P1: ${links.length} links, ${files.length} files, original scripts/HTML/print rules byte-identical`);
module.exports={root,baseline,files,links:links.map(u=>u.pathname.slice(1)+u.search)};
