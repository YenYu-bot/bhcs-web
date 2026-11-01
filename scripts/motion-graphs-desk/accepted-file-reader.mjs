// Production metadata is the sole accepted runtime exception. Original test bodies
// still inspect the accepted private bytes; this adapter fails closed on tag drift.
import fs from 'node:fs';
import {readFile as nativeReadFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const routes=new Map([
 [new URL('../../tools/motion-graphs-desk/index.html',import.meta.url).href,'https://www.bhcs.com.tw/tools/motion-graphs-desk/'],
 [new URL('../../tools/motion-graphs-desk/v2/index.html',import.meta.url).href,'https://www.bhcs.com.tw/tools/motion-graphs-desk/v2/'],
]);
function acceptedBytes(path,value){
 const canonical=path instanceof URL?routes.get(path.href):undefined;
 if(!canonical)return value;
 const tag=`<link rel="canonical" href="${canonical}">`,text=String(value);
 assert.equal(text.split(tag).length,2,'exact production canonical appears once');
 assert.equal(text.includes('<meta name="robots" content="noindex,nofollow">'),false,'production must not retain private robots tag');
 const normalized=text.replace(tag,'<meta name="robots" content="noindex,nofollow">');
 return Buffer.isBuffer(value)?Buffer.from(normalized):normalized;
}
export async function readFile(path,...options){return acceptedBytes(path,await nativeReadFile(path,...options));}
export default {...fs,readFileSync(path,...options){return acceptedBytes(path,fs.readFileSync(path,...options));}};
