// Shared freeze for pre-existing tools/ and assets/ files used by station
// integration tests. A file must equal its blob at the test's baseline commit,
// unless scripts/approved-existing-tool-changes.json lists a reviewed change
// that starts from exactly that blob. Changes chain per path, so a test with an
// older baseline follows every later approved fix; anything else still fails.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const blobOf=b=>crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');

export function loadApprovedChanges(root){
 const m=JSON.parse(fs.readFileSync(path.join(root,'scripts/approved-existing-tool-changes.json'),'utf8'));
 assert.equal(m.schema_version,1,'approved change manifest schema');
 const byPath=new Map();
 for(const c of m.changes){
  assert.match(c.path,/^(tools|assets)\//,'approved change targets tools/ or assets/');
  assert.match(c.baseline_blob,/^[0-9a-f]{40}$/);assert.match(c.approved_blob,/^[0-9a-f]{40}$/);
  assert.notEqual(c.baseline_blob,c.approved_blob,'approved change must change the file');
  assert.ok(typeof c.reason==='string'&&c.reason.length>=20,'approved change states its reason');
  const list=byPath.get(c.path)||[];assert.ok(!list.some(x=>x.baseline_blob===c.baseline_blob),'one approved change per starting blob');
  list.push(c);byPath.set(c.path,list);
 }
 return byPath;
}

export function expectedBlob(byPath,file,baselineBlob){
 let blob=baselineBlob;const seen=new Set();
 for(let step;(step=(byPath.get(file)||[]).find(c=>c.baseline_blob===blob));){assert.ok(!seen.has(blob),'approved change cycle '+file);seen.add(blob);blob=step.approved_blob;}
 return blob;
}

export function checkExistingFiles({root,baselineCommit,skip=[],message='unchanged existing source '}){
 const byPath=loadApprovedChanges(root);let protectedCount=0,approved=0;
 for(const line of execFileSync('git',['ls-tree','-r',baselineCommit,'--','tools','assets'],{cwd:root,encoding:'utf8'}).trim().split('\n')){
  const match=/^([0-9]+) blob ([a-f0-9]{40})\t(.+)$/.exec(line);assert(match,'baseline regular blob');const[,,hash,file]=match;if(skip.includes(file))continue;
  const want=expectedBlob(byPath,file,hash);if(want!==hash)approved++;
  assert.equal(blobOf(fs.readFileSync(path.join(root,file))),want,(want===hash?message:'approved change content ')+file);protectedCount++;
 }
 return {protectedCount,approved};
}
