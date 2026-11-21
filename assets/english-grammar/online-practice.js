import { gradeItem } from './grading.js';
import { practiceResult } from './practice-score.js';
import { requiredGrammarCue } from './core.js';

const node = (name, text, className) => {
  const el = document.createElement(name);
  if (text != null) el.textContent = text;
  if (className) el.className = className;
  return el;
};

const words = {correct:'答對', incorrect:'再試一次', unanswered:'未作答', partial:'尚有空格未填', review:'自行核對'};
const REQUIRED_CUES = new Set(['conj','must','asas','this','wh','partadj']);
const SPLIT_CAN_HINT = 'cannot 是正確的英文寫法；這題有兩格，請第一格填 can，第二格填 not。';
const isUnsplitCan = (value) => /^can\s*not$/i.test(value.normalize('NFKC').trim());
const REVIEW_GROUPS = {
  incorrect: {label:'答錯', jump:'訂正錯題'},
  partial: {label:'未填完', jump:'補完未填格'},
  unanswered: {label:'未作答', jump:'回到未作答題'},
};
const correctionHint = (item, result, values) => {
  if (result.status !== 'incorrect' && result.status !== 'partial') return '';
  if (item.meta?.splitCan && values.slice(0,2).some(isUnsplitCan)) return SPLIT_CAN_HINT;
  if (item.meta?.replyAuxPrefilled) return '看簡答開頭：Yes 搭配 did，No 搭配 didn’t。問句以 Did 開頭，後面的動詞用原形。';
  return '';
};
const newDraft = () => ({answers:new Map(), revealed:new Set()});

export const canPracticeSheet = (sheet, topic) => Boolean(sheet?.total && topic?.id);

