import re,json,sys
idx=open('/home/claude/bhcs-web/tools/math/index.html',encoding='utf8').read()
# sections: h2 label followed by grid cards
secs={}
for m in re.finditer(r'<h2>([^<]+)<span>[^<]*</span></h2><div class="grid">(.*?)</div>',idx):
    cards=re.findall(r'<a class="card" href="(g\d+-drills\.html\?topic=[a-z0-9]+)"><b>([^<]+)</b>',m.group(2))
    secs[m.group(1)]=[[h,t] for h,t in cards]
json.dump(secs,open('/home/claude/tools/p3/secs.json','w'),ensure_ascii=False,indent=0)
for k,v in secs.items(): print(k,len(v))
