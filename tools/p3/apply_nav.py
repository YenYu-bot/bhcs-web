import json,sys,re
secs=json.load(open('/home/claude/tools/p3/secs.json'))
def nav(*names):return json.dumps([[n,secs[n]] for n in names],ensure_ascii=False,separators=(',',':'))
RENDER='function renderPageNav(sel,nav,here){/* phase 3：選單依課綱冊次分組，可跨檔連到同一冊的主題（網址不變） */sel.innerHTML=nav.map(([g,items])=>`<optgroup label="${g}">`+items.map(([h,t])=>`<option value="${h}"${h===here?" selected":""}>${t}</option>`).join("")+"</optgroup>").join("");sel.onchange=()=>{location.href=sel.value}}\n'
def patch(path,old,new,pre_anchor,pre_text):
    s=open(path,encoding='utf8').read()
    assert s.count(old)==1,(path,'old',s.count(old));s=s.replace(old,new)
    assert s.count(pre_anchor)==1,(path,'anchor');s=s.replace(pre_anchor,pre_text+pre_anchor)
    open(path,'w',encoding='utf8').write(s)
root='/home/claude/bhcs-web/tools/math/'
which=sys.argv[1]
if which=='g10':
    patch(root+'g10-drills.html',
     'sel.innerHTML=TOPIC_ORDER.map(([k,t])=>`<option value="${k}"${k===TOPIC_KEY?" selected":""}>${t}</option>`).join("");sel.onchange=()=>{location.search="?topic="+encodeURIComponent(sel.value)};',
     'renderPageNav(sel,PAGE_NAV,"g10-drills.html?topic="+TOPIC_KEY);',
     'function syncTopicMeta(){',
     RENDER+'const PAGE_NAV='+nav('高一上・第一冊','高一下・第二冊')+';\n')
if which=='g11':
    patch(root+'g11-drills.html',
     'sel.innerHTML=TOPIC_ORDER.map(([k,t])=>`<option value="${k}"${k===TOPIC_KEY?" selected":""}>${t}</option>`).join("");sel.onchange=()=>{location.search="?topic="+encodeURIComponent(sel.value)};',
     'const here="g11-drills.html?topic="+TOPIC_KEY;renderPageNav(sel,NAV_G10.some(([,items])=>items.some(([h])=>h===here))&&!NAV_G11.some(([,items])=>items.some(([h])=>h===here))?NAV_G10:NAV_G11,here);',
     'function syncTopicMeta(){',
     RENDER+'/* 高一下（第二冊）主題程式仍在本檔、網址不變，但選單顯示高一頁的主題 */const NAV_G10='+nav('高一上・第一冊','高一下・第二冊')+',NAV_G11='+nav('高二上・第三冊 A','高二下・第四冊 A')+';\n')
if which in('g7','g8'):
    f=root+which+'-drills.html'
    old='TOPICS.forEach(([k,n])=>{const o=document.createElement("option");o.value=k;o.textContent=n;if(k===TOPIC_KEY)o.selected=true;sel.appendChild(o)});sel.addEventListener("change",()=>{location.search="?topic="+sel.value});'
    if which=='g8':
        new='renderPageNav(sel,PAGE_NAV,"g8-drills.html?topic="+TOPIC_KEY);'
        pre=RENDER+'/* 函數（國二下）程式在 g7-drills.html，網址不變，列在國二選單 */const PAGE_NAV='+nav('國二')+';\n'
    else:
        new='renderPageNav(sel,TOPIC_KEY==="function"?NAV_G8:NAV_G7,"g7-drills.html?topic="+TOPIC_KEY);'
        pre=RENDER+'/* 函數是國二下內容：程式留在本檔、網址不變，但選單顯示國二頁的主題 */const NAV_G7='+nav('國一')+',NAV_G8='+nav('國二')+';\n'
    patch(f,old,new,'function build(){',pre)
print('ok',which)
