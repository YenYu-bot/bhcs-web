'use strict';
// Passive native Web Lock/write completion, not an application-state poll.
function completedStorageWrite({since,key,lock,audit=globalThis.__inclineAudit}){
 const requests=audit.locks.filter(r=>r.id>=since&&r.name===lock);
 const request=requests.at(-1);
 if(!request||request.status!=='resolved')return false;
 const writes=audit.access.filter(a=>a.name==='setItem'&&a.key===key&&a.requestId===request.id&&a.completed);
 return writes.length===1?writes[0]:false;
}
async function waitForStorageDelivery(page,{since,key,lock}){
 await page.waitForFunction(completedStorageWrite,{since,key,lock});
 return page.evaluate(completedStorageWrite,{since,key,lock});
}
module.exports={completedStorageWrite,waitForStorageDelivery};
