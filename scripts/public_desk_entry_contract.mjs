import assert from 'node:assert/strict';
// Reverse only the explicitly approved public metadata/navigation changes.
// Original runtime manifests and source hashes remain the authority.
export function beforePublicDeskEntry(bytes,id){
 let html=bytes.toString();
 const nav=`<!-- completed-desk-nav:start --><nav aria-label="同單元實驗版本" style="padding:12px 16px;display:flex;flex-wrap:wrap;gap:12px"><a href="../science/${id}.html">舊版自由探究</a><a href="../science/">自然實驗總覽</a><a href="../../ziyuan.html#res-science">全部學習資源</a></nav><!-- completed-desk-nav:end -->`;
 assert.equal(html.split(nav).length-1,1,'exact approved public navigation');
 html=html.replace(nav,'');
 assert(!html.includes('name="robots"'),'listed desk has no robots exclusion');
 assert.equal(html.split('<title>').length-1,1);
 const anchor=id==='solubility'?'\n<link rel="canonical"':'<title>';
 assert.equal(html.split(anchor).length-1,1);
 return Buffer.from(html.replace(anchor,'<meta name="robots" content="noindex,nofollow">'+anchor));
}

import fs from 'node:fs';
const discovery=JSON.parse(fs.readFileSync(new URL('./public-desk-entry-changes.json',import.meta.url),'utf8'));
assert.equal(discovery.baseline_commit,'10598e94b905bdc81c2087cd791ec28c909cce1c');
assert.deepEqual(discovery.changes.map(c=>c.path),['scripts/build_science.mjs','scripts/science/catalog.mjs','ziyuan.html']);
export function publicDeskDiscoveryReach(file,from){
 const change=discovery.changes.find(c=>c.path===file&&c.before_blob===from);
 return change?change.after_blob:from;
}
