// The directory keeps a derived copy of the researcher runtime with the reaction-rate mission text.
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
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
