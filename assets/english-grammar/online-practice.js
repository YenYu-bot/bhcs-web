import { gradeItem } from './grading.js';
import { practiceResult } from './practice-score.js';

const node = (name, text, className) => {
  const el = document.createElement(name);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
};

const words = {correct:'答對', incorrect:'再試一次', unanswered:'未作答', partial:'尚有空格未填', review:'自行核對'};
const REQUIRED_CUES = new Set(['conj','must','asas','this','wh','partadj']);
const newDraft = () => ({answers:new Map(), revealed:new Set()});

export const canPracticeSheet = (sheet, topic) => Boolean(sheet?.total && topic?.id);

export function installOnlinePractice({root, toggle, paper}) {
  let active = false, current = null, key = '', draft = newDraft(), records = [];
  const title = node('h2','線上練習');
  title.tabIndex = -1;
  const sub = node('p',null,'practice-subtitle');
  const desc = node('p','直接填入答案，再按「核對作答」。作答只留在此頁，不上傳。','practice-hint');
  const items = node('div');
  const bottom = node('div',null,'practice-actions');
  const check = node('button','核對作答','primary');
  check.type = 'button';
  const resultBox = node('div',null,'practice-result');
  const scoreLine = node('p',null,'practice-score');
  const output = node('p',null,'practice-summary');
  const encouragement = node('p',null,'practice-encouragement');
  resultBox.setAttribute('role','status');
  resultBox.setAttribute('aria-live','polite');
  resultBox.setAttribute('aria-atomic','true');
  resultBox.append(scoreLine,output,encouragement);
  bottom.append(check, resultBox);
  root.append(title,sub,desc,items,bottom);

  const visible = () => {
    root.hidden = !active;
    paper.classList.toggle('practice-open',active);
    toggle.textContent = active ? '返回紙本預覽' : '線上練習';
    toggle.setAttribute('aria-expanded', String(active));
  };
  const invalidate = () => {
    scoreLine.textContent = output.textContent = encouragement.textContent = '';
    for (const {feedback} of records) {
      feedback.hidden = true;
      feedback.textContent = '';
    }
  };
  function inputFor(id, label, multiline = false, wide = false) {
    const input = node(multiline ? 'textarea' : 'input',null,wide?'practice-input wide':'practice-input');
    if (!multiline) input.type = 'text';
    else input.rows = 2;
    input.lang = 'en';
    input.setAttribute('aria-label',label);
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.value = draft.answers.get(id) ?? '';
    input.addEventListener('input', () => {
      draft.answers.set(id,input.value);
      if (!multiline) invalidate();
    });
    return input;
  }
  function draw() {
    if (!current) return;
    const {sheet, topic, teacher} = current;
    sub.textContent = topic.title + '｜卷號 ' + sheet.code;
    items.replaceChildren();
    records = [];
    scoreLine.textContent = output.textContent = encouragement.textContent = '';
    let n = 1;
    for (const sec of sheet.sections) {
      const section = node('section',null,'practice-section');
      const h = node('h3',sec.title);
      if ((sec.topic ?? topic.id)==='article' && ['again','the'].includes(sec.mode)) {
        h.textContent += '（不加冠詞可輸入 ×、x 或「不填」；留空算未作答。）';
      }
      const list = node('ol');
      list.start = n;
      section.append(h,list);
      for (const item of sec.items) {
        const li = node('li',null,'practice-item');
        const inputs = [];
        const question = n++;
        for (const line of item.lines) {
          const row = node('span',null,'practice-line');
          row.lang = 'en';
          for (const p of line) {
            if (typeof p === 'string') row.append(document.createTextNode(p));
            else {
              const index = inputs.length+1;
              const input = inputFor('q'+question+'-'+index,'第 '+question+' 題，第 '+index+' 格',false,p.wide);
              inputs.push(input);
              row.append(input);
            }
          }
          li.append(row);
        }
        const topicId = sec.topic ?? topic.id;
        if (((sec.opts?.zh ?? sheet.opts.zh) || REQUIRED_CUES.has(topicId)) && item.zh) li.append(node('p',item.zh,'practice-hint'));
        const feedback = node('p',null,'practice-feedback');
        feedback.hidden = true;
        const context = {topicId,modeId:sec.mode,abbr:sec.opts?.abbr ?? sheet.opts.abbr};
        if (gradeItem(item,[],context).status === 'review') {
          const hint = node('p','自行核對題，不計分','practice-hint');
          li.append(hint);
        }
        li.append(feedback);
        list.append(li);
        records.push({item,inputs,feedback,context});
      }
      items.append(section);
    }
    if (sheet.translation?.items.length) {
      const section = node('section',null,'practice-section');
      const h = node('h3','整句翻譯｜自行核對，不計分');
      const list = node('ol');
      list.start = n;
      for (const item of sheet.translation.items) {
        const id = 'tr'+n;
        const li = node('li',null,'practice-item');
        const label = node('label',item.zh);
        const input = inputFor(id,'第 '+n+' 題整句翻譯',true);
        input.id = 'practice-'+id;
        label.htmlFor = input.id;
        const reveal = node('button','顯示參考答案','ghost practice-reveal');
        reveal.type = 'button';
        const answer = node('p','參考答案：'+item.en,'practice-feedback');
        const sync = () => {
          answer.hidden = !draft.revealed.has(id);
          reveal.textContent = answer.hidden ? '顯示參考答案' : '隱藏參考答案';
          reveal.setAttribute('aria-expanded',String(!answer.hidden));
        };
        reveal.addEventListener('click',() => {if (draft.revealed.has(id)) draft.revealed.delete(id);else draft.revealed.add(id);sync();});
        sync();
        li.append(label,input,reveal,answer);
        list.append(li);
        n++;
      }
      section.append(h,list);
      items.append(section);
    }
    desc.textContent = teacher ? '這裡是學生作答區；教用答案可在紙本預覽查看。作答只留在此頁，不上傳。' : '直接填入答案，再按「核對作答」。作答只留在此頁，不上傳。';
    bottom.hidden = records.length === 0;
  }
  check.addEventListener('click', () => {
    const totals = {correct:0,incorrect:0,unanswered:0,partial:0,review:0};
    for (const {item,inputs,feedback,context} of records) {
      const result = gradeItem(item,inputs.map(el=>el.value),context);
      totals[result.status]++;
      const info = result.blanks.map((blank,i)=>{
        const label = '第 '+(i+1)+' 格：'+words[blank.status];
        return blank.status === 'incorrect' || blank.status === 'review' ? label+'（參考：'+blank.expected.join('／')+'）' : label;
      });
      feedback.dataset.result = result.status;
      feedback.textContent = words[result.status] + (result.combinationHint ? '。'+result.combinationHint : result.status !== 'correct' && result.status !== 'unanswered' ? '。'+info.join('；') : '。');
      feedback.hidden = false;
    }
    const summary = practiceResult(totals);
    scoreLine.textContent = summary.score == null ? (summary.denominator ? '尚未計分' : '這份練習不計分') : '得分：'+summary.score+'／100（答對 '+totals.correct+'／'+summary.denominator+' 題）';
    encouragement.textContent = summary.note;
    output.textContent = '答對 '+totals.correct+' 題｜答錯 '+totals.incorrect+' 題｜未作答 '+totals.unanswered+' 題｜未填完 '+totals.partial+' 題'+(totals.review?'｜自行核對 '+totals.review+' 題（不計分）':'');
  });
  toggle.addEventListener('click', () => {
    if (!current) return;
    active = !active;
    visible();
    if (active) { if (!items.firstChild) draw(); title.focus(); }
    else toggle.focus();
  });
  return {
    setSheet(sheet,topic,teacher) {
      if (!canPracticeSheet(sheet,topic)) {
        active = false;
        current = null;
        toggle.hidden = true;
        visible();
        return;
      }
      const next = JSON.stringify([topic.id,sheet.opts.seed,sheet.sections.map(s=>[s.topic,s.mode,s.items]),sheet.translation]);
      const changed = next !== key;
      if (changed) { key = next; draft = newDraft(); items.replaceChildren(); }
      const previousTeacher = current?.teacher;
      const displayChanged = current?.sheet.code !== sheet.code;
      current = {sheet,topic,teacher};
      toggle.hidden = false;
      visible();
      if (active && (changed || displayChanged || !items.firstChild)) draw();
      else if (active && previousTeacher !== teacher) {
        desc.textContent = teacher ? '這裡是學生作答區；教用答案可在紙本預覽查看。作答只留在此頁，不上傳。' : '直接填入答案，再按「核對作答」。作答只留在此頁，不上傳。';
      }
    }
  };
}
