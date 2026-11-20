// Pilot grader for closed blanks. Print keys remain canonical; accepted spellings
// and equivalent answers are separate from how the teacher sheet displays them.
const PILOT = new Set(['be', 'simple', 'past']);
const MODES = new Set(['fill', 'neg', 'q', 'short', 'full', 'wh']);
// Only tasks with sufficiently constrained answers affect the score.
// Other tasks are still interactive and show a reference for self-check.
const CLOSED = new Map(Object.entries({
  adverb:'form choose compare', article:'aan the again', asas:'as not swap',
  can:'fill neg q', compare:'er est mix', conj:'abo sb swap', exclaim:'what how',
  freq:'verb be place', future:'fill neg', gerund:'to ing prep', give:'prep swap it',
  imperative:'do dont lets be', indef:'one', indirect:'verb',
  itto:'fill forof', linkadv:'so pair', must:'have must neg had',
  numbers:'ordinal date', partadj:'pick both', partnoun:'ing ed mix',
  passive:'fill', perfect:'fill neg never', plural:'count change', possess:'s of joint',
  prep:'time', progressive:'fill neg q short full wh', pronoun:'subj obj poss mine',
  quantity:'some many few', reflexive:'verb fixed', relative:'who verb',
  sense:'link linkverb sense cause', spend:'choose', tag:'be do modal special', that:'head join neg',
  there:'fill neg q', this:'fill', tooenough:'too enough so', usedto:'fill vs',
  wh:'basic more make', whenif:'clause main mix', whto:'fill',
}).map(([topic,modes])=>[topic,new Set(modes.split(' '))]));

function closedItem(item, topicId, modeId) {
  if (topicId == null) return modeId == null || MODES.has(modeId);
  if (isPilotTopic(topicId)) return modeId == null || MODES.has(modeId);
  if (!CLOSED.get(topicId)?.has(modeId)) return false;
  // 'When do you get up?' can be as natural as the two-word print key.
  if (topicId === 'wh' && modeId === 'more' && item?.meta?.type === 'clock' &&
      item.lines.some(line=>line.some(p=>typeof p==='string' && /do you/.test(p)))) return false;
  // In this some/any activity, questions can admit either with different expectations.
  if (topicId === 'quantity' && modeId === 'some' &&
      item.lines.some(line=>line.some(p=>typeof p==='string' && p.includes('?')))) return false;
  return true;
}
const SPELLINGS = new Map([
  ['learned', ['learnt']],
  ['traveled', ['travelled']],
  ['practice', ['practise']],
  ['practices', ['practises']],
  ['practiced', ['practised']],
  ['color', ['colour']],
]);

export const isPilotTopic = (topicId) => PILOT.has(topicId);

// Formatting tolerance is intentionally narrow. Do not expand contractions,
// delete punctuation or accept "isnt": these drills explicitly test the form.
function normalize(value) {
  if (typeof value !== 'string') return '';
  return value.normalize('NFKC').replace(/[‘’ʼ]/g, "'").trim().replace(/\s+/g, ' ');
}
function key(value) {
  const normalized = normalize(value);
  // Grammatical form is the target; sentence-initial case is not, except the
  // standalone pronoun I, which is uppercase in every position.
  return normalized === 'I' ? 'I' : normalized.toLowerCase();
}

const SUBJECT_CONTRACTIONS = {
  "isn't": { he:"he's", she:"she's", it:"it's" },
  "aren't": { you:"you're", we:"we're", they:"they're" },
};

// The existing Be reply layout provides separate subject and verb blanks.
// Only the negative reply pair changes; the question and any follow-up stay fixed.
function beReplyAlternatives(item, expected, topicId, modeId) {
  if (!['be','progressive'].includes(topicId) || !['short','full'].includes(modeId)) return null;
  const i = modeId === 'short' ? 1 : 0;
  const row = item.lines[modeId === 'short' ? 0 : 1] ?? [];
  const marker = row.findIndex(part => typeof part === 'string' && /(?:— )?No, $/.test(part));
  if (marker < 0 || !row[marker+1]?.blank || row[marker+2] !== ' ' || !row[marker+3]?.blank) return null;
  const contraction = SUBJECT_CONTRACTIONS[key(expected[i+1]?.[0])];
  if (!contraction || !expected[i]?.length) return null;
  const forms = expected[i].flatMap(subject => {
    const contracted = contraction[key(subject)];
    return [[subject,expected[i+1][0]], ...(contracted ? [[contracted,'not']] : [])];
  });
  if (!forms.some(([,verb]) => verb === 'not')) return null;
  const tuples = forms.flatMap(pair => expected.reduce((acc, values, index) => {
    const choices = index === i || index === i+1 ? [pair[index-i]] : values;
    return acc.flatMap(prefix => choices.map(value => [...prefix,value]));
  },[[]]));
  return {tuples,forms,start:i};
}

const PERSON_REPLY = /^(?:he|she)$/i;
const THEY_AUX = {
  is:'are', "isn't":"aren't", was:'were', "wasn't":"weren't",
  does:'do', "doesn't":"don't", did:'did', "didn't":"didn't",
};

