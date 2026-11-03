// Batch 1 delivery gate: directory + microscope + shared researcher shell.
const fs=require('fs'),crypto=require('node:crypto');
const must=(v,m)=>{if(!v)throw new Error(m)};
const micro=fs.readFileSync('tools/microscope-lab.html','utf8');
const dir=fs.readFileSync('tools/science/index.html','utf8');
const css=fs.readFileSync('assets/researcher-lab.css','utf8');
const js=fs.readFileSync('assets/researcher-lab.js','utf8');
must(micro.includes('researcher-lab.css')&&micro.includes('researcher-lab.js'),'microscope researcher assets missing');
// Only the directory uses the authorized one-mission derivative. Lesson runtime tests below
// still inspect the unchanged original researcher-lab.js, rather than substituting the copy.
const variant=JSON.parse(fs.readFileSync('scripts/marble-acid-desk-runtime.json','utf8')).directory_variant;
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
must(variant.source_path==='assets/researcher-lab.js'&&variant.path==='assets/researcher-marble-directory.js','directory derivative paths changed');
must(variant.source_sha256==='f6def1b80e6dde6eb4022747f95b7b6f3c0915d61dfcd39e5efe4f6bd9588f59'&&sha(js)===variant.source_sha256,'directory source must remain the pinned shared runtime');
must(variant.before==='一次只改濃度、溫度、顆粒大小或催化劑，比較反應快慢和最後的產物量。'&&variant.after==='固定大理石總質量與過量稀鹽酸，只改粒徑，觀察氣泡並用二氧化碳體積曲線比較速率與總量。','directory mission adaptation changed');
const directoryJS=fs.readFileSync(variant.path,'utf8'),header='// Generated directory-only copy from researcher-lab.js SHA256 '+variant.source_sha256+'\n';
must(variant.count===1&&js.split(variant.before).length===2&&directoryJS.split(variant.after).length===2,'directory mission replacement must occur exactly once');
must(directoryJS.startsWith(header)&&directoryJS.slice(header.length).replace(variant.after,variant.before)===js,'reversing the directory mission must restore every original runtime byte');
must(Buffer.byteLength(directoryJS)===variant.bytes&&sha(directoryJS)===variant.sha256,'directory derivative bytes/hash differ from manifest');
const directoryRef='../../'+variant.path+'?v='+sha(directoryJS).slice(0,12),directoryScripts=[...dir.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(match=>match[1]);
must(dir.includes('researcher-lab.css')&&directoryScripts.filter(src=>src===directoryRef).length===1&&directoryScripts.filter(src=>src.includes('researcher-marble-directory.js')).length===1,'directory versioned researcher assets missing or duplicated');
must(!dir.includes('researcher-lab.js?v=')&&!micro.includes('researcher-marble-directory.js'),'directory derivative must not replace or duplicate a lesson runtime');
must(micro.includes('字母 e 定位玻片'),'letter slide missing');
must(micro.includes('data-answer="a" data-tip="影像與玻片移動方向相反'),'Q2 answer mismatch');
must(micro.includes("Math.max(-270")&&micro.includes("*540/slideDrag.width"),'slide movement range not expanded');
must(micro.includes('function slideStep()')&&micro.includes('MICRO_FIELD_PX/(objective()/4)/10'),'slide key step must follow one tenth of the current field');
must(micro.includes("ctx.lineWidth=4/(u*z)"),'letter-slide crosshair must keep a fixed screen-pixel width');
must(micro.includes("featureVisible(420*MICRO_UM_TO_WORLD,-160*MICRO_UM_TO_WORLD)"),'letter visibility must be derived from the current field');
must(!micro.includes('預測')&&!micro.includes('id="prediction"')&&!micro.includes('els.prediction'),'prediction flow still present');
must(micro.includes('function begin(){started=true')&&micro.includes('<strong>研究開始</strong>')&&micro.includes('先在低倍把影像調清楚'),'hands-on start flow missing');
// Storage is validated once; failed reads must lock writes instead of masquerading as empty data.
// Full-page malformed/denied/quota/recovery scenarios run in test_legacy_record_storage.cjs.
const initialRecordRead=micro.match(/function readInitialRecords\(\)[\s\S]*?(?=\nfunction loadRecords)/)?.[0]||'';
must(/if\(!Array\.isArray\(rows\)/.test(initialRecordRead),'record initial array guard missing');
must(/catch\(e\)\{recordWritesAllowed=false;recordNotice/.test(initialRecordRead),'unreadable record storage must block writes');
must(/function saveRecords\(rows\)\{[\s\S]*?if\(!recordWritesAllowed\)return false;/.test(micro),'record write lock must be enforced');
must(/function loadRecords\(\)\{return recordRows\.slice\(\);\}/.test(micro),'record reads must retain session memory after failed saves');
must(css.includes('@media(max-width:700px)')&&css.includes('position:sticky'),'mobile sticky observation missing');
must(css.includes('@media print'),'print rules missing');
must(js.includes("data-screen='prepare'")||js.includes("dataset.screen='prepare'"),'four-screen flow missing');
must(js.includes('領取任務卡')&&js.includes('研究手冊'),'mini-lab mission language missing');
must(css.includes('Mini-lab visual language'),'mini-lab visual layer missing');
console.log('PASS researcher batch 1 static assertions');
