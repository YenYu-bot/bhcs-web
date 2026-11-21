const $ = (s) => document.querySelector(s);
const el = (tag, text, className) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (className) n.className = className;
  return n;
};
const link = (href, text) => {
  const n = el('a', text);
  n.href = href; n.target = '_blank'; n.rel = 'noopener noreferrer';
  return n;
};
const sourceURL = (value, year, kind) => {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return '';
    const official = ['cap.rcpet.edu.tw', 'cap-rcpet.rcpet.edu.tw'].includes(u.hostname);
    const prefix = '/exam/' + year + '/';
    if (kind === 'year') return official && u.pathname === prefix + year + 'exam.html' ? u.href : '';
    const officialFile = official && u.pathname.startsWith(prefix) && /^[\w-]+\.pdf$/i.test(u.pathname.slice(prefix.length));
    const schoolDriveFile = u.hostname === 'drive.google.com' && /^\/file\/d\/[\w-]+\/view$/.test(u.pathname);
    return officialFile || schoolDriveFile ? u.href : '';
  } catch { return ''; }
};
const appendSourceLinks = (parent, {source, pdf}) => {
  if (source) parent.append(document.createTextNode(' · '), link(source, '官方年度頁'));
  if (pdf) parent.append(document.createTextNode(' · '), link(pdf, '英語閱讀完整原卷'));
};
const questionRange = ({first, last}) => '第 ' + first + (last === first ? '' : '–' + last) + ' 題';
const imgURL = (s) => new URL('./images/' + s, import.meta.url).href;
const letter = ['A','B','C','D'];
const version = 'CAPR1-';
const maxCount = 8;
const groupIdPattern = /^\d{3}-\d{2}$/;
const yearList = $('#years'), count = $('#count'), groups = $('#groups');
const meta = $('#meta'), editionText = $('#edition-text'), instructions = $('#instructions');
const status = $('#status'), score = $('#score'), printButton = $('#print'), codeField = $('#code');
const answerKey = $('#answer-key'), actions = $('#practice-actions');
const state = { years: [], all: [], byId: new Map(), sheet: [], code: '', teacher: false, records: [], bad: 0, pending: 0, revision: 0 };
const setStatus = (message, error = false) => { status.textContent = message; status.toggleAttribute('data-error', error); };
const selectedYears = () => new Set([...yearList.querySelectorAll('input:checked')].map(n => Number(n.value)));
const pool = () => { const years = selectedYears(); return state.all.filter(g => years.has(g.year)); };
const formatCode = (sheet) => version + sheet.map(g => g.id).join('.');
const stableRandom = (seed) => () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
};
function drawUnique(available, n, seed) {
  const next = stableRandom(seed);
  const copy = [...available];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [copy[j], copy[i]] = [copy[i], copy[j]];
  }
  return copy.slice(0, n);
}
function synchronizeSetting() {
  const available = pool().length;
  const previous = Number(count.value || 1);
  count.replaceChildren(...Array.from({length: Math.min(available, maxCount)}, (_, i) => el('option', String(i + 1))));
  if (available) count.value = String(Math.min(previous, maxCount, available));
  count.disabled = $('#draw').disabled = available === 0;
}
function setPrint() {
  printButton.disabled = !state.sheet.length || state.pending !== 0 || state.bad !== 0;
  $('#worksheet').toggleAttribute('data-print-ready', !printButton.disabled);
}
function resetFeedback() {
  score.textContent = '';
  for (const { feedback } of state.records) {
    if (!feedback) continue;
    feedback.textContent = '';
    feedback.className = 'feedback';
    feedback.hidden = true;
  }
}
function createChoices(g, alreadyAnswered) {
  const choices = el('div', undefined, 'choices only-screen');
  for (let i = 0; i < g.answers.length; i += 1) {
    const q = g.first + i;
    const group = el('fieldset', undefined, 'choice');
    group.append(el('legend', '第 ' + q + ' 題'));
    const row = el('div', undefined, 'choice-line');
    const radios = letter.map(l => {
      const radio = el('input');
      radio.type = 'radio'; radio.name = 'q-' + g.id + '-' + q; radio.value = l;
      radio.checked = alreadyAnswered.get(radio.name) === l;
      const label = el('label');
      label.append(radio, document.createTextNode(l));
      row.append(label);
      return radio;
    });
    const feedback = el('p', '', 'feedback');
    feedback.hidden = true;
    group.append(row, feedback);
    choices.append(group);
    state.records.push({ radios, feedback, right: g.answers[i] });
  }
  return choices;
}
function render() {
  const previousAnswers = new Map([...groups.querySelectorAll('input:checked')].map(n => [n.name, n.value]));
  state.revision += 1;
  const revision = state.revision;
  state.records = []; state.bad = 0; state.pending = state.sheet.reduce((sum, g) => sum + g.images.length, 0);
  score.textContent = '';
  answerKey.replaceChildren(); answerKey.hidden = !state.teacher;
  groups.replaceChildren();
  const label = state.teacher ? '教用版' : '學用版';
  editionText.textContent = label;
  const n = state.sheet.reduce((sum, g) => sum + g.answers.length, 0);
  meta.textContent = state.sheet.length ? state.sheet.length + ' 個題組 · ' + n + ' 題｜卷號：' + state.code : '還沒有出題。';
  instructions.hidden = !state.sheet.length || state.teacher;
  actions.hidden = !state.sheet.length || state.teacher;
  for (const g of state.sheet) {
    const unit = el('section', undefined, 'group');
    unit.dataset.groupId = g.id;
    unit.append(el('h3', g.year + ' 年｜第 ' + g.first + '–' + g.last + ' 題'));
    const detail = el('p', '', 'group-source');
    detail.append(document.createTextNode('來源：國中教育會考英語（閱讀）'));
    appendSourceLinks(detail, g);
    unit.append(detail);
    for (const [index, filename] of g.images.entries()) {
      const url = imgURL(filename);
      const box = link(url, ''); box.className = 'scan';
      const img = el('img');
      img.alt = g.year + ' 年第 ' + g.first + '–' + g.last + ' 題原題圖，第 ' + (index + 1) + ' 張；如需文字輔助可參考官方原卷。';
      let settled = false;
      const finish = (ok) => {
        if (settled || revision !== state.revision) return;
        settled = true;
        if (!ok) {
          state.bad += 1;
          box.dataset.error = 'true';
          box.href = g.pdf || g.source || url;
          box.append(document.createTextNode('題圖未能載入' + (g.pdf ? '，開啟完整原卷' : g.source ? '，前往官方年度頁' : '')));
          setStatus('有題圖未能載入，暫停列印。可重整，或從題組來源查看原卷。', true);
        }
        state.pending -= 1; setPrint();
      };
      img.addEventListener('load', () => finish(true), {once: true});
      img.addEventListener('error', () => finish(false), {once: true});
      box.append(img); unit.append(box); img.src = url;
      if (img.complete) finish(img.naturalWidth > 0);
    }
    // Keep the live inputs present, but hidden in teacher mode. The print path always hides them.
    const choices = createChoices(g, previousAnswers);
    choices.hidden = state.teacher;
    unit.append(choices);
    groups.append(unit);
  }
  if (state.teacher && state.sheet.length) {
    answerKey.append(el('h3', '教用答案'));
    for (const g of state.sheet) {
      const answers = g.answers.map((a, i) => (g.first + i) + '. ' + a).join('　');
      answerKey.append(el('p', g.year + ' 年｜' + answers));
    }
  } else answerKey.hidden = true;
  $('#copy').disabled = !state.sheet.length;
  setPrint();
}
function commit(sheet, message, focus) {
  state.sheet = sheet; state.code = formatCode(sheet); codeField.value = state.code;
  // Changing to a new worksheet does not preserve any existing answers.
  groups.replaceChildren();
  setStatus(message); render();
  if (focus) $('#sheet-title').focus();
}
function showNewSheet(focus = true) {
  const available = pool();
  const n = Number(count.value);
  if (!available.length) { setStatus('請至少勾選一個有題圖的年份。', true); return; }
  if (!Number.isInteger(n) || n < 1 || n > Math.min(maxCount, available.length)) {
    setStatus('請選擇有效的題組數（最多 ' + maxCount + ' 組）。', true); return;
  }
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  const result = drawUnique(available, n, seed);
  if (formatCode(result) === state.code && available.length > 1) {
    if (n === 1) result[0] = available.find(g => g.id !== result[0].id);
    else [result[0], result[1]] = [result[1], result[0]];
  }
  commit(result, '', focus);
}
function restoreSheet() {
  const raw = codeField.value.trim().toUpperCase();
  const ids = raw.slice(version.length).split('.');
  if (!raw.startsWith(version) || ids.length > maxCount || !ids.every(id => groupIdPattern.test(id))) {
    setStatus('卷號格式不正確。請貼上從此出題器複製的完整 CAPR1 卷號（最多 ' + maxCount + ' 組）。', true); return;
  }
  const result = ids.map(id => state.byId.get(id));
  if (new Set(ids).size !== ids.length || result.some(g => !g)) { setStatus('這個卷號有重複的題組或有題組目前未收錄。', true); return; }
  const chosen = new Set(result.map(g => g.year));
  for (const input of yearList.querySelectorAll('input')) input.checked = chosen.has(Number(input.value));
  synchronizeSetting();
  count.value = String(result.length);
  commit(result, '已依卷號還原同一份試卷。', true);
}
function attachBank(bank) {
  if (!Array.isArray(bank)) throw new Error('invalid bank');
  for (const y of bank) {
    if (!y || !Number.isInteger(y.year) || y.year < 103 || y.year > 999 || !Array.isArray(y.groups)) continue;
    const source = sourceURL(y.source, y.year, 'year'), pdf = sourceURL(y.pdf, y.year, 'pdf');
    const year = { year: y.year, source, pdf, total: 0, available: 0, officialOnly: [] };
    for (const g of y.groups) {
      if (!g || !Number.isInteger(g.first) || !Number.isInteger(g.last) || g.first < 1 || g.last > 99 || g.last < g.first) continue;
      year.total += 1;
      if (g.officialOnly === true) { year.officialOnly.push({first: g.first, last: g.last}); continue; }
      if (!Array.isArray(g.images) || !g.images.length || g.images.some(s => typeof s !== 'string' || !/^[\w-]+\.(webp|png|jpg)$/.test(s))) continue;
      if (!Array.isArray(g.answers) || g.answers.length !== g.last - g.first + 1 || g.answers.some(a => !letter.includes(a))) continue;
      const id = y.year + '-' + String(g.first).padStart(2, '0');
      if (state.byId.has(id)) continue;
      const group = { id, year: y.year, first: g.first, last: g.last, answers: g.answers, images: g.images, source, pdf };
      year.available += 1; state.byId.set(id, group); state.all.push(group);
    }
    state.years.push(year);
  }
  state.years.sort((a, b) => a.year - b.year);
  state.all.sort((a, b) => a.year - b.year || a.first - b.first);
  yearList.replaceChildren();
  const sources = $('#sources-list');
  let partial = false;
  for (const y of state.years) {
    const li = el('li');
    const name = y.year + ' 年';
    if (y.available < y.total) partial = true;
    li.append(document.createTextNode(name + '：' + (y.available ? ('站內可抽 ' + y.available + ' / ' + y.total + ' 組') : '無站內題組')));
    if (y.officialOnly.length) {
      li.append(el('span', '；' + y.officialOnly.map(questionRange).join('、') + '僅供原卷練習，不納入抽題', 'source-official-only'));
    }
    appendSourceLinks(li, y);
    sources.append(li);
    if (!y.available) continue;
    const input = el('input');
    input.type = 'checkbox'; input.value = String(y.year); input.checked = true;
    const label = el('label');
    label.append(input, document.createTextNode(name)); yearList.append(label);
  }
  $('#sources').hidden = !state.years.length;
  $('#coverage').textContent = state.all.length + ' 組可站內抽題。' + (partial ? '未收錄題組不納入抽題，可查各年度官方原卷。' : '原卷可查原題號與完整題冊。');
  if (!state.all.length) {
    yearList.textContent = '目前沒有可抽取的題組。';
    meta.textContent = '目前僅可從左側來源開啟官方原卷。';
    setStatus('站內題圖尚未收錄。', true);
    if (state.years.length) $('#sources').open = true;
    return;
  }
  $('#restore').disabled = false;
  synchronizeSetting(); showNewSheet(false);
}
yearList.addEventListener('change', synchronizeSetting);
$('#draw').addEventListener('click', () => showNewSheet());
$('#restore').addEventListener('click', restoreSheet);
codeField.addEventListener('keydown', e => { if (e.key === 'Enter' && !$('#restore').disabled) restoreSheet(); });
$('#copy').addEventListener('click', async () => {
  codeField.value = state.code;
  try { await navigator.clipboard.writeText(state.code); setStatus('已複製目前的卷號。'); }
  catch { codeField.focus(); codeField.select(); setStatus('已選取卷號，請手動複製。'); }
});
document.querySelectorAll('input[name=edition]').forEach(n => n.addEventListener('change', () => {
  state.teacher = document.querySelector('input[name=edition]:checked').value === 'teacher';
  if (state.sheet.length) render();
  else editionText.textContent = state.teacher ? '教用版' : '學用版';
}));
groups.addEventListener('change', resetFeedback);
$('#check').addEventListener('click', () => {
  if (state.teacher) return;
  let correct = 0, wrong = 0, blank = 0;
  for (const { radios, feedback, right } of state.records) {
    const given = radios.find(r => r.checked)?.value;
    feedback.hidden = false;
    if (!given) { blank += 1; feedback.textContent = '未作答'; }
    else if (given === right) { correct += 1; feedback.textContent = '答對'; feedback.classList.add('good'); }
    else { wrong += 1; feedback.textContent = '答錯，正解：' + right; feedback.classList.add('bad'); }
  }
  score.textContent = '答對 ' + correct + ' 題、答錯 ' + wrong + ' 題、未作答 ' + blank + ' 題。';
});
printButton.addEventListener('click', () => { if (!printButton.disabled) window.print(); });
fetch(new URL('./bank.json', import.meta.url)).then(r => {
  if (!r.ok) throw new Error('bank not available');
  return r.json();
}).then(attachBank).catch(() => {
  yearList.textContent = '題庫載入失敗。'; meta.textContent = '尚未出題。';
  setStatus('題庫暫時無法讀取，請重整再試。', true);
});
