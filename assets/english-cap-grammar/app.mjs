import { grammarItems, grammarPassages } from './bank.mjs';

const by = (id) => document.getElementById(id);
const make = (tag, text, cls) => {
  const n = document.createElement(tag);
  if (text != null) n.textContent = text;
  if (cls) n.className = cls;
  return n;
};
const prefix = 'BCG1';
const singleMap = new Map(grammarItems.map(q => [q.id, q]));
const passageMap = new Map(grammarPassages.map(p => [p.id, p]));
const letters = 'ABCD';
let current;
let checked = false;
let answers = new Map();
const message = text => { by('status').textContent = text; };
const codeFor = s => [prefix,s.single.map(q=>q.id).join('.'),s.passage.map(q=>q.id).join('.')].join('-');

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
const isExtra = q => q.topic.includes('延伸');
function draw() {
  const k = by('kind').value;
  const ext = by('extension').checked;
  const max = +by('count').value;
  let single = [];
  let passage = [];
  if (k !== 'cloze') {
    const core = shuffle(grammarItems.filter(q => !isExtra(q)));
    if (ext) {
      const extra = shuffle(grammarItems.filter(isExtra)).slice(0, Math.max(1, Math.round(max / 5)));
      single = shuffle([...core.slice(0,max-extra.length), ...extra]);
    } else single = core.slice(0,max);
  }
  if (k !== 'single') {
    const core = shuffle(grammarPassages.filter(q => !isExtra(q)));
    const extra = shuffle(grammarPassages.filter(isExtra));
    passage = k === 'cloze' ? [core[0],(ext ? extra[0] : core[1])].filter(Boolean) : [ext ? extra[0] : core[0]].filter(Boolean);
  }
  let next = { single, passage };
  if (current && codeFor(next) === codeFor(current)) {
    if (single.length > 1) next = {single:[...single.slice(1),single[0]],passage};
    else if (passage.length > 1) next = {single,passage:passage.reverse()};
  }
  show(next);
}
function readCode(raw) {
  const parts = raw.trim().split('-');
  if (parts.length !== 3 || parts[0] !== prefix) return null;
  const load = (part, map) => {
    const ids = part ? part.split('.') : [];
    if (ids.length !== new Set(ids).size || ids.some(id => !map.has(id))) return null;
    return ids.map(id => map.get(id));
  };
  const single = load(parts[1],singleMap), passage = load(parts[2],passageMap);
  return single && passage && single.length <= 20 && passage.length <= 2 && (single.length+passage.length) ? {single,passage} : null;
}
function show(next) {
  current = next;
  checked = false;
  answers = new Map();
  by('teacher').checked = false;
  by('code').value = codeFor(next);
  render();
  message('已出卷。切換版本不會換題，也不會清除作答。');
}
function render() {
  const teacher = by('teacher').checked;
  const content = by('questions');
  content.replaceChildren();
  by('edition').textContent = teacher ? '教用版' : '學用版';
  by('check').hidden = teacher;
  by('score').textContent = '';
  let number = 1;
  const addGroup = (heading, questions, paragraphs) => {
    const group = make('section', null, 'group');
    group.append(make('h3',heading));
    if (paragraphs) {
      const passage = make('div',null,'passage');
      passage.lang = 'en';
      for (const paragraph of paragraphs) passage.append(make('p',paragraph));
      group.append(passage);
    }
    const list = make('ol',null,'questions-list');
    list.start = number;
    for (const q of questions) {
      const n = number++;
      const item = make('li',null,'question');
      item.dataset.itemId = q.id;
      const fs = make('fieldset');
      const legend = make('legend',q.prompt || ('短文空格 '+(questions.indexOf(q)+1)),'prompt');
      if(q.prompt) { legend.lang='en'; legend.style.whiteSpace='pre-line'; }
      fs.append(legend);
      const opts = make('div',null,'options');
      opts.lang='en';
      q.options.forEach((opt,i) => {
        const label = make('label',null,'option');
        if (!teacher) {
          const input = make('input');
          input.type='radio'; input.name='answer-'+n; input.value=i;
          input.checked=answers.get(q.id)===i;
          input.addEventListener('change',()=>{answers.set(q.id,i);if(checked){checked=false;by('score').textContent='';content.querySelectorAll('.feedback').forEach(el=>el.remove());}});
          label.append(input);
        }
        label.append(make('span',letters[i]+'. '+opt));
        opts.append(label);
      });
      fs.append(opts);item.append(fs);
      if (teacher) item.append(make('p','答案 '+letters[q.answer]+'｜'+q.explanation,'answer'));
      else if (checked) item.append(make('p',!answers.has(q.id)?'未作答｜答案 '+letters[q.answer]:answers.get(q.id)===q.answer?'答對':'再看一次｜答案 '+letters[q.answer],'feedback'));
      list.append(item);
    }
    group.append(list); content.append(group);
  };
  if(current.single.length) addGroup('單題｜請選最適合的答案',current.single);
  current.passage.forEach((p,i)=>addGroup('短文克漏 '+(i+1)+'｜請依上下文作答',p.items,p.paragraphs));
  if(checked&&!teacher){
    const all=[...current.single,...current.passage.flatMap(p=>p.items)];
    const correct=all.filter(q=>answers.get(q.id)===q.answer).length;
    by('score').textContent='答對 '+correct+'／'+all.length+' 題；未作答 '+(all.length-answers.size)+' 題。';
  }
}
by('kind').addEventListener('change',()=>{by('count').disabled=by('kind').value==='cloze';});
by('generate').addEventListener('click',draw);
by('teacher').addEventListener('change',render);
by('check').addEventListener('click',()=>{checked=true;render();by('score').tabIndex=-1;by('score').focus();});
by('print').addEventListener('click',()=>window.print());
by('restore').addEventListener('click',()=>{
  const restored=readCode(by('code').value);
  if(restored) show(restored); else message('無法還原：請確認是這個工具完整的 BCG1 同卷代碼。目前試卷不變。');
});
by('copy').addEventListener('click',async()=>{
  by('code').value=codeFor(current);
  try { await navigator.clipboard.writeText(by('code').value);message('已複製同卷代碼。'); }
  catch { by('code').focus();by('code').select();message('已選取代碼，請手動複製。'); }
});
draw();
