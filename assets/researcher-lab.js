(()=>{'use strict';
const path=location.pathname;
const imgBase=path.includes('/tools/science/')?'../mini-lab/img/':'mini-lab/img/';
const artBase=path.includes('/tools/science/')?'../../assets/science/':'../assets/science/';
const SCENES={biology:['microscope-lab','photosynthesis-factor-lab','genetics-simulation-lab','plant-exchange','ecosystem'],physics:['force-motion-lab','circuit-lab','optics','wave-sound','electromagnetism','pressure-fluid','energy'],chemistry:['particle-reaction-lab','acid-base-indicator-lab','heat-phase-lab','buoyancy-density-lab','solubility'],earth:['plate-earthquake-lab','moon-eclipse','seasons']};
const pageKey=(path.split('/').pop()||'').replace(/\.html$/,'');
const sceneName=Object.keys(SCENES).find(k=>SCENES[k].includes(pageKey));
const roomImg=alt=>'<img class="room" src="'+(sceneName?artBase+'scenes/scene-'+sceneName+'.webp':imgBase+'lab-room.jpg')+'" data-fallback="'+imgBase+'lab-room.jpg" alt="'+alt+'">';
document.addEventListener('error',e=>{const t=e.target;if(t&&t.tagName==='IMG'&&t.dataset.fallback&&t.src.indexOf(t.dataset.fallback)<0){t.src=t.dataset.fallback}},true);

const safe=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
function header(home,title){const h=document.createElement('div');h.className='researcher-header';h.innerHTML='<a class="researcher-brand" href="'+home+'"><span>🧪</span><span><small>BHCS · JUNIOR RESEARCHERS</small><b>小小研究員・虛擬實驗室</b></span></a><a class="researcher-home" href="'+home+'">回研究基地</a>';document.body.insertBefore(h,q('main'));}
function activeScreen(){return q('.researcher-screen.is-active')?.dataset.screen||''}
function screenHeading(id){const screen=q('.researcher-screen[data-screen="'+id+'"]'),heading=screen&&q('h1,h2,h3',screen);if(heading&&!heading.hasAttribute('tabindex'))heading.tabIndex=-1;return heading}
function stateFor(id){const prior=history.state&&typeof history.state==='object'?history.state:{};return {...prior,bhcsResearcher:true,screen:id}}
function show(id,options={}){const target=q('.researcher-screen[data-screen="'+id+'"]');if(!target)return;const previous=activeScreen(),push=options.push!==false;qa('.researcher-screen').forEach(s=>{const on=s===target;s.classList.toggle('is-active',on);s.setAttribute('aria-hidden',String(!on))});qa('.researcher-nav button').forEach(b=>b.setAttribute('aria-current',b.dataset.to===id?'step':'false'));if(push&&previous&&previous!==id)history.pushState(stateFor(id),'');else if(options.replace)history.replaceState(stateFor(id),'');scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});if(options.focus!==false)requestAnimationFrame(()=>screenHeading(id)?.focus({preventScroll:true}));try{sessionStorage.setItem('bhcs-researcher-screen:'+path,id)}catch(_){ }updateNotebookReturn()}
function nav(screens){const n=document.createElement('nav');n.className='researcher-nav';n.setAttribute('aria-label','研究流程');n.setAttribute('role','navigation');screens.forEach((s,i)=>{const screen=q('.researcher-screen[data-screen="'+s.id+'"]');if(screen){screen.setAttribute('role','region');screen.setAttribute('aria-label',s.label);screen.setAttribute('aria-hidden',String(i!==0))}const b=document.createElement('button');b.type='button';const parts=s.label.match(/^([①②③④])\s*(.*)$/);b.innerHTML=parts?'<span class="researcher-step-number" aria-hidden="true">'+safe(parts[1])+'</span><span>'+safe(parts[2])+'</span>':safe(s.label);b.setAttribute('aria-label',s.label);b.dataset.to=s.id;b.setAttribute('aria-current',i===0?'step':'false');b.onclick=()=>show(s.id);n.appendChild(b)});q('.researcher-header').after(n);history.replaceState(stateFor(activeScreen()||screens[0].id),'');addEventListener('popstate',event=>{if(event.state?.bhcsResearcher&&event.state.screen)show(event.state.screen,{push:false,focus:true})})}
function recordCount(){const body=q('#records');return body?qa('tr',body).filter(row=>!q('.empty,[colspan]',row)).length:0}
function updateNotebookReturn(){const count=recordCount();qa('[data-return-second]').forEach(button=>{button.hidden=count>=2;button.closest('.researcher-return').hidden=count>=2});qa('[data-open-notebook]').forEach(button=>{button.textContent='查看研究手冊（'+count+'）'})}
function installNotebookReturn(note){const wrap=document.createElement('div');wrap.className='researcher-return';wrap.innerHTML='<button class="researcher-primary" type="button" data-return-second>回去做第二筆 →</button><p>保留兩筆只差一個條件的觀察，才能比較。</p>';wrap.querySelector('button').onclick=()=>show('bench');const intro=q('.researcher-notebook-intro',note);intro?.after(wrap);updateNotebookReturn()}
function coach(text,sub){const d=document.createElement('div');d.className='researcher-coach';d.innerHTML='<img src="'+imgBase+'doc-point.png" alt="" width="64" height="70"><div><strong>余老師提示</strong><p>'+text+'</p>'+(sub?'<p>'+sub+'</p>':'')+'</div>';return d}
function welcome(){const s=document.createElement('section');s.className='researcher-screen is-active';s.dataset.screen='prepare';s.innerHTML='<div class="researcher-welcome"><div class="researcher-welcome-copy"><span class="researcher-kicker">MICROSCOPE MISSION · 顯微觀察站</span><h2>今天不背答案，<br>自己把規律找出來。</h2><p>你會親手移動試片、調焦、換倍率，再用兩筆觀察回答：「影像為什麼反著跑？高倍到底看得更多還是更少？」</p><div class="researcher-promise"><b>今天的研究任務</b><span>① 低倍找到清楚影像</span><span>② 拖動玻片找出影像方向</span><span>③ 換細胞標本比較倍率</span></div><div class="researcher-kit"><span>🔬 顯微鏡</span><span>🧫 玻片</span><span>📒 研究手冊</span></div><button class="researcher-primary" type="button" data-start>領取任務卡 →</button><p><small>建議 10–15 分鐘。直接動手操作，把你看到的變化記進研究手冊。</small></p></div><div class="researcher-scene">'+roomImg('顯微觀察站的生物實驗桌場景')+'<img class="doc" src="'+imgBase+'doc-microscope.png" data-fallback="'+imgBase+'doc-wave.png" alt="余老師正在看顯微鏡"><div class="researcher-bubble">先從低倍開始！<br>看清楚、動手移、再換高倍比較。</div></div></div>';s.querySelector('[data-start]').onclick=()=>show('bench');return s}
function microscope(){document.body.classList.add('researcher-ui');header('science/','虛擬顯微鏡');const main=q('main');const old=[...main.children];old.forEach(x=>x.remove());
 const prep=welcome(),bench=document.createElement('section'),note=document.createElement('section'),check=document.createElement('section');bench.className='researcher-screen';bench.dataset.screen='bench';note.className='researcher-screen';note.dataset.screen='notebook';check.className='researcher-screen';check.dataset.screen='check';
 bench.append(coach('從 4× 物鏡開始。影像清楚之後，拖動下方玻片找出移動方向，再換高倍比較。','拖曳玻片時看上方視野；觀察完成後，可直接在控制區收進研究手冊。'));
 const exp=old.find(x=>x.id==='experiment'),spec=old.find(x=>x.id==='specimens'),obs=old.find(x=>x.id==='observe'),record=old.find(x=>x.id==='record'),quiz=old.find(x=>x.id==='quiz'),guide=old.find(x=>x.classList&&x.classList.contains('lesson-route')),teaching=old.find(x=>x.matches&&x.matches('[aria-label="教材使用指南"]'));
 if(exp)bench.append(exp);if(spec){const tb=document.createElement('div');tb.className='researcher-taskbar';qa('.mission',spec).forEach((m,i)=>{m.classList.toggle('is-current',i===0);m.addEventListener('click',()=>qa('.mission',spec).forEach(x=>x.classList.toggle('is-current',x===m)));tb.append(m)});bench.append(tb);const txt=q('#missionText',spec);if(txt)bench.append(txt)}if(obs)bench.append(obs);

 note.innerHTML='<div class="researcher-notebook-intro"><img class="notebook-doc" src="'+imgBase+'doc-notebook.png" alt="" width="76" height="120" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'notebook-sticker\',textContent:\'📒\'}))"><div><h2>余老師的研究手冊</h2><p>留下低倍、高倍各一筆，再用自己的話寫：「我改了什麼？我看到什麼變化？」</p></div></div>';if(record)note.append(record);if(guide)note.append(guide);if(quiz)check.append(quiz);if(teaching)check.append(teaching);
 main.append(prep,bench,note,check);nav([{id:'prepare',label:'① 接任務'},{id:'bench',label:'② 動手做'},{id:'notebook',label:'③ 研究手冊'},{id:'check',label:'④ 挑戰題'}]);installNotebookReturn(note);
 q('#addRecord')?.addEventListener('click',()=>{setTimeout(updateNotebookReturn,60)});
 q('#checkQuiz')?.addEventListener('click',()=>{q('#quizScore')?.scrollIntoView({block:'center'})});
 let restore='';try{restore=sessionStorage.getItem('bhcs-researcher-screen:'+path)||''}catch(_){}
 if(['bench','notebook','check'].includes(restore))show(restore,{push:false,replace:true,focus:false});
}
const legacyStations={
 'genetics-simulation-lab.html':{title:'遺傳與機率研究站',kicker:'GENETICS MISSION',desc:'從親代配子、龐氏方格到隨機抽樣，自己找出「理論比例」和「實際抽樣」為什麼不一定完全相同。',kit:['🧬 基因型','▦ 龐氏方格','🎲 隨機抽樣']},
 'force-motion-lab.html':{title:'力與運動研究站',kicker:'FORCE & MOTION MISSION',desc:'改變質量、施力與摩擦，直接觀察合力、加速度和運動圖表怎麼一起變。',kit:['🚗 小車','➡️ 受力箭頭','📈 運動圖']},
 'circuit-lab.html':{title:'電路研究站',kicker:'CIRCUIT MISSION',desc:'改變接法、電壓與電阻，從電流路徑與讀值比較串聯、並聯和開路。',kit:['🔋 電源','💡 燈泡','⚡ 電流']},
 'particle-reaction-lab.html':{title:'粒子反應研究站',kicker:'REACTION MISSION',desc:'調整反應物數量，看粒子重新組合，追蹤哪些原子留下、哪些分子先用完。',kit:['⚛️ 粒子','🧪 反應','⚖️ 守恆']},
 'heat-phase-lab.html':{title:'熱與物態研究站',kicker:'HEAT MISSION',desc:'沿著加熱與冷卻曲線追蹤溫度、物態與粒子，找出相變平台的真正意義。',kit:['🌡️ 溫度','💧 物態','🔥 熱量']},
 'plate-earthquake-lab.html':{title:'板塊與地震研究站',kicker:'EARTH MISSION',desc:'切換板塊邊界、觸發地震，再用測站資料找出震央，分清震源、震央與地形。',kit:['🌏 板塊','📍 震央','〰️ 地震波']},
 'buoyancy-density-lab.html':{title:'浮力與密度研究站',kicker:'BUOYANCY MISSION',desc:'把不同物體放進液體，直接比較密度、浮力、排開體積與沉底後的支持力。',kit:['🧊 物體','💧 液體','⚖️ 浮力']},
 'acid-base-indicator-lab.html':{title:'酸鹼與指示劑研究站',kicker:'ACID–BASE MISSION',desc:'調整酸鹼濃度與體積，觀察混合後的 pH、剩餘離子與指示劑顏色。',kit:['🧪 酸鹼','🌈 指示劑','📏 pH']},
 'photosynthesis-factor-lab.html':{title:'光合作用因素研究站',kicker:'PLANT MISSION',desc:'改變光照、二氧化碳與溫度，觀察哪一項因素限制目前的光合作用速率。',kit:['☀️ 光照','🌿 植物','💨 CO₂']}
};
function legacyWelcome(meta){const s=document.createElement('section');s.className='researcher-screen is-active';s.dataset.screen='prepare';s.innerHTML='<div class="researcher-welcome"><div class="researcher-welcome-copy"><span class="researcher-kicker">'+safe(meta.kicker)+'</span><h2>'+safe(meta.title)+'</h2><p>'+safe(meta.desc)+'</p><div class="researcher-promise"><b>余老師的研究規則</b><span>① 每次只改一個條件</span><span>② 看圖像，也讀數值</span><span>③ 至少留下兩筆可以比較的紀錄</span></div><div class="researcher-kit">'+meta.kit.map(x=>'<span>'+safe(x)+'</span>').join('')+'</div><button class="researcher-primary" type="button" data-start>領取任務卡 →</button></div><div class="researcher-scene">'+roomImg('小小研究員虛擬實驗室場景')+'<img class="doc" src="'+imgBase+'doc-point.png" alt="余老師帶領研究任務"><div class="researcher-bubble">先動手做一輪，<br>再用兩筆證據找規律！</div></div></div>';s.querySelector('[data-start]').onclick=()=>show('bench');return s}
function legacyStation(){const key=path.split('/').pop(),meta=legacyStations[key];if(!meta)return false;document.body.classList.add('researcher-ui','legacy-researcher');header('science/',meta.title);const main=q('main');if(!main)return true;const old=[...main.children];old.forEach(x=>x.remove());const prep=legacyWelcome(meta),bench=document.createElement('section'),note=document.createElement('section'),check=document.createElement('section');bench.className='researcher-screen';bench.dataset.screen='bench';note.className='researcher-screen';note.dataset.screen='notebook';check.className='researcher-screen';check.dataset.screen='check';
 const guide=old.find(x=>x.classList?.contains('lesson-route')),exp=old.find(x=>x.classList?.contains('labgrid')),record=old.find(x=>x.id==='record'),quiz=old.find(x=>x.id==='quiz'),teaching=old.find(x=>x.matches?.('[aria-label="教材使用指南"]'));const expI=old.indexOf(exp),recI=old.indexOf(record),quizI=old.indexOf(quiz);const used=new Set([guide,record,quiz,teaching].filter(Boolean));
 bench.append(coach('先完成一輪操作，再只改一個條件做第二輪。觀察圖像、讀值和變化方向。','不用先猜答案；研究手冊要留下的是你真的看到的證據。'));if(exp){bench.append(exp);used.add(exp)}if(expI>=0&&recI>expI)old.slice(expI+1,recI).forEach(x=>{if(!used.has(x)){bench.append(x);used.add(x)}});
 note.innerHTML='<div class="researcher-notebook-intro"><img class="notebook-doc" src="'+imgBase+'doc-notebook.png" alt="" width="76" height="120" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'notebook-sticker\',textContent:\'📒\'}))"><div><h2>余老師的研究手冊</h2><p>把觀察結果收進手冊，再比較兩筆只差一個條件的紀錄。</p></div></div>';if(record){note.append(record);used.add(record)}if(guide){note.append(guide);used.add(guide)}
 if(quiz){check.append(quiz);used.add(quiz)}if(teaching){check.append(teaching);used.add(teaching)}old.forEach(x=>{if(!used.has(x))check.append(x)});main.append(prep,bench,note,check);nav([{id:'prepare',label:'① 接任務'},{id:'bench',label:'② 動手做'},{id:'notebook',label:'③ 研究手冊'},{id:'check',label:'④ 挑戰題'}]);installNotebookReturn(note);q('#addRecord')?.addEventListener('click',()=>setTimeout(updateNotebookReturn,60));q('#checkQuiz')?.addEventListener('click',()=>q('#quizScore')?.scrollIntoView({block:'center'}));let restore='';try{restore=sessionStorage.getItem('bhcs-researcher-screen:'+path)||''}catch(_){}if(['bench','notebook','check'].includes(restore))show(restore,{push:false,replace:true,focus:false});return true}
