// Local-only minimal shim (no network): supports JSDOM.fragment for math regression helpers.
const ent=s=>s.replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
class Text{constructor(t){this.nodeType=3;this.textContent=t;this.childNodes=[];}}
class El{constructor(tag,attrs){this.nodeType=1;this.tagName=tag.toUpperCase();this.attrs=attrs;this.childNodes=[];const c=(attrs.class||'').split(/\s+/).filter(Boolean);this.classList={contains:x=>c.includes(x)};}
 get textContent(){return this.childNodes.map(n=>n.textContent).join('');}
 querySelector(sel){const m=sel.match(/^:scope > \.([\w-]+)$/);if(!m)throw Error('shim selector '+sel);return this.childNodes.find(n=>n.nodeType===1&&n.classList.contains(m[1]))||null;}}
const VOID=new Set(['br','img','hr','input','meta','link','wbr']);
function parse(html){const root=new El('#frag',{});const st=[root];const re=/<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+|<)/g;let m;
 while((m=re.exec(html))){if(m[1]){for(let i=st.length-1;i>0;i--)if(st[i].tagName===m[1].toUpperCase()){st.length=i;break;}}
  else if(m[2]){const attrs={};for(const a of m[3].matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[a[1].toLowerCase()]=ent(a[2]??a[3]??a[4]??'');const e=new El(m[2],attrs);st.at(-1).childNodes.push(e);if(!m[4]&&!VOID.has(m[2].toLowerCase()))st.push(e);}
  else if(m[5]!==undefined)st.at(-1).childNodes.push(new Text(ent(m[5])));}
 return root;}
export class JSDOM{constructor(){throw Error('local jsdom shim: full JSDOM unavailable offline');}static fragment(h){return parse(String(h));}}
export class VirtualConsole{on(){return this}sendTo(){return this}}
export default {JSDOM,VirtualConsole};
