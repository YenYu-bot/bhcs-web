(()=>{
 'use strict';
 const conf=JSON.parse(document.getElementById('researcher-config').textContent),$=id=>document.getElementById(id),main=document.querySelector('main'),route=document.querySelector('.lesson-route');
 const make=(tag,text='',cls='')=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e};
 const button=(text,action,cls='lab-secondary')=>{const b=make('button',text,cls);b.type='button';b.addEventListener('click',action);return b};
 const img=(file,alt,cls='')=>{const e=make('img','',cls);e.src=conf.img+file;e.alt=alt;e.width=200;e.height=220;return e};
 const title=document.querySelector('h1').textContent,steps=[...route.querySelectorAll('.route-steps li p')].map(e=>e.textContent),question=$('self-study-title').textContent.replace('自學起點：','');
 const originals=[...main.children],hero=document.querySelector('.hero');
 const header=make('header','','lab-header'),brand=make('div');brand.append(make('div','小小研究員 · 虛擬實驗室','lab-kicker'),make('h1',title));const home=make('a','← 回實驗室','lab-home');home.href=conf.home;header.append(brand,home);main.before(header);if(hero)hero.hidden=true;
 document.querySelectorAll('h1').forEach(e=>{if(!header.contains(e)){const h=make('h2',e.textContent);e.replaceWith(h)}});
 // Keep existing engine nodes and listeners: moving nodes never resets the experiment.
 const screens={},labels={prepare:'① 接任務',bench:'② 動手做',notebook:'③ 研究手冊',check:'④ 挑戰題',reference:'老師與模型說明'};
 for(const id of Object.keys(labels)){const section=make('section','','lab-screen');section.id='lab-'+id;section.setAttribute('aria-label',labels[id]);screens[id]=section;main.append(section)}
 const nav=make('nav','','lab-nav');nav.setAttribute('aria-label','實驗步驟');const navButtons={};for(const id of ['prepare','bench','notebook','check']){const b=button(labels[id],()=>show(id),'');b.setAttribute('aria-controls',screens[id].id);navButtons[id]=b;nav.append(b)}main.prepend(nav);
 const welcome=make('div','','lab-welcome'),picture=make('div','','lab-welcome-picture');picture.style.backgroundImage=`url("${conf.img}lab-room.jpg")`;picture.append(img('doc-wave.png','奇奇博士歡迎你'));const copy=make('div','','lab-welcome-copy');copy.append(make('span','今天的研究問題','lab-kicker'),make('h2',question),make('p','嗨，我是奇奇博士。先猜一猜，再動手找證據；猜錯也能有新發現。'),make('p',steps[0]),make('p','本次挑戰：'+conf.inquiry[3],'lab-task-rule'),button('接受任務，進入操作台 →',()=>show('bench'),'lab-primary'),make('p','免登入 · 不用填姓名 · 可隨時回到前一步','lab-promise'));welcome.append(picture,copy);screens.prepare.append(welcome);
 const coach=make('aside','','lab-coach'),doc=img('doc-point.png','奇奇博士'),speech=make('div'),coachTitle=make('strong','奇奇博士 · 現在這樣做'),coachText=make('p',steps[0]),hint=make('p','先做預測；不確定時也可以先猜一個。','lab-hint');speech.append(coachTitle,coachText,hint);coach.append(doc,speech);screens.bench.append(coach);
 const more=make('details','','lab-more');more.append(make('summary','打開延伸實驗與圖解'));screens.bench.append(more);
 for(const e of originals){
  if(e===route){screens.notebook.append(e);continue}
  if(e.matches('.labgrid,#experiment.layout')){screens.bench.insertBefore(e,more);continue}
  if(['record','records-section'].includes(e.id)){screens.notebook.prepend(e);continue}
  if(e.id==='quiz'){screens.check.append(e);continue}
  if(e.querySelector('[data-mission]')){e.classList.add('mission-picker');const picker=make('details','','mission-picker');picker.append(make('summary','換一個研究任務'));picker.append(e);screens.bench.insertBefore(picker,more);continue}
  if(e.matches('.lesson-meta,.safety,#teacher'))screens.reference.append(e);else more.append(e);
 }
 // Give the notebook a visible writing area; retain the existing autosave listener.
 const inquiry=$('inquiry-guide');inquiry.open=true;const noteLabel=route.querySelector('label[for="study-note"]'),note=$('study-note');if(note){route.prepend(make('h2','寫下我的發現','lab-note-heading'),noteLabel,note);}
 const benchFooter=make('div','','lab-bench-actions');benchFooter.append(button('保存後，打開研究手冊 →',()=>show('notebook')),button('我卡住了，給我提示',()=>{hint.textContent=conf.inquiry[4];doc.src=conf.img+'doc-point.png';}));screens.bench.append(benchFooter);
 // First-batch record buttons originally sit on another section. Bring the action to the bench.
 if(!conf.second&&$('addRecord')){const quick=button('把目前觀察收進手冊',()=>{$('addRecord').click();refresh()});quick.id='lab-save-observation';benchFooter.prepend(quick);}
 const noteHelp=make('div','','lab-evidence');noteHelp.append(make('strong','用兩筆觀察說明你的發現'),make('p','保持不變：'+conf.inquiry[0]),make('p','只改這一項：'+conf.inquiry[1]),make('p','讀取證據：'+conf.inquiry[2]));screens.notebook.prepend(noteHelp);
 const badge=make('div','','lab-badge'),badgeText=make('div'),badgeStatus=make('strong'),badgeDetails=make('p');badge.append(img('badge-master.png','研究活動徽章'),badgeText);badgeText.append(badgeStatus,badgeDetails);screens.check.append(badge);
 const bottom=make('div','','lab-bottom'),back=button('← 上一步',()=>show(order[Math.max(0,order.indexOf(current)-1)])),next=button('下一步 →',()=>show(order[Math.min(3,order.indexOf(current)+1)]),'lab-primary');bottom.append(back,next);main.append(bottom);
 const foot=make('div','','lab-footer');foot.append(button('老師與模型說明',()=>show('reference')),make('p','這是教學模擬。研究紀錄只保留在本機，活動徽章不代表已掌握全部概念。'));main.append(foot);
 const order=['prepare','bench','notebook','check'];let current='prepare',entered=false;
 function countRecords(){return new Set([...document.querySelectorAll('#records tr')].filter(tr=>tr.children.length>1).map(tr=>[...tr.cells].slice(1).map(c=>c.textContent).join('|'))).size}
 function refresh(){if(!document||!main.isConnected)return;const n=countRecords(),score=$('quiz-score')||$('quizScore'),passed=!!score&&/答對\s*3\s*[／/]\s*3/.test(score.textContent);badgeStatus.textContent=n>=2&&passed?'研究活動完成！':'研究徽章等待解鎖';badgeDetails.textContent=`觀察紀錄 ${Math.min(2,n)}／2 · 三題檢核${passed?'已通過':'尚未通過'}。${n>=2&&passed?'再用自己的話說明兩筆證據的差異。':'完成兩筆觀察並檢查三題答案，再回來看看。'}`;const source=$('addRecord'),quick=$('lab-save-observation');if(quick)quick.disabled=source.disabled;
  if(n>=2){coachText.textContent=steps[2];doc.src=conf.img+'doc-thumb.png'}else if(n===1){coachText.textContent='第一筆已收好。'+conf.inquiry[1]+' 再做一次預測與觀察。';doc.src=conf.img+'doc-point.png'}
 }
 function show(id,focus=true){if(!screens[id])return;current=id;if(id==='bench'&&!entered){entered=true;if(conf.second&&!document.querySelector('[data-mission][aria-current]'))document.querySelector('[data-mission]')?.click();}Object.entries(screens).forEach(([key,e])=>e.hidden=key!==id);Object.entries(navButtons).forEach(([key,b])=>{if(key===id)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});back.hidden=id==='prepare'||id==='reference';next.hidden=id==='check'||id==='reference';refresh();if(focus){const target=screens[id].querySelector('h2,h3')||screens[id];target.setAttribute('tabindex','-1');target.focus({preventScroll:true});main.scrollIntoView?.({block:'start',behavior:'instant'});}window.dispatchEvent(new Event('resize'));}
 const feedback=$('control-feedback')||$('status');if(feedback)new MutationObserver(()=>{hint.textContent=feedback.textContent;refresh()}).observe(feedback,{childList:true,subtree:true,characterData:true});
 const records=$('records');if(records)new MutationObserver(refresh).observe(records,{childList:true,subtree:true});
 const quiz=$('quiz-score')||$('quizScore');if(quiz)new MutationObserver(refresh).observe(quiz,{childList:true,subtree:true,characterData:true});
 // No stale success after the learner changes a checked answer.
 screens.check.addEventListener('change',e=>{if(e.target.matches('input[type=radio]')){if(quiz)quiz.textContent='答案已變更，請重新檢查。';const item=e.target.closest('.quizItem,fieldset');item?.querySelectorAll('.feedback').forEach(n=>n.textContent='');refresh()}});
 document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const target=$(decodeURIComponent(a.getAttribute('href').slice(1)));if(!target)return;const region=target.closest('.lab-screen');if(region){show(region.id.replace('lab-',''),false);let p=target.parentElement;while(p&&p!==region){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}}});
 window.addEventListener('hashchange',()=>revealHash());function revealHash(){const target=$(decodeURIComponent(location.hash.slice(1)));const region=target?.closest('.lab-screen');if(region){let parent=target.parentElement;while(parent&&parent!==region){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement}}if(region)show(region.id.replace('lab-',''),false)}
 if(conf.second){const zoom=button('放大圖解',()=>{const on=zoom.getAttribute('aria-pressed')!=='true';zoom.setAttribute('aria-pressed',String(on));zoom.textContent=on?'縮回完整圖解':'放大圖解';},'lab-secondary stage-zoom');zoom.setAttribute('aria-pressed','false');$('diagram').before(zoom);}
 const printNote=make('p','','print-only');printNote.id='lab-print-note';if(note)note.after(printNote);window.addEventListener('beforeprint',()=>{printNote.textContent='我的解釋：'+(note?.value||'尚未填寫');});
 document.body.classList.add('researcher-app');show('prepare',false);revealHash();
})();