function scienceWelcome(conf){const s=document.createElement('section');s.className='researcher-screen is-active';s.dataset.screen='prepare';const tasks=(conf.tasks||[]).slice(0,3).map((t,i)=>'<span>'+'①②③'.charAt(i)+' '+safe(t.title.replace(/^① |^② |^③ /,''))+'</span>').join('');s.innerHTML='<div class="researcher-welcome"><div class="researcher-welcome-copy"><span class="researcher-kicker">SCIENCE MISSION · '+safe(conf.unit)+'研究站</span><h2>'+safe(conf.title.replace('實驗室','研究站'))+'</h2><p>'+safe(conf.description)+'</p><div class="researcher-promise"><b>今天的研究任務</b>'+tasks+'<em class="researcher-guess">先猜猜看：哪個讀值會變大或變小？先記在心裡，不用作答。</em></div><div class="researcher-kit"><span>🧪 改變條件</span><span>👀 讀取觀察</span><span>📒 留下證據</span></div><button class="researcher-primary" type="button" data-start>領取任務卡 →</button><p><small>建議 '+safe(conf.minutes)+' 分鐘。先猜也可以，不擋操作、不評對錯。</small></p></div><div class="researcher-scene">'+roomImg('小小研究員虛擬實驗室場景')+'<img class="doc" src="'+imgBase+'doc-point.png" alt="余老師帶領研究任務"><div class="researcher-bubble">先改一個條件，<br>再看數據怎麼變！</div></div></div>';s.querySelector('[data-start]').onclick=()=>show('bench');return s}
function scienceStation(){const configNode=q('#lab-config');if(!configNode)return;let conf;try{conf=JSON.parse(configNode.textContent)}catch(_){return}if(!conf.noPrediction)return;document.body.classList.add('researcher-ui','researcher-station');header('./',conf.title);const main=q('#main'),old=[...main.children];old.forEach(x=>x.remove());const prep=scienceWelcome(conf),bench=document.createElement('section'),note=document.createElement('section'),check=document.createElement('section');bench.className='researcher-screen';bench.dataset.screen='bench';note.className='researcher-screen';note.dataset.screen='notebook';check.className='researcher-screen';check.dataset.screen='check';
 const used=new Set(),lesson=old.find(x=>x.classList?.contains('lesson-meta')),missions=old.find(x=>x.querySelector?.('.missions')),exp=old.find(x=>x.id==='experiment'),records=old.find(x=>x.id==='records-section'),quiz=old.find(x=>x.id==='quiz'),teacher=old.find(x=>x.id==='teacher');
 [lesson,missions,exp,records,quiz,teacher].filter(Boolean).forEach(x=>used.add(x));if(lesson)prep.append(lesson);bench.append(coach('先挑一張任務卡，或自己設定條件；每次只改一個變因，觀察圖像與讀值怎麼變。','完成一輪後，把數據和自己的解釋收進研究手冊。'));if(missions)bench.append(missions);if(exp)bench.append(exp);
 note.innerHTML='<div class="researcher-notebook-intro"><img class="notebook-doc" src="'+imgBase+'doc-notebook.png" alt="" width="76" height="120" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'notebook-sticker\',textContent:\'📒\'}))"><div><h2>余老師的研究手冊</h2><p>至少保留兩筆只差一個條件的觀察，再用自己的話寫出數據怎麼變、你怎麼解釋。結果和你原本想的一樣嗎？</p></div></div>';if(records)note.append(records);if(quiz)check.append(quiz);if(teacher)check.append(teacher);old.filter(x=>!used.has(x)).forEach(x=>check.append(x));main.append(prep,bench,note,check);nav([{id:'prepare',label:'① 接任務'},{id:'bench',label:'② 動手做'},{id:'notebook',label:'③ 研究手冊'},{id:'check',label:'④ 挑戰題'}]);installNotebookReturn(note);
 const stage=q('#diagram');if(stage){const zoom=document.createElement('button');zoom.type='button';zoom.className='researcher-zoom';zoom.setAttribute('aria-pressed','false');zoom.textContent='🔍 放大圖解';zoom.onclick=()=>{const on=!stage.classList.contains('is-zoomed');stage.classList.toggle('is-zoomed',on);zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?'↩ 縮回全圖':'🔍 放大圖解'};stage.after(zoom);const fit=()=>{if(stage.classList.contains('is-zoomed'))return;stage.classList.remove('is-tall');stage.classList.toggle('is-tall',stage.scrollHeight>stage.clientHeight+8)};new MutationObserver(()=>requestAnimationFrame(fit)).observe(stage,{childList:true,subtree:true});addEventListener('resize',fit)}
 q('#add-record')?.addEventListener('click',()=>setTimeout(updateNotebookReturn,60));q('#check-quiz')?.addEventListener('click',()=>q('#quiz-score')?.scrollIntoView({block:'center'}));let restore='';try{restore=sessionStorage.getItem('bhcs-researcher-screen:'+path)||''}catch(_){}if(['bench','notebook','check'].includes(restore))show(restore,{push:false,replace:true,focus:false})}