export function installOnlinePractice({root, toggle, paper}) {
  let active = false, current = null, key = '', draft = newDraft(), records = [];
  let groups = null, dirty = false;
  const title = node('h2','線上練習');
  title.tabIndex = -1;
  const sub = node('p',null,'practice-subtitle');
  const desc = node('p','直接填入答案，再按「核對作答」。作答只留在此頁，不上傳。','practice-hint');
  const counts = node('p',null,'practice-hint');
  const items = node('div');
  const bottom = node('div',null,'practice-actions');
  const check = node('button','核對作答','primary');
  check.type = 'button';
  const resultBox = node('div',null,'practice-result');
  const scoreLine = node('p',null,'practice-score');
  const output = node('p',null,'practice-summary');
  const encouragement = node('p',null,'practice-encouragement');
  resultBox.tabIndex = -1;
  resultBox.setAttribute('role','status');
  resultBox.setAttribute('aria-live','polite');
  resultBox.setAttribute('aria-atomic','true');
  resultBox.append(scoreLine,output,encouragement);
  const guide = node('div',null,'practice-correction-guide');
  guide.hidden = true;
  const guideHeading = node('h3','回到要訂正的題目');
  guideHeading.tabIndex = -1;
  const guideNote = node('p',null,'practice-hint');
  const groupButtons = node('div',null,'practice-correction-actions');
  const buttons = {};
  function button(label, handler) {
    const el = node('button',label,'ghost');
    el.type = 'button';
    el.addEventListener('click',handler);
    return el;
  }
  function jump(record) {
    const input = record?.inputs[record.nextBlank];
    if (input) input.focus();
    else record?.li.focus();
  }
  for (const [status, group] of Object.entries(REVIEW_GROUPS)) {
    const go = button(group.jump,()=>jump(groups?.[status]?.[0]));
    buttons[status] = go;
    groupButtons.append(go);
  }
  const recheck = button('重新核對',()=>{check.click();resultBox.focus();});
  groupButtons.append(recheck);
  guide.append(guideHeading,guideNote,groupButtons);
  bottom.append(check, resultBox, guide);
  root.append(title,sub,desc,counts,items,bottom);

  const visible = () => {
    root.hidden = !active;
    paper.classList.toggle('practice-open',active);
    toggle.textContent = active ? '返回紙本預覽' : '線上練習';
    toggle.setAttribute('aria-expanded', String(active));
  };
  const clearResults = () => {
    groups = null;
    dirty = false;
    guide.hidden = true;
    scoreLine.textContent = output.textContent = encouragement.textContent = '';
  };
  const invalidate = (record) => {
    if (!groups || !record || record.review) return;
    record.feedback.hidden = true;
    record.feedback.textContent = '';
    if (dirty) return;
    dirty = true;
    scoreLine.textContent = '答案已修改，請重新核對';
    output.textContent = encouragement.textContent = '';
    guideNote.textContent = '目前分類依上次核對。訂正後按「重新核對」，就會更新結果。';
  };
  function inputFor(id, label, multiline = false, wide = false, onEdit = null) {
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
      onEdit?.();
    });
    return input;
  }
  function referenceAnswer(id, text) {
    const reveal = node('button','顯示參考答案','ghost practice-reveal');
    reveal.type = 'button';
    const answer = node('p',text,'practice-feedback');
    answer.id = 'practice-reference-'+id;
    reveal.setAttribute('aria-controls',answer.id);
    const sync = () => {
      answer.hidden = !draft.revealed.has(id);
      reveal.textContent = answer.hidden ? '顯示參考答案' : '隱藏參考答案';
      reveal.setAttribute('aria-expanded',String(!answer.hidden));
    };
    reveal.addEventListener('click',() => {if (draft.revealed.has(id)) draft.revealed.delete(id);else draft.revealed.add(id);sync();});
    sync();
    return [reveal,answer];
  }
  function describe() {
    if (!current) return;
    const {sheet,teacher} = current;
    const translations = sheet.translation?.items.length ?? 0;
    const scored = records.filter(record => !record.review).length;
    const selfReview = records.length-scored+translations;
    counts.textContent = '可自動判分 '+scored+' 題｜自行核對 '+selfReview+' 題（不計分）';
    const steps = [];
    if (scored) steps.push('填空作答後，按「核對作答」批改計分題。');
    else steps.push('這份練習不計分。');
    if (records.length-scored) steps.push('自行核對題可點各題的「顯示參考答案」對照。');
    if (translations) steps.push('整句翻譯寫完後，按各題的「顯示參考答案」自行對照。');
    if (teacher) steps.push('教用答案也可在紙本預覽查看。');
    desc.textContent = steps.join('') + '作答只留在此頁，不上傳。';
    check.hidden = bottom.hidden = scored === 0;
  }
  function draw() {
    if (!current) return;
    const {sheet, topic} = current;
    sub.textContent = topic.title + '｜卷號 ' + sheet.code;
    items.replaceChildren();
    records = [];
    clearResults();
    let n = 1;
    for (const sec of sheet.sections) {
      const section = node('section',null,'practice-section');
      const h = node('h3',sec.title);
      if ((sec.topic ?? topic.id)==='article' && ['again','the'].includes(sec.mode)) {
        h.textContent += '（不加冠詞可輸入 ×、x 或「不填」；留空算未作答。）';
      }
      const list = node('ol');
      list.start = n;
      const usage = node('p',null,'practice-section-usage');
      section.append(h,usage,list);
      let scoredInSection = 0;
      for (const item of sec.items) {
        const li = node('li',null,'practice-item');
        const inputs = [];
        const question = n++;
        const record = {item,inputs,li};
        li.tabIndex = -1;
        const feedbackId = 'practice-feedback-'+question;
        for (const line of item.lines) {
          const row = node('span',null,'practice-line');
          row.lang = 'en';
          for (const p of line) {
            if (typeof p === 'string') row.append(document.createTextNode(p));
            else {
              const index = inputs.length+1;
              const input = inputFor('q'+question+'-'+index,'第 '+question+' 題，第 '+index+' 格',false,p.wide,()=>invalidate(record));
              input.setAttribute('aria-describedby',feedbackId);
              inputs.push(input);
              row.append(input);
            }
          }
          li.append(row);
        }
        const topicId = sec.topic ?? topic.id;
        if (((sec.opts?.zh ?? sheet.opts.zh) || REQUIRED_CUES.has(topicId) || requiredGrammarCue(item,topicId,sec.mode,sheet.opts)) && item.zh) li.append(node('p',item.zh,'practice-hint'));
        const feedback = node('p',null,'practice-feedback');
        feedback.id = feedbackId;
        feedback.hidden = true;
        const context = {topicId,modeId:sec.mode,abbr:sec.opts?.abbr ?? sheet.opts.abbr};
        const initial = gradeItem(item,[],context);
        const review = initial.status === 'review';
        if (!review) scoredInSection++;
        if (item.meta?.splitCan) li.append(node('p','本題的否定拆成兩格：助動詞與否定詞各填一格。','practice-hint'));
        if (review) {
          const hint = node('p','自行核對題，不計分','practice-hint');
          li.append(hint,...referenceAnswer('q'+question,'參考答案：'+initial.blanks.map((blank,i)=>'第 '+(i+1)+' 格：'+blank.expected.join('／')).join('；')));
        }
        const nav = node('div',null,'practice-correction-actions practice-item-navigation');
        nav.setAttribute('role','group');
        nav.setAttribute('aria-label','第 '+question+' 題訂正導覽');
        nav.hidden = true;
        const position = node('p',null,'practice-hint');
        const neighbor = (offset) => {
          const list = groups?.[record.status];
          if (list) jump(list[list.indexOf(record)+offset]);
        };
        const prev = button('上一題',()=>neighbor(-1));
        const next = button('下一題',()=>neighbor(1));
        prev.setAttribute('aria-label','上一題同類待訂正題目');
        next.setAttribute('aria-label','下一題同類待訂正題目');
        const back = button('回訂正總覽',()=>guideHeading.focus());
        nav.append(position,prev,next,back);
        li.append(feedback,nav);
        list.append(li);
        records.push(Object.assign(record,{feedback,context,review,nav,position,prev,next}));
      }
      const reviewInSection = sec.items.length-scoredInSection;
      usage.textContent = scoredInSection && reviewInSection ?
        '可自動判分 '+scoredInSection+' 題｜自行核對 '+reviewInSection+' 題（不計分）' :
        scoredInSection ? '這一大題可自動判分' : '這一大題自行核對，不計分';
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
        li.append(label,input,...referenceAnswer(id,'參考答案：'+item.en));
        list.append(li);
        n++;
      }
      section.append(h,list);
      items.append(section);
    }
    describe();
  }
  check.addEventListener('click', () => {
    const totals = {correct:0,incorrect:0,unanswered:0,partial:0,review:0};
    groups = {incorrect:[], partial:[], unanswered:[]};
    dirty = false;
    for (const record of records) {
      if (record.review) { totals.review++; continue; }
      const {item,inputs,feedback,context,nav} = record;
      const values = inputs.map(el=>el.value);
      const result = gradeItem(item,values,context);
      const hint = correctionHint(item,result,values);
      totals[result.status]++;
      record.status = result.status;
      // Prefer an independently wrong field, then the start of a mismatched pair.
      const problem = result.blanks.findIndex(b=>b.status === 'incorrect' ||
        (result.status === 'incorrect' && b.status === 'review'));
      record.nextBlank = problem >= 0 ? problem : (result.combinationStart ?? Math.max(0,result.blanks.findIndex(b=>b.status === 'unanswered')));
      groups[result.status]?.push(record);
      nav.hidden = !groups[result.status];
      const info = result.blanks.map((blank,i)=>{
        const label = '第 '+(i+1)+' 格：'+words[blank.status];
        return blank.status === 'incorrect' || blank.status === 'review' ? label+'（參考：'+blank.expected.join('／')+'）' : label;
      });
      feedback.dataset.result = result.status;
      feedback.textContent = words[result.status] + (result.combinationHint ? '。'+result.combinationHint : result.status !== 'correct' && result.status !== 'unanswered' ? '。'+info.join('；') : '。');
      if (hint) feedback.textContent += ' '+hint;
      feedback.hidden = false;
    }
    let count = 0;
    for (const [status, group] of Object.entries(REVIEW_GROUPS)) {
      const list = groups[status];
      buttons[status].hidden = !list.length;
      buttons[status].textContent = group.jump+'（'+list.length+' 題）';
      list.forEach((record,i)=>{
        record.position.textContent = group.label+' '+(i+1)+'／'+list.length;
        record.prev.disabled = i === 0;
        record.next.disabled = i === list.length-1;
      });
      count += list.length;
    }
    guide.hidden = !count;
    guideNote.textContent = '選一類題目跳回作答。訂正後按「重新核對」。';
    const summary = practiceResult(totals);
    scoreLine.textContent = summary.score == null ? (summary.denominator ? '尚未計分' : '這份練習不計分') : '得分：'+summary.score+'／100（答對 '+totals.correct+'／'+summary.denominator+' 題）';
    encouragement.textContent = summary.note;
    const selfReview = totals.review + (current.sheet.translation?.items.length ?? 0);
    output.textContent = '答對 '+totals.correct+' 題｜答錯 '+totals.incorrect+' 題｜未作答 '+totals.unanswered+' 題｜未填完 '+totals.partial+' 題'+(selfReview?'｜自行核對 '+selfReview+' 題（不計分）':'');
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
        items.replaceChildren();
        records = [];
        key = '';
        draft = newDraft();
        clearResults();
        visible();
        return;
      }
      const next = JSON.stringify([topic.id,sheet.opts.seed,sheet.sections.map(s=>[s.topic,s.mode,s.items]),sheet.translation]);
      const changed = next !== key;
      if (changed) { key = next; draft = newDraft(); items.replaceChildren(); clearResults(); }
      const previousTeacher = current?.teacher;
      const displayChanged = current?.sheet.code !== sheet.code;
      current = {sheet,topic,teacher};
      toggle.hidden = false;
      visible();
      if (active && (changed || displayChanged || !items.firstChild)) draw();
      else if (active && previousTeacher !== teacher) describe();
    }
  };
}
