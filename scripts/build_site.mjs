// Shared asset cache version and article page shell. Run after build_science.mjs.
// Header, footer, contact dock and opening hours are owned by build_shell.py (sources in scripts/site/).
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version='20261005-jh-subject-pages-h1';
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
 const file=path.join(root,name);let s=fs.readFileSync(file,'utf8');
 s=s.replace(/assets\/(style\.css|site\.js)(?:\?v=[^"']*)?/g,(_,f)=>`assets/${f}?v=${version}`);
 fs.writeFileSync(file,s);
}
for(const name of fs.readdirSync(path.join(root,'wenzhang')).filter(n=>n.endsWith('.html'))){
 const file=path.join(root,'wenzhang',name);let s=fs.readFileSync(file,'utf8');
 s=s.replace(/<body(?: class="[^"]*")?>/,'<body class="article-site">');
 s=s.replace(/<link rel="stylesheet" href="\.\.\/assets\/(?:style|article-site)\.css[^" ]*">\n?/g,'');
 s=s.replace('<style>',`<link rel="stylesheet" href="../assets/style.css?v=${version}">\n<style>`);
 s=s.replace('</head>',`<link rel="stylesheet" href="../assets/article-site.css?v=${version}">\n</head>`);
 s=s.replace(/<script src="\.\.\/assets\/site\.js[^" ]*" defer><\/script>\n?/g,'');
 s=s.replace('</body>',`<script src="../assets/site.js?v=${version}" defer></script>\n</body>`);
 if(!s.includes('class="skip"'))s=s.replace('<body class="article-site">','<body class="article-site">\n<a class="skip" href="#main">跳到主要內容</a>');
 if(s.includes('<main class="list">'))s=s.replace('<main class="list">','<main id="main" class="list">');
 if(!s.includes('<main '))s=s.replace(/(<article\b[\s\S]*?<\/article>)/,'<main id="main">$1</main>');
 s=s.replace(/(<div class="cover">\s*<img[^>]*>)(?!\s*<p class="illustration-note")/g,'$1\n  <p class="illustration-note">情境示意圖</p>');
 if(name==='index.html')s=s.replace(/(<a class="card"[^>]*>\s*<img[^>]*>)(?!\s*<p class="illustration-note")/g,'$1\n    <p class="illustration-note">情境示意圖</p>');
 fs.writeFileSync(file,s);
}
console.log('Built shared asset version and article shell');