function directory(){document.body.classList.add('researcher-directory');const main=q('main');if(!main)return;const h=document.createElement('div');h.className='researcher-header';h.innerHTML='<a class="researcher-brand" href="../mini-lab/"><span>🧪</span><span><small>BHCS · JUNIOR RESEARCHERS</small><b>小小研究員・虛擬實驗室</b></span></a><a class="researcher-home" href="../../ziyuan.html">回學習資源</a>';document.body.insertBefore(h,main);const lobby=document.createElement('section');lobby.className='researcher-welcome researcher-lobby';lobby.innerHTML='<div class="researcher-welcome-copy"><span class="researcher-kicker">BHCS · SCIENCE LAB</span><h1>小小研究員<br>虛擬實驗室</h1><p>不是看完一頁教材，而是進入一座研究站：親手操作、留下觀察、整理研究手冊，再回答挑戰題。</p><div class="researcher-promise"><b>第一次來？</b><span>從顯微觀察站開始最剛好。</span><span>跟著余老師操作，完成後把證據收進研究手冊。</span></div><div class="researcher-kit"><span>🔬 觀察</span><span>🧪 操作</span><span>📒 紀錄</span></div><a class="researcher-primary" href="../microscope-lab.html">進入顯微觀察站 →</a></div><div class="researcher-scene"><img class="room" src="../mini-lab/img/lab-room.jpg" alt="小小研究員實驗室大廳"><img class="doc" src="../mini-lab/img/doc-wave.png" alt="余老師"><div class="researcher-bubble">挑一張任務卡，<br>今天想研究什麼？</div></div>';main.insertBefore(lobby,main.firstChild);
 const subjectIcons={生物:'icon-photo.png',理化:'icon-cabbage.png',地科:'icon-solar.png','國小自然':'icon-tools.png'};
 const STATION={'microscope-lab':['microscope','移動試片、換倍率，找出影像方向與視野大小的規律。'],'photosynthesis-factor-lab':['photosynthesis','只改光照、二氧化碳或溫度其中一項，找出是哪個因素限制了光合作用。'],'genetics-simulation-lab':['genetics','設定親代基因型，比較龐氏方格的理論比例和實際抽樣的子代數。'],'force-motion-lab':['force','改變施力或接觸面，比較合力、加速度與速度的變化。'],'buoyancy-density-lab':['buoyancy','把同一個物體放進不同液體，比較浮沉狀態與浮力讀值。'],'particle-reaction-lab':['particle','改變反應物的數量，找出誰先用完，並檢查反應前後原子數有沒有變。'],'acid-base-indicator-lab':['acid-base','改變酸與鹼的體積或濃度，觀察 pH 與指示劑顏色怎麼變。'],'heat-phase-lab':['heat','持續加熱，比較升溫階段和狀態變化階段的溫度曲線。'],'circuit-lab':['circuit','比較單燈、串聯和並聯，看電流與燈泡亮度有什麼不同。'],'plate-earthquake-lab':['plate','比較不同板塊邊界的震源深度，再用 P 波與 S 波的到達時間差找震央。'],'optics':['optics','把物體放在兩倍焦距外和焦點內，比較像的位置、大小與正倒。'],'wave-sound':['wave','固定聲速只改頻率，看波長怎麼變；再比較開管和閉管的共振。'],'electromagnetism':['electromagnet','改變匝數和電流，比較電磁鐵磁場的強弱與方向。'],'pressure-fluid':['pressure','改變深度或液體密度看水壓；再比較管子變窄時流速與壓力的變化。'],'solubility':['solubility','固定水量、改變溫度，比較能溶多少、還剩多少沒溶。'],'energy':['energy','改變高度或損耗比例，追蹤位能、動能與內能的總和。'],'moon-eclipse':['moon','移動月球位置，對照從地球看和從太空看的月相，再找日月食的條件。'],'seasons':['seasons','改變緯度和季節，比較正午太陽高度與白晝長度。'],'plant-exchange':['plant-exchange','改變光照、氣孔開度或濕度，分開比較光合作用、呼吸作用與蒸散。'],'ecosystem':['ecosystem','追蹤能量在食物網中往上傳還剩多少，再看族群數量怎麼接近承載量。'],'lenses':['optics'],'convex-lens-imaging':['optics'],'eye-lesson':['optics'],'color-primaries':['optics'],'waves':['wave'],'dc-motor':['electromagnet'],'generator-sim':['electromagnet'],'moon-phases':['moon']};
 qa('.resource').forEach(c=>{const subject=c.dataset.subject||'國小自然';const href=(q('a.open,.open a,a[href]',c)||{}).getAttribute?.('href')||'';const key=href.replace(/\/$/,'').split('/').pop().replace(/\.html$/,'');const st=STATION[key]||[];const img=document.createElement('img');img.className='station-icon';img.alt='';img.loading='lazy';img.width=70;img.height=70;const fb='../mini-lab/img/'+(subjectIcons[subject]||'icon-tools.png');if(st[0]){img.src='../../assets/science/icons/icon-'+st[0]+'.webp';img.dataset.fallback=fb}else img.src=fb;c.prepend(img);const label=document.createElement('span');label.className='station-label';label.textContent='研究站';c.insertBefore(label,q('h2,h3',c));if(st[1]){const line=document.createElement('p');line.className='mission-line';line.textContent='任務：'+st[1];const open=q('.open',c);if(open)c.insertBefore(line,open);else c.appendChild(line)}});
}
if(path.endsWith('/microscope-lab.html'))microscope();else if(path.endsWith('/tools/science/')||path.endsWith('/tools/science/index.html'))directory();else if(path.includes('/tools/science/')&&path.endsWith('.html'))scienceStation();else legacyStation();
// Give every legacy station the same save path as the newer stations.
function installBenchRecords(){
 const source=q('#addRecord'),bench=q('[data-screen="bench"]');
 if(!source||!bench)return;
 const box=document.createElement('div');box.className='researcher-save';
 box.innerHTML='<button type="button" class="researcher-primary researcher-bench-record">把這次觀察收進手冊</button><p class="researcher-save-status" role="status" aria-live="polite"></p><button type="button" class="researcher-notebook-link" data-open-notebook>查看研究手冊</button>';
 const save=q('.researcher-bench-record',box),message=q('.researcher-save-status',box);
 const sync=()=>{save.disabled=source.disabled;if(source.disabled)message.textContent='完成本輪操作後，就能保存觀察。';else if(!message.dataset.saved)message.textContent='觀察已準備好，可以收進手冊。';};
 save.addEventListener('click',()=>{const before=recordCount();source.click();if(recordCount()>before){message.dataset.saved='true';message.textContent='已收進第 '+recordCount()+' 筆觀察。只改一個條件，再做一次比較。';}updateNotebookReturn()});
 q('[data-open-notebook]',box).addEventListener('click',()=>show('notebook'));
 const target=q('#sampleStatus',bench)||q('.labgrid > .panel',bench);
 if(target?.id==='sampleStatus')target.after(box);else (target||bench).append(box);
 new MutationObserver(()=>{delete message.dataset.saved;sync()}).observe(source,{attributes:true,attributeFilter:['disabled']});sync();
}
function installNotebookUpdates(){
 const records=q('#records');if(!records)return;
 new MutationObserver(updateNotebookReturn).observe(records,{childList:true,subtree:true});updateNotebookReturn();
}
// Do not mark an unanswered question wrong or leave an old score after editing.
function installLegacyQuizFeedback(){
 const check=q('#checkQuiz'),score=q('#quizScore'),quiz=q('#quiz');if(!check||!score||!quiz)return;
 const questions=qa('.quizItem fieldset',quiz);
 check.addEventListener('click',event=>{
  const missing=questions.filter(fs=>!q('input:checked',fs));if(!missing.length)return;
  event.preventDefault();event.stopImmediatePropagation();
  questions.forEach(fs=>{const out=q('.feedback',fs.closest('.quizItem'));out.className='feedback';out.textContent=q('input:checked',fs)?'':'尚未作答，請先選擇答案。'});
  score.textContent='已答 '+(questions.length-missing.length)+'／'+questions.length+' 題，請補完未答題後再檢查。';
  const input=q('input',missing[0]);input?.focus({preventScroll:true});missing[0].scrollIntoView({block:'start',behavior:'instant'});
 },true);
 quiz.addEventListener('change',event=>{
  if(!event.target.matches('input[type="radio"]'))return;
  const out=q('.feedback',event.target.closest('.quizItem'));if(out){out.textContent='';out.className='feedback'}
  score.textContent='答案已變更，請重新檢查。';
 });
}
installBenchRecords();installNotebookUpdates();installLegacyQuizFeedback();
// Keep the short speech notch level with the mouth in the painted image,
// including object-fit letterboxing, font wrapping and viewport changes.
function alignWelcomeSpeech(){
 qa('.researcher-scene').forEach(scene=>{
  const doc=q('.doc',scene),bubble=q('.researcher-bubble',scene);
  if(!doc||!bubble)return;
  const align=()=>{
   if(!scene.offsetWidth||!doc.naturalWidth)return;
   const s=scene.getBoundingClientRect(),d=doc.getBoundingClientRect();
   const scale=Math.min(d.width/doc.naturalWidth,d.height/doc.naturalHeight);
   const w=doc.naturalWidth*scale,h=doc.naturalHeight*scale;
   const x=d.left-s.left+(d.width-w)/2,y=d.top-s.top+(d.height-h)/2;
   const microscope=doc.src.includes('doc-microscope'),wave=doc.src.includes('doc-wave');
   const mouthY=y+h*(microscope?.32:wave?.28:.30);
   const bw=bubble.offsetWidth,bh=bubble.offsetHeight,pad=s.width<500?12:24;
   const left=Math.min(s.width-bw-pad,Math.max(s.width*.42,x+w*.70+24));
   const top=Math.max(18,Math.min(s.height-bh-18,mouthY-bh*.65));
   bubble.style.setProperty('--speech-left',(s.width<500?s.width-bw-pad:left)+'px');
   bubble.style.setProperty('--speech-top',top+'px');
   bubble.style.setProperty('--speech-tail-top',Math.max(12,Math.min(bh-32,mouthY-top-10))+'px');
   bubble.classList.add('is-aligned');
  };
  doc.addEventListener('load',align);
  if(typeof ResizeObserver!=='undefined'){
   const observer=new ResizeObserver(align);observer.observe(scene);observer.observe(doc);observer.observe(bubble);
  }
  document.fonts?.ready.then(align);align();
 });
}
alignWelcomeSpeech();
})();
