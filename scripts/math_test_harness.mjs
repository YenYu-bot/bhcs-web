import assert from 'node:assert/strict';

export const normalizeSig = s => String(s).replace(/<[^>]*>/g, '').replace(/\s+/g, '').normalize('NFKC');
export function seedFor(text) {
  let h = 2166136261;
  for (const c of text) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
export function auditCombination({unit, ctx, uiMax, safeQuestion, contentGuard = () => true, resetRandom, seed}) {
  const result = {seed, uiMax, bankSize: null, bankDeclared: Object.hasOwn(unit, 'bankSize'),
    raw: {calls: 0, returned: 0, nulls: 0, verifyFalse: 0, exceptions: 0, invalid: 0, distinct: 0, guardRejected: 0, examples: []},
    paper: {requested: 0, produced: 0, attempts: 0, candidateNulls: 0, candidateVerifyFalse: 0,
      candidateExceptions: 0, candidateGuardRejected: 0, exhaustedAt: null, duplicates: 0, examples: []}, issues: [], samples: [], pass: false};
  const issue = (code, detail) => {if (!result.issues.some(x => x.code === code)) result.issues.push({code, detail});};
  const example = (target, code, q, detail) => {
    if (target.examples.filter(x => x.code === code).length < 2)
      target.examples.push({code, ...(q ? {expr: q.expr, answer: q.answer, sig: q.sig} : {}), detail});
  };
  if (!Number.isInteger(uiMax) || uiMax < 1) throw Error('UI maximum is missing or invalid');
  if (result.bankDeclared) {
    try {
      const n = typeof unit.bankSize === 'function' ? unit.bankSize(ctx) : unit.bankSize;
      if (!Number.isSafeInteger(n) || n < 1) issue('invalid_bank_size', 'bankSize must resolve to a positive safe integer');
      else result.bankSize = n;
    } catch (e) {issue('bank_size_exception', e.message);}
  }
  const distinct = new Set();
  resetRandom(seed);
  // Exactly 200 direct gen calls: neither safeQuestion retries nor resets of seen are used here.
  for (let i = 0; i < 200; i++) {
    result.raw.calls++;
    let q;
    try {q = unit.gen(ctx);} catch (e) {
      result.raw.exceptions++; example(result.raw, 'gen_exception', null, e.message); continue;
    }
    if (q == null) {result.raw.nulls++; example(result.raw, 'gen_null', null, `call ${i + 1}`); continue;}
    result.raw.returned++;
    if (typeof q.sig !== 'string' || !q.sig.trim() || typeof q.expr !== 'string' || !q.expr ||
        typeof q.answer !== 'string' || !q.answer || /\b(?:NaN|undefined|Infinity)\b/.test(q.expr + q.answer)) {
      result.raw.invalid++; example(result.raw, 'invalid_question', q); continue;
    }
    distinct.add(normalizeSig(q.sig));
    try {
      if (typeof q.verify !== 'function' || q.verify() !== true) {
        result.raw.verifyFalse++; example(result.raw, 'verify_false', q);
      } else {
        if (!contentGuard(q, ctx.level)) {result.raw.guardRejected++; example(result.raw, 'content_guard_rejected', q);}
        if (result.samples.length < 2) result.samples.push({expr: q.expr, answer: q.answer, sig: q.sig});
      }
    } catch (e) {result.raw.exceptions++; example(result.raw, 'verify_exception', q, e.message);}
  }
  result.raw.distinct = distinct.size;
  if (result.raw.exceptions) issue('raw_exception', `${result.raw.exceptions} exceptions`);
  if (result.raw.verifyFalse) issue('raw_verify_false', `${result.raw.verifyFalse} rejected verifications`);
  if (result.raw.invalid) issue('raw_invalid_question', `${result.raw.invalid} structurally invalid questions`);
  if (result.raw.nulls && result.bankSize === null) issue('raw_null', `${result.raw.nulls} null/undefined results without bankSize`);
  if (result.bankSize !== null && distinct.size !== result.bankSize)
    issue('bank_coverage', `${distinct.size} distinct sig values sampled; declared ${result.bankSize}`);

  result.paper.requested = result.bankSize === null ? uiMax : Math.min(uiMax, result.bankSize);
  resetRandom(seedFor(`${seed}/paper`));
  const seen = new Set(), returned = new Set();
  const observed = {...unit, gen(c) {
    result.paper.attempts++;
    try {
      const q = unit.gen(c);
      if (q == null) result.paper.candidateNulls++;
      else if (typeof q.verify !== 'function' || q.verify() !== true) {
        result.paper.candidateVerifyFalse++; example(result.paper, 'verify_false', q);
      } else if (!contentGuard(q, ctx.level)) {result.paper.candidateGuardRejected++; example(result.paper, 'content_guard_rejected', q);}
      return q;
    } catch (e) {result.paper.candidateExceptions++; example(result.paper, 'exception', null, e.message); throw e;}
  }};
  for (let i = 0; i < result.paper.requested; i++) {
    let q;
    try {q = safeQuestion(observed, ctx, seen);} catch (e) {issue('paper_exception', e.message); break;}
    if (q == null) {
      result.paper.exhaustedAt = i + 1;
      issue(result.bankSize === null ? 'undeclared_bank_or_generation_exhausted' : 'declared_bank_generation_exhausted',
        `existing safeQuestion returned null at ${i + 1}/${result.paper.requested} after its 50-attempt limit`);
      break;
    }
    if (typeof q.sig !== 'string' || !q.sig.trim()) {issue('paper_missing_sig', `question ${i + 1}`); break;}
    const sig = normalizeSig(q.sig);
    if (returned.has(sig)) {result.paper.duplicates++; issue('paper_duplicate', sig);}
    returned.add(sig);
    try {if (q.verify() !== true) issue('paper_accepted_verify_false', sig);}
    catch (e) {issue('paper_accepted_verify_exception', e.message);}
    result.paper.produced++;
  }
  if (result.paper.candidateExceptions) issue('paper_candidate_exception', `${result.paper.candidateExceptions} exceptions filtered by safeQuestion`);
  if (result.paper.candidateVerifyFalse) issue('paper_candidate_verify_false', `${result.paper.candidateVerifyFalse} verify failures filtered by safeQuestion`);
  result.pass = result.issues.length === 0;
  return result;
}

// Gate contract checks: ensure small banks are covered, not silently skipped, and real failures remain red.
export function checkHarnessContract() {
  const safeQuestion = (u, ctx, seen) => {
    for (let i = 0; i < 50; i++) {
      try {const q = u.gen(ctx); if (!q || !q.verify()) continue; const key = normalizeSig(q.sig);
        if (seen.has(key)) continue; seen.add(key); return q;} catch {}
    }
    return null;
  };
  function run({declared, actual = 8, fault}) {
    let index = 0;
    const unit = {gen() {index++; if (fault === 'null') return null; if (fault === 'throw') throw Error('fixture exception');
      return {expr: `q${index % actual}`, answer: '1', sig: `q${index % actual}`, verify: () => fault !== 'verify'};}};
    if (declared !== undefined) unit.bankSize = declared;
    return auditCombination({unit, ctx: {}, uiMax: 40, safeQuestion, seed: 1, resetRandom() {index = 0;}});
  }
  const valid = run({declared: 8}); assert.equal(valid.pass, true); assert.equal(valid.raw.calls, 200);
  assert.equal(valid.raw.distinct, 8); assert.equal(valid.paper.produced, 8);
  assert.equal(run({}).pass, false, 'undeclared finite bank must fail at requested UI maximum');
  assert.equal(run({declared: 8, actual: 4}).pass, false, 'partial bank coverage must fail');
  for (const fault of ['null', 'throw', 'verify']) assert.equal(run({fault}).pass, false, fault);
  return 'PASS revised sampling, bank coverage, UI maximum, and failure-gate contracts';
}
