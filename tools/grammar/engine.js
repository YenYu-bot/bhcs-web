/* BHCS 文法無限出題引擎 — 瀏覽器版
   由 engine.py 移植，零相依，資料讀自 data/*.json */
(function (global) {
  "use strict";

  // ---- 可重現亂數（mulberry32）----
  function RNG(seed) {
    let a = seed >>> 0;
    this.next = function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.range = function (n) { return Math.floor(this.next() * n); };
  RNG.prototype.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  let VERBS = [], NOUNS = [], PRON = [], TADV = [], NOUN_BY_SG = {};

  const NAMES = ["Tom","John","Ben","Bob","Andy","Jason","Zack","Oliver","Nathan",
    "Sean","Tim","Mary","Amy","Tina","Lucy","Rita","Jenny","Helen","Grace","Sue",
    "Maggie","Betty"];
  const AN_EXC = { uniform: "a", umbrella: "an", hour: "an", university: "a" };
  const MY_OK = new Set(["father","mother","brother","sister","aunt","uncle","cousin",
    "friend","teacher","parent","grandfather","grandmother","son","daughter",
    "husband","wife","neighbor","classmate","boss","doctor"]);
  const DURATIVE = new Set(["live","work","study","teach","stay","wait","sleep","know",
    "own","keep","learn","play","use","sit","lie","love","like","want","need","have",
    "run","read","watch","collect","practice","travel","exercise","carry","hold","wear"]);
  const ADJS = ["happy","tall","busy","tired","hungry","ready","kind","lazy"];

  function art(n) {
    if (AN_EXC[n.sg]) return AN_EXC[n.sg];
    return /^[aeiou]/i.test(n.sg) ? "an" : "a";
  }

  // ---- 主詞 ----
  function makeSubject(rng, num, sems, allowPron) {
    if (allowPron === undefined) allowPron = true;
    sems = sems || ["person"];
    const kind = rng.next();
    if (allowPron && kind < 0.45) {
      const c = PRON.filter(p => !num || p.num === num);
      const p = rng.pick(c);
      return { text: p.sub, num: p.num, person: p.p,
               is3sg: p.num === "sg" && p.p === 3, pron: p };
    }
    if (kind < 0.65 && (!num || num === "sg") && sems.indexOf("person") >= 0) {
      return { text: rng.pick(NAMES), num: "sg", person: 3, is3sg: true, pron: null };
    }
    let pool = NOUNS.filter(n => n.canBeSubject && sems.indexOf(n.sem) >= 0 && n.countable);
    if (!pool.length) pool = NOUNS.filter(n => sems.indexOf(n.sem) >= 0 && n.countable);
    if (!pool.length) pool = NOUNS.filter(n => n.canBeSubject && n.countable);
    const n = rng.pick(pool);
    if (num === "pl" || (!num && rng.next() < 0.4))
      return { text: "The " + n.pl, num: "pl", person: 3, is3sg: false, pron: null };
    const det = MY_OK.has(n.sg) ? rng.pick(["The", "My"]) : "The";
    return { text: det + " " + n.sg, num: "sg", person: 3, is3sg: true, pron: null };
  }

  function subjectFor(rng, v, num) {
    const sems = (v.subjSem && v.subjSem.length) ? v.subjSem : ["person"];
    const allowIt = ["thing","natural","weather","abstract"].some(x => sems.indexOf(x) >= 0);
    for (let i = 0; i < 30; i++) {
      const s = makeSubject(rng, num, sems, true);
      if (s.pron && s.text === "It" && !allowIt) continue;
      if (s.pron && s.text !== "It" && sems.indexOf("person") < 0) continue;
      return s;
    }
    return makeSubject(rng, num, sems, false);
  }

  const beOf   = s => s.pron ? s.pron.be : (s.is3sg ? "is" : "are");
  const auxOf  = s => s.is3sg ? "does" : "do";
  const haveOf = s => s.is3sg ? "has" : "have";

  // 句中主詞：代名詞小寫、名詞片語冠詞小寫、人名保留
  function qSubj(s) {
    const t = s.text;
    if (s.pron) return t === "I" ? "I" : t.toLowerCase();
    const first = t.split(" ")[0];
    if (first === "The" || first === "My") return t[0].toLowerCase() + t.slice(1);
    return t;
  }

  // ---- 受詞 ----
  function objFromWords(rng, words) {
    const pool = words.map(w => NOUN_BY_SG[w]).filter(Boolean);
    if (!pool.length) return null;
    const n = rng.pick(pool);
    if (!n.countable || n.pluralOnly) return n.sg;
    return rng.pick([art(n) + " " + n.sg, "the " + n.sg, n.pl]);
  }
  function makeObject(rng, sems) {
    const pool = NOUNS.filter(n => sems.indexOf(n.sem) >= 0);
    if (!pool.length) return null;
    const n = rng.pick(pool);
    if (!n.countable || n.pluralOnly) return n.sg;
    if (n.sem === "place") return "the " + n.sg;
    return rng.pick([art(n) + " " + n.sg, "the " + n.sg, n.pl]);
  }
  function tailOf(rng, v) {
    if (["SVO","SVOO","SVOC"].indexOf(v.frame) >= 0) {
      let o = v.objWords ? objFromWords(rng, v.objWords) : null;
      if (!o && v.objSem) o = makeObject(rng, v.objSem);
      return o ? " " + o : "";
    }
    if (v.frame === "SV+to+PLACE")
      return " " + (v.prep || "to") + " " + makeObject(rng, ["place"]);
    if (v.frame === "SV+prep") {
      let o = v.objWords ? objFromWords(rng, v.objWords) : null;
      if (!o) o = makeObject(rng, v.objSem || ["thing"]);
      return o ? " " + (v.prep || "to") + " " + o : "";
    }
    return "";
  }

  // ---- 動詞挑選 ----
  function pickVerb(rng, o) {
    o = o || {};
    const pool = VERBS.filter(v => {
      if (o.needProg && !v.progressive) return false;
      if (o.needDurative && (v.punctual || !DURATIVE.has(v.lemma))) return false;
      if (v.emotion) return false;
      return true;
    });
    return rng.pick(pool);
  }

  function advFor(rng, tense, durative) {
    let pool = TADV.filter(t => !t.amb && t.forces.indexOf(tense) >= 0);
    pool = durative
      ? pool.filter(t => t.needsDurative)
      : pool.filter(t => !t.needsDurative && !t.neg_or_q && t.position !== "mid");
    return pool.length ? rng.pick(pool) : null;
  }

  function mc(stem, ans, distractors, grammar, level) {
    return { type: "multiple-choice", grammar, level, stem,
             options: [ans].concat(distractors.map(d => d[0])),
             tags: [null].concat(distractors.map(d => d[1])), answer: 0 };
  }

  // ================= 文法模組 =================
  function qBe(rng, level) {
    const s = makeSubject(rng, null, ["person","animal"], true);
    const ans = beOf(s);
    const persons = NOUNS.filter(n => n.sem === "person" && n.countable);
    let comp = rng.pick([
      "a " + rng.pick(persons).sg,
      rng.pick(ADJS),
      "in the " + rng.pick(NOUNS.filter(n => n.sem === "place")).sg
    ]);
    if (s.num === "pl" && comp.indexOf("a ") === 0) comp = comp.slice(2) + "s";
    const all = { am: "be-am-misuse", is: "be-is-misuse", are: "be-are-misuse", be: "be-base-form" };
    delete all[ans];
    return mc(s.text + " ___ " + comp + ".", ans, Object.entries(all).slice(0, 3),
              "be-agreement", level);
  }

  function qPresentSimple(rng, level) {
    const v = pickVerb(rng), s = subjectFor(rng, v);
    const adv = advFor(rng, "present-simple");
    const form = s.is3sg ? v.s : v.base;
    const tail = tailOf(rng, v);
    const stem = adv.position === "preverb"
      ? s.text + " " + adv.text + " ___" + tail + "."
      : s.text + " ___" + tail + " " + adv.text + ".";
    const d = s.is3sg
      ? [[v.base, "3sg-s-missing"], [beOf(s) + " " + v.ing, "prog-vs-simple"], [v.past, "tense-marker-ignored"]]
      : [[v.s, "3sg-overapplied"], [beOf(s) + " " + v.ing, "prog-vs-simple"], [v.past, "tense-marker-ignored"]];
    return mc(stem, form, d, "present-simple", level);
  }

  function qPresentProg(rng, level) {
    const v = pickVerb(rng, { needProg: true }), s = subjectFor(rng, v);
    let adv = advFor(rng, "present-prog");
    if (adv.position === "front" && s.text === "It") adv = TADV.find(a => a.text === "now");
    const ans = beOf(s) + " " + v.ing;
    const tail = tailOf(rng, v);
    const front = adv.position === "front" ? adv.text + " " : "";
    const end = front ? "" : " " + adv.text;
    const wrongBe = beOf(s) !== "are" ? "are" : "is";
    const d = [[s.is3sg ? v.s : v.base, "prog-missing"], [v.ing, "be-missing"],
               [wrongBe + " " + v.ing, "be-agreement-error"]];
    return mc(front + s.text + " ___" + tail + end + ".", ans, d, "present-prog", level);
  }

  function qPresentPerfect(rng, level) {
    const dur = rng.next() < 0.5;
    const v = pickVerb(rng, { needDurative: dur }), s = subjectFor(rng, v);
    const adv = advFor(rng, "present-perfect", dur) || advFor(rng, "present-perfect");
    const ans = haveOf(s) + " " + v.pp;
    const stem = s.text + " ___" + tailOf(rng, v) + " " + adv.text + ".";
    const wrongHave = haveOf(s) === "has" ? "have" : "has";
    const d = [[wrongHave + " " + v.pp, "have-agreement-error"],
               [haveOf(s) + " " + v.base, "pp-missing"],
               [v.past, "perfect-vs-past"]];
    return mc(stem, ans, d, "present-perfect", level);
  }

  function qYesNoBe(rng, level) {
    let s = makeSubject(rng, null, ["person","animal"], true);
    if (s.text === "I") s = makeSubject(rng, "sg", ["person"], false);
    const ans = beOf(s).charAt(0).toUpperCase() + beOf(s).slice(1);
    const comp = rng.pick(["happy","a student","tired","in the classroom","busy","ready"]);
    const all = { Am: "be-am-misuse", Is: "be-is-misuse", Are: "be-are-misuse", Do: "aux-for-be" };
    delete all[ans];
    return mc("___ " + qSubj(s) + " " + comp + "?", ans,
              Object.entries(all).slice(0, 3), "yesno-be", level);
  }

  function qYesNoAux(rng, level) {
    const v = pickVerb(rng), s = subjectFor(rng, v);
    const a = auxOf(s), ans = a.charAt(0).toUpperCase() + a.slice(1);
    const stem = "___ " + qSubj(s) + " " + v.base + tailOf(rng, v) + "?";
    const d = [[ans === "Does" ? "Do" : "Does", "aux-agreement-error"],
               [beOf(s).charAt(0).toUpperCase() + beOf(s).slice(1), "be-for-aux"],
               ["Did", "tense-error"]];
    return mc(stem, ans, d, "yesno-aux", level);
  }

  const GEN = { "be-agreement": qBe, "present-simple": qPresentSimple,
    "present-prog": qPresentProg, "present-perfect": qPresentPerfect,
    "yesno-be": qYesNoBe, "yesno-aux": qYesNoAux };

  // ---- 其他題型 ----
  function qFillVerb(rng, level, grammar) {
    const q = GEN[grammar](rng, level);
    const ansText = q.options[0];
    let base = ansText.split(" ").pop();
    for (const v of VERBS) {
      if (ansText.endsWith(v.ing) || ansText.endsWith(v.pp) ||
          ansText === v.s || ansText === v.base) { base = v.base; break; }
    }
    return { type: "fill-verb", grammar, level,
             stem: q.stem.replace("___", "__________ (" + base + ")"),
             options: [], tags: [], answer: ansText };
  }

  function qTransform(rng, level, grammar) {
    const v = pickVerb(rng), s = subjectFor(rng, v), tail = tailOf(rng, v);
    if (grammar === "yesno-be") {
      const comp = rng.pick(["a teacher","happy","in the park","busy"]);
      const be = beOf(s);
      return { type: "transform", grammar, level,
        stem: s.text + " " + be + " " + comp + ".　（改為疑問句）", options: [], tags: [],
        answer: be.charAt(0).toUpperCase() + be.slice(1) + " " + qSubj(s) + " " + comp + "?" };
    }
    const form = s.is3sg ? v.s : v.base;
    const src = s.text + " " + form + tail + ".";
    if (rng.next() < 0.5)
      return { type: "transform", grammar, level, stem: src + "　（改為否定句）",
        options: [], tags: [], answer: s.text + " " + auxOf(s) + " not " + v.base + tail + "." };
    const a = auxOf(s);
    return { type: "transform", grammar, level, stem: src + "　（改為疑問句）",
      options: [], tags: [],
      answer: a.charAt(0).toUpperCase() + a.slice(1) + " " + qSubj(s) + " " + v.base + tail + "?" };
  }

  function qError(rng, level, grammar) {
    const q = GEN[grammar](rng, level);
    const i = 1 + rng.range(q.options.length - 1);
    return { type: "error-correction", grammar, level,
             stem: q.stem.replace("___", q.options[i]),
             options: [], tags: [q.tags[i]],
             answer: q.stem.replace("___", q.options[0]) };
  }

  function validate(q) {
    if (q.type !== "multiple-choice") return !!q.answer && q.answer.length > 0;
    if (new Set(q.options).size !== q.options.length) return false;
    if (q.options.some(o => !o || !o.trim())) return false;
    return q.stem.indexOf("___") >= 0;
  }

  // ---- 出卷 ----
  function generate(spec, seed) {
    const rng = new RNG(seed), paper = [], seen = new Set();
    for (const sec of spec.sections) {
      const items = [];
      let guard = 0;
      while (items.length < sec.count && guard < sec.count * 80) {
        guard++;
        const lv = sec.level || 1;
        let q;
        if (sec.type === "multiple-choice") q = GEN[sec.grammar](rng, lv);
        else if (sec.type === "fill-verb") q = qFillVerb(rng, lv, sec.grammar);
        else if (sec.type === "transform") q = qTransform(rng, lv, sec.grammar);
        else if (sec.type === "error-correction") q = qError(rng, lv, sec.grammar);
        else continue;
        if (!validate(q) || seen.has(q.stem)) continue;
        seen.add(q.stem);
        if (q.type === "multiple-choice") {
          const pairs = q.options.map((o, i) => [o, q.tags[i]]);
          rng.shuffle(pairs);
          q.options = pairs.map(p => p[0]);
          q.tags = pairs.map(p => p[1]);
          q.answer = pairs.findIndex(p => p[1] === null);
        }
        items.push(q);
      }
      paper.push({ title: sec.title, items, type: sec.type, grammar: sec.grammar });
    }
    return paper;
  }

  async function load(base) {
    base = base || "data/";
    const [v, n] = await Promise.all([
      fetch(base + "verbs.json").then(r => r.json()),
      fetch(base + "nouns.json").then(r => r.json())
    ]);
    VERBS = v.verbs; NOUNS = n.nouns; PRON = n.pronouns; TADV = n.timeAdverbs;
    NOUN_BY_SG = {};
    for (const x of NOUNS) if (!NOUN_BY_SG[x.sg]) NOUN_BY_SG[x.sg] = x;
    return { verbs: VERBS.length, nouns: NOUNS.length };
  }

  global.GrammarEngine = { load, generate };
})(window);
