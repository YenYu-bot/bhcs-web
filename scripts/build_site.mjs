// Shared site shell and cache version. Run after build_science.mjs.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version='20260921-site-audit-1';
const hours='週一至週五 12:30–22:00（週二 13:30 起）　週六 09:00–21:30　週日公休';
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
 const file=path.join(root,name);let s=fs.readFileSync(file,'utf8');
 s=s.replace(/assets\/(style\.css|site\.js)(?:\?v=[^"']*)?/g,(_,f)=>`assets/${f}?v=${version}`)
  .replaceAll('週一至週五 12:30–22:00　週六 09:00–21:30　週日公休',hours);
 fs.writeFileSync(file,s);
}
const home=fs.readFileSync(path.join(root,'index.html'),'utf8');
const relative=s=>s.replace(/\b(href|src)="([^"#][^"]*)"/g,(all,attr,url)=>/^(https?:|tel:|mailto:|\/)/.test(url)?all:`${attr}="../${url}"`);
const header=relative(home.match(/<header\b[\s\S]*?<\/header>/)[0]).replace(/ aria-current="page"/g,'').replace('href="../wenzhang/"','href="./" aria-current="page"');
const footer=relative(home.match(/<footer\b[\s\S]*?<\/footer>/)[0]);
const dock=home.match(/<div class="dock">[\s\S]*?<\/div>/)[0];
for(const name of fs.readdirSync(path.join(root,'wenzhang')).filter(n=>n.endsWith('.html'))){
 const file=path.join(root,'wenzhang',name);let s=fs.readFileSync(file,'utf8');
 s=s.replace(/<body(?: class="[^"]*")?>/,'<body class="article-site">').replace(/<header\b[\s\S]*?<\/header>/,header).replace(/<footer\b[\s\S]*?<\/footer>/,footer);
 s=s.replace(/<link rel="stylesheet" href="\.\.\/assets\/(?:style|article-site)\.css[^" ]*">\n?/g,'');
 s=s.replace('<style>',`<link rel="stylesheet" href="../assets/style.css?v=${version}">\n<style>`);
 s=s.replace('</head>',`<link rel="stylesheet" href="../assets/article-site.css?v=${version}">\n</head>`);
 s=s.replace(/<div class="dock">[\s\S]*?<\/div>\n?/g,'').replace(/<script src="\.\.\/assets\/site\.js[^" ]*" defer><\/script>\n?/g,'');
 s=s.replace('</body>',`${dock}\n<script src="../assets/site.js?v=${version}" defer></script>\n</body>`);
 if(!s.includes('class="skip"'))s=s.replace('<body class="article-site">','<body class="article-site">\n<a class="skip" href="#main">跳到主要內容</a>');
 if(s.includes('<main class="list">'))s=s.replace('<main class="list">','<main id="main" class="list">');
 if(!s.includes('<main '))s=s.replace(/(<article\b[\s\S]*?<\/article>)/,'<main id="main">$1</main>');
 s=s.replace(/(<div class="cover">\s*<img[^>]*>)(?!\s*<p class="illustration-note")/g,'$1\n  <p class="illustration-note">情境示意圖</p>');
 if(name==='index.html')s=s.replace(/(<a class="card"[^>]*>\s*<img[^>]*>)(?!\s*<p class="illustration-note")/g,'$1\n    <p class="illustration-note">情境示意圖</p>');
 fs.writeFileSync(file,s);
}
console.log('Built shared site version, opening hours and article shell');
