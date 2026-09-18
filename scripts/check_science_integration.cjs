const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{cwd:root,encoding:'utf8'}).trim().split('\n');
const pages=[...new Set(files.filter(p=>p.endsWith('.html')&&!p.startsWith('scripts/')))];
const sitemap=new JSDOM(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),{contentType:'application/xml'}).window.document;
const urls=[...sitemap.querySelectorAll('loc')].map(n=>n.textContent);assert.equal(new Set(urls).size,urls.length);
const errors=[];let checks=0;
for(const file of pages){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8')),{document:d}=dom.window;
 const canonical=d.querySelector('link[rel=canonical]')?.href,noindex=(d.querySelector('meta[name=robots]')?.content||'').includes('noindex');
 if(canonical&&canonical.startsWith('https://www.bhcs.com.tw/')&&!noindex&&!urls.includes(canonical))errors.push(file+' missing sitemap');
 if(noindex&&canonical===('https://www.bhcs.com.tw/'+file)&&urls.includes(canonical))errors.push(file+' noindex in sitemap');
 for(const a of d.querySelectorAll('a[href],script[src],link[rel=stylesheet],img[src]')){
  const raw=a.getAttribute('href')||a.getAttribute('src');if(!raw||/^(https?:|data:|mailto:|tel:|javascript:|blob:)/.test(raw)||raw.includes('${'))continue;
  const url=new URL(raw,'https://www.bhcs.com.tw/'+file);const local=decodeURIComponent(url.pathname),target=path.join(root,local.endsWith('/')?local+'index.html':local);checks++;
  if(!fs.existsSync(target))errors.push(file+' -> '+raw);
 }
 dom.window.close();
}
for(const url of urls){const local=new URL(url).pathname;assert.ok(fs.existsSync(path.join(root,local.endsWith('/')?local+'index.html':local)),url+' missing')}
// Mathematics HTML must remain byte-identical to the approved v1 baseline.
const diff=cp.execFileSync('git',['diff','da02d2f','--','tools/math'],{cwd:root,encoding:'utf8'});assert.equal(diff,'','Math tools were changed');
assert.deepEqual(errors,[]);console.log(`PASS ${pages.length} HTML pages, ${checks} local references, ${urls.length} sitemap URLs, math files unchanged`);
