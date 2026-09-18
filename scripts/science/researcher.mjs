import fs from 'node:fs';
import path from 'node:path';
import {inquiry} from './inquiry.mjs';
export function buildResearcher(root,firstBatch,batch2){
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 const css=read('scripts/science/researcher.css'),js=read('scripts/science/researcher.js');
 for(const file of [...firstBatch,...batch2.map(t=>'science/'+t.id+'.html')]){
  const id=file.split('/').pop().replace('.html',''),second=file.startsWith('science/');
  const config={id,second,img:second?'../mini-lab/img/':'mini-lab/img/',home:second?'./':'science/',inquiry:inquiry[id]};
  let html=read('tools/'+file).replace(/<!-- researcher-style:start -->[\s\S]*?<!-- researcher-style:end -->\n?/g,'').replace(/<!-- researcher-app:start -->[\s\S]*?<!-- researcher-app:end -->\n?/g,'');
  html=html.replace('</head>',`<!-- researcher-style:start --><style>${css}</style><!-- researcher-style:end -->\n</head>`);
  html=html.replace('</body>',`<!-- researcher-app:start --><script id="researcher-config" type="application/json">${JSON.stringify(config).replaceAll('<','\\u003c')}</script><script>${js}</script><!-- researcher-app:end -->\n</body>`);
  fs.writeFileSync(path.join(root,'tools',file),html);
 }
 let directory=read('tools/science/index.html');
 directory=directory.replace('</head>',`<style>${css}</style></head>`).replace('<body data-science-lab="science-directory">','<body data-science-lab="science-directory" class="researcher-directory">');
 directory=directory.replace(/<section class="hero">[\s\S]*?<\/section>/,`<section class="researcher-lobby shell"><div class="lobby-copy"><span class="lab-kicker">BHCS · JUNIOR RESEARCHERS</span><h1>小小研究員<br>虛擬實驗室</h1><p>跟著奇奇博士，把好奇變成發現。</p><p>挑一個實驗 → 動手觀察 → 收進研究手冊</p><a class="lab-primary" href="../microscope-lab.html">第一站：顯微鏡探險 →</a><a class="lobby-original" href="../mini-lab/">國小生活實驗教室 →</a></div><div class="lobby-scene"><img class="lobby-room" src="../mini-lab/img/lab-room.jpg" width="1600" height="920" alt="暖色實驗室場景，實驗桌上擺放研究器材"><img class="lobby-doc" src="../mini-lab/img/doc-wave.png" width="200" height="220" alt="奇奇博士向你揮手"><span class="lobby-bubble">今天想研究什麼？<br>到下方選一張任務卡吧！</span></div></section>`);
 const icon={生物:'icon-photo.png',理化:'icon-cabbage.png',地科:'icon-solar.png',國小自然:'icon-tools.png'};
 directory=directory.replace(/(<article class="resource" data-subject="([^"]+)"[^>]*>)/g,(_,tag,subject)=>tag+`<img class="station-icon" src="../mini-lab/img/${icon[subject]}" width="88" height="88" alt="" loading="lazy">`);
 directory=directory.replaceAll('>開啟','>進入實驗：');
 fs.writeFileSync(path.join(root,'tools/science/index.html'),directory);
}
