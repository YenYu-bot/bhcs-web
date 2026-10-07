// Transfer challenges and notebook content for the guided optics lab (Spec v1.2 §9, §65–§67).
// Pure data + judging. Wrong answers are never called "wrong": the first retry asks what changed, the second shows a hint
// that points back to the learner's own experiments, and no feedback ever states the answer before the learner finds it.

export const LEVELS = Object.freeze(['A', 'B', 'C']);
export const RELATION_POSITION = Object.freeze(['closer', 'farther', 'same']);
export const RELATION_SIZE = Object.freeze(['smaller', 'larger', 'same']);
export const TEXT_MAX = 1000;
export const HINT_AFTER_ATTEMPTS = 2;

/** Level C: ideas a researcher would accept for "what can't these two data points decide?". Shown for self-checking, never auto-graded. */
export const LIMITATION_IDEAS = Object.freeze([
  '還不知道所有物距是不是都一樣。',
  '還不知道換不同焦距的透鏡，結果會不會一樣。',
  '兩筆資料還不能直接證明完整的公式。',
]);

export const CHALLENGES = Object.freeze([
  { id: 1, title: '模糊投影',
    scenario: '在這個實驗裝置裡，蠟燭和透鏡都沒有移動，但屏幕上的影像突然變得模糊。',
    steps: [{ id: 'adjust', question: '你會先調整哪個東西？',
      options: [['screen', '屏幕的位置'], ['candle', '蠟燭的位置'], ['lens', '換一片焦距不同的透鏡']], correct: 'screen',
      right: '因為在其他條件不變時，清楚實像只會出現在特定位置附近。',
      hint: '蠟燭和透鏡都沒有動。回想第一次實驗：你是移動哪個東西，才找到最清楚的位置？' }] },
  { id: 2, title: '焦距內',
    scenario: '焦距 10 cm 的凸透鏡，蠟燭放在離透鏡 8 cm 的地方。',
    steps: [
      { id: 'project', question: '可以把清楚的蠟燭影像接在屏幕上嗎？',
        options: [['yes', '可以'], ['no', '不可以']], correct: 'no',
        right: '這次屏幕接不到清楚的影像。',
        hint: '回想第三次實驗：蠟燭在 5 cm 時，屏幕怎麼移都找不到清楚的影像。8 cm 和 5 cm 一樣，都在焦距以內。' },
      { id: 'kind', question: '比較可能看到哪一種像？',
        options: [['real-small', '倒立縮小的實像'], ['real-large', '倒立放大的實像'], ['virtual', '正立放大的虛像']], correct: 'virtual',
        right: '透過透鏡看，會看到正立、放大的虛像。',
        hint: '回想第三次實驗：屏幕接不到，但從透鏡後面看，你看到的蠟燭是正立還是倒立？大還是小？' },
    ] },
  { id: 3, title: '放大鏡',
    scenario: '用放大鏡看文字時，可以看到正立放大的字，但把白紙放到後面卻接不到那個字的影像。',
    steps: [{ id: 'why', question: '為什麼？',
      options: [
        ['virtual', '因為字在放大鏡的焦距以內，形成的是虛像。眼睛看得到，但不能直接投到紙上。'],
        ['far', '因為形成的是實像，只是白紙放得不夠遠。'],
        ['absorb', '因為白紙會把光吸收掉，所以看不到影像。'],
        ['small', '因為放大鏡形成的是倒立縮小的像，所以紙接不到。']],
      correct: 'virtual',
      right: '眼睛看得到、紙卻接不到，這就是虛像的特徵。',
      hint: '回想你的三次實驗：哪一次「屏幕接不到，眼睛卻看得到」？那時蠟燭離透鏡比焦距近還是遠？' }],
    note: { label: '用自己的話再說一次（可以不寫）', placeholder: '例如：因為…' } },
]);

const byId = (id) => CHALLENGES.find((c) => c.id === id);
export const challengeById = byId;
export const stepOf = (id, stepId) => byId(id)?.steps.find((s) => s.id === stepId) ?? null;

/** true / false for a known option, null for anything that is not an option of that step. */
export function judgeChallenge(id, stepId, choice) {
  const step = stepOf(id, stepId);
  if (!step || !step.options.some(([value]) => value === choice)) return null;
  return choice === step.correct;
}

export const emptyChallenges = () => ({ 1: { steps: {} }, 2: { steps: {} }, 3: { steps: {}, note: '' } });

/** Which steps of a challenge are open, answered, done. Steps unlock in order. */
export function challengeProgress(id, saved) {
  const def = byId(id);
  let open = true;
  const steps = def.steps.map((s) => {
    const a = saved?.steps?.[s.id] ?? null;
    const status = { id: s.id, unlocked: open, choice: a?.choice ?? null, attempts: a?.attempts ?? 0, correct: a?.correct === true };
    open = open && status.correct;
    return status;
  });
  return { id, steps, allCorrect: steps.every((s) => s.correct) };
}

/**
 * Is the notebook finished for the level the learner chose?
 * Level A is a structured choice, so it must match what the two records show (`expected` = { position, size } from the
 * records, or null when they are missing); B and C are free expression and only need to be written.
 */
export function notebookReady(c, expected = null) {
  const filled = (t) => typeof t === 'string' && t.trim().length >= 2;
  if (c.level === 'A') return expected !== null && c.relationPosition === expected.position && c.relationSize === expected.size;
  if (c.level === 'B') return filled(c.freeText);
  if (c.level === 'C') return filled(c.evidenceText) && filled(c.limitationText);
  return false;
}

/** Validates and cleans a partial conclusion update; null when any field is not allowed. */
export function sanitizeConclusionFields(fields) {
  if (!fields || typeof fields !== 'object') return null;
  const out = {};
  for (const [k, v] of Object.entries(fields)) {
    if (k === 'level') { if (v !== null && !LEVELS.includes(v)) return null; out.level = v; }
    else if (k === 'relationPosition') { if (v !== null && !RELATION_POSITION.includes(v)) return null; out.relationPosition = v; }
    else if (k === 'relationSize') { if (v !== null && !RELATION_SIZE.includes(v)) return null; out.relationSize = v; }
    else if (k === 'freeText' || k === 'evidenceText' || k === 'limitationText') { if (typeof v !== 'string') return null; out[k] = v.slice(0, TEXT_MAX); }
  }
  return out;
}