// Review a singular-they reply only when its complete pattern is grammatical.
// A pronoun alone must not turn a wrong question auxiliary, polarity or action
// into an unscored item. The fixed question and all unaffected blanks still count.
function singularTheyReply(item, entered, expected, topicId, modeId) {
  if (!['be','simple','past','progressive'].includes(topicId) ||
      !['short','full'].includes(modeId) || entered.some(value=>!value)) return null;
  const fixedPastQuestion = topicId === 'past' && item?.meta?.replyAuxPrefilled === true;
  const first = modeId === 'short' && !fixedPastQuestion ? 1 : 0;
  const includes = (i, value) => expected[i]?.some(option=>key(option) === key(value));
  if (!expected[first]?.some(option=>PERSON_REPLY.test(option))) return null;
  const pr = key(entered[first]), aux = key(entered[first+1]);
  const validReply = expected[first+1]?.some(option => {
    const k = key(option);
    return pr === 'they' && aux === THEY_AUX[k] ||
      pr === "they're" && aux === 'not' && k === "isn't" && ['be','progressive'].includes(topicId);
  });
  if (!validReply) return null;
  const affected = new Set([first,first+1]);
  const require = (i, valid) => {
    if (!valid) return false;
    affected.add(i);
    return true;
  };
  if (modeId === 'full') {
    if (!require(2, expected[2]?.some(option=>PERSON_REPLY.test(option)) && key(entered[2]) === 'they')) return null;
    if (topicId === 'be' || topicId === 'progressive') {
      if (!require(3, expected[3]?.some(option=>key(entered[3]) === THEY_AUX[key(option)]))) return null;
    } else if (topicId === 'simple') {
      const base = item?.meta?.alt;
      const variants = typeof base === 'string' ? [base,...(SPELLINGS.get(key(base)) ?? [])] : [];
      if (!require(3, variants.some(option=>key(entered[3]) === key(option)))) return null;
    }
  }
  return entered.every((value,i)=>affected.has(i) || includes(i,value)) ? affected : null;
}

/**
 * Grade input strings in item.lines / blank reading order.
 * Context allows callers to prevent applying the pilot grader to other topics.
 * An item may optionally describe complete, paired accepted answers in
 * gradingAlternatives (array of arrays in blank order). When at least one
 * valid tuple is provided, it is authoritative instead of mixing alternatives
 * from different tuples. A gradingAlternatives tuple may include spelling
 * variants via the same normalizer, not via the printable "／" separator.
 */
export function gradeItem(item, userAnswers, { topicId, modeId } = {}) {
  const parts = (item?.lines ?? []).flat().filter((part) => part?.blank === true);
  const input = Array.isArray(userAnswers) ? userAnswers : [];
  const noArticle = topicId === 'article' && ['the','again'].includes(modeId);
  const entered = parts.map((_, i) => {
    const value = normalize(input[i]);
    return noArticle && /^(?:[xX]|不填|無冠詞)$/.test(value) ? '×' : value;
  });
  const expected = parts.map((part) => {
    const print = typeof part.a === 'string' ? part.a.split('／').map(normalize).filter(Boolean) : [];
    return [...new Set(print.flatMap((value) => {
      const variants = SPELLINGS.get(value.toLowerCase()) ?? [];
      return [value, ...variants.map((variant) => /^[A-Z]/.test(value) ? variant[0].toUpperCase() + variant.slice(1) : variant)];
    }))];
  });
  const explicitTuples = Array.isArray(item?.gradingAlternatives) ? item.gradingAlternatives.filter(
    (tuple) => Array.isArray(tuple) && tuple.length === parts.length && tuple.every((v) => normalize(v)),
  ) : [];
  const paired = explicitTuples.length ? null : beReplyAlternatives(item, expected, topicId, modeId);
  const tuples = paired?.tuples ?? explicitTuples;
  if (tuples.length) {
    for (const [index, values] of expected.entries()) {
      values.splice(0, values.length, ...new Set(tuples.map(tuple => normalize(tuple[index]))));
    }
  }

  const unsupported = !closedItem(item,topicId,modeId) || item?.grading === 'review' ||
    !parts.length || expected.some((values) => !values.length || (!noArticle && values.includes('×')));
  const compatible = tuples.filter(tuple => entered.every((value, i) => !value || key(value) === key(tuple[i])));
  const blanks = expected.map((values, i) => ({
    expected: values,
    status: unsupported ? 'review' : !entered[i] ? 'unanswered' :
      values.some((value) => key(value) === key(entered[i])) ? 'correct' : 'incorrect',
  }));
  if (unsupported) return { status: 'review', blanks };
  if (entered.every(value => !value)) return { status: 'unanswered', blanks };
  const perspective = !explicitTuples.length &&
    singularTheyReply(item, entered, expected, topicId, modeId);
  if (perspective) {
    return { status: 'review', blanks: blanks.map((blank,i) =>
      perspective.has(i) ? { ...blank, status: 'review' } : blank) };
  }
  const mismatch = blanks.some(blank => blank.status === 'incorrect');
  if (paired && !compatible.length && entered[paired.start] && entered[paired.start+1] &&
      [paired.start,paired.start+1].every(i=>blanks[i].status==='correct') &&
      !paired.forms.some(form=>form.every((value,j)=>key(value)===key(entered[paired.start+j])))) {
    return {status:entered.some(value=>!value)?'partial':'incorrect',blanks,
      combinationHint:'第 '+(paired.start+1)+'、'+(paired.start+2)+' 格請搭配使用：'+paired.forms.map(pair=>pair.join(' + ')).join('，或 ')+'。'};
  }
  if (tuples.length && !compatible.length && !mismatch) {
    return { status: 'incorrect', blanks: blanks.map(blank => blank.status === 'unanswered' ? blank : { ...blank, status: 'review' }) };
  }
  const incomplete = blanks.some(blank => blank.status === 'unanswered');
  return { status: incomplete ? 'partial' : mismatch ? 'incorrect' : 'correct', blanks };
}
