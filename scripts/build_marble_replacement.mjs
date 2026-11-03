// The existing reaction-rate URL is replaced, not redirected or duplicated.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
export const marblePublicDescription='用同質量的大塊與小塊大理石，比較定性氣泡與模擬二氧化碳收集曲線，判讀速率、總量與公平比較。時間參數未經實驗校準；私人原型站紀錄不會自動移入官網。';
export function publicReactionDescriptor(t){return t.id==='reaction-rate'?{...t,title:'大理石與鹽酸反應速率實驗桌',description:marblePublicDescription,minutes:'10–15',unit:'反應速率與表面積'}:t;}
export function buildMarbleReplacement(root){
 const read=p=>fs.readFileSync(path.join(root,p),'utf8');
 let html=read('scripts/marble-acid-desk/accepted-index.html');
 for(const {before,after}of JSON.parse(read('scripts/marble-acid-desk/entry-replacements.json'))){if(html.split(before).length!==2)throw Error('Non-unique accepted entry replacement');html=html.replace(before,after);}
 fs.writeFileSync(path.join(root,'tools/science/reaction-rate.html'),html);
 fs.writeFileSync(path.join(root,'docs/science-reaction-rate-spec.md'),read('scripts/marble-acid-desk/public-course-spec.md'));
 return crypto.createHash('sha256').update(html).digest('hex');
}

export function buildMarbleDirectory(root){
 const source=fs.readFileSync(path.join(root,'assets/researcher-lab.js'),'utf8');
 const before='一次只改濃度、溫度、顆粒大小或催化劑，比較反應快慢和最後的產物量。';
 const after='固定大理石總質量與過量稀鹽酸，只改粒徑，觀察氣泡並用二氧化碳體積曲線比較速率與總量。';
 if(source.split(before).length!==2)throw Error('Reaction directory mission source must match exactly once');
 const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),sourceHash=sha(source);
 const derived='// Generated directory-only copy from researcher-lab.js SHA256 '+sourceHash+'\n'+source.replace(before,after);
 fs.writeFileSync(path.join(root,'assets/researcher-marble-directory.js'),derived);
 const page=path.join(root,'tools/science/index.html'),html=fs.readFileSync(page,'utf8');
 const from='../../assets/researcher-lab.js?v='+sourceHash.slice(0,12);
 if(html.split(from).length!==2)throw Error('Directory original script reference must be unique');
 fs.writeFileSync(page,html.replace(from,'../../assets/researcher-marble-directory.js?v='+sha(derived).slice(0,12)));
}
