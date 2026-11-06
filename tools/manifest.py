import json, subprocess, sys
base, head, reason_prefix = sys.argv[1], sys.argv[2], sys.argv[3]
root='/home/claude/yenyu-bot/bhcs-web'
run=lambda *a: subprocess.check_output(['git',*a],cwd=root,text=True)
files=[f for f in run('diff','--name-only',base,head,'--','assets','tools').split() if f]
p=root+'/scripts/approved-existing-tool-changes.json'; m=json.load(open(p))
for f in files:
    try: b=run('rev-parse',f'{base}:{f}').strip()
    except subprocess.CalledProcessError: continue  # new file, not protected
    a=run('rev-parse',f'{head}:{f}').strip()
    m['changes'].append({"path":f,"baseline_blob":b,"approved_blob":a,"reason":f"{reason_prefix}: {f.split('/')[-1]}","pull_request":None})
    print(f)
open(p,'w').write(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
