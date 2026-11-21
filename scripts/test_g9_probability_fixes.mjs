import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const load = (file, marker) => {
  const html = fs.readFileSync(new URL("../tools/math/" + file, import.meta.url), "utf8");
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1]).find((js) => js.includes(marker));
  assert.ok(script, file + ": missing script");
  return script;
};
const treeMath = Object.create(Math);
let pickValue = 0;
treeMath.random = () => pickValue;
const tree = vm.createContext({Math: treeMath, window: {addEventListener() {}}});
vm.runInContext(load("g9b-2-2-tree-diagram.html", "renderSvgTreeDigits"), tree);
const leaves = (svg, color) => [...svg.matchAll(new RegExp('<text [^>]*fill="' + color + '"[^>]*>([^<]+)</text>', "g"))]
  .map((match) => match[1]);
const pairs = (left, right) => left.flatMap((a) => right.map((b) => "(" + a + ", " + b + ")"));
function checkNine(q, left, right, numerator, answer) {
  assert.deepEqual(leaves(q.svg, "#0369a1"), pairs(left, right), "include all nine ordered pairs");
  assert.equal([...q.svg.matchAll(/<line /g)].length, 12, "three first-stage and nine second-stage edges");
  assert.match(q.steps, new RegExp(numerator + "\\/9"));
  assert.equal(q.ansRaw, "9, " + answer);
}
pickValue = .99;
const bags = tree.genTopic1Question("advanced", "integer");
assert.match(bags.qText, /三顆紅球.*三顆藍球/);
checkNine(bags, ["紅1", "紅2", "紅3"], ["藍1", "藍2", "藍3"],
  [1, 2, 3].filter((a) => [1, 2, 3].includes(a)).length, "1/3");

const cards = tree.genTopic2Question("advanced", "integer");
assert.match(cards.qText, /各自隨機.*機會相等/);
const cardA = [2, 5, 7], cardB = [3, 5, 9];
checkNine(cards, cardA, cardB, cardA.flatMap((a) => cardB.filter((b) => b > a)).length, "5/9");

pickValue = 0;
const digits = tree.genTopic2Question("advanced", "integer");
assert.deepEqual(leaves(digits.svg, "#047857"), ["15", "19", "51", "59", "91", "95"]);
assert.match(digits.ansRaw, /^6, /);

let seed = 20261121;
const math = Object.create(Math);
math.random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
const modern = vm.createContext({Math: math, URLSearchParams, location: {search: "?topic=probability"}});
vm.runInContext(load("g9-drills.html", "__BHCS_TEST__"), modern);
const dice = modern.__BHCS_TEST__.CFG.units.find((unit) => unit.id === "dice");
assert.ok(dice);
const cases = new Set();
for (let attempt = 0; attempt < 800; attempt++) {
  const q = dice.gen({level: "challenge", modes: ["integer"], mixed: false});
  if (!q?.sig.startsWith("bf:")) continue;
  assert.match(q.expr, /每一面朝上的機會都相等/);
  const m = /^(\d+) 面；/.exec(q.answer);
  assert.ok(m, "expected a face count answer");
  const x = Number(m[1]);
  assert.ok(x >= 1 && x <= 5);
  const ratio = modern.__BHCS_TEST__.R(x, 6 - x);
  assert.ok(q.sig.startsWith("bf:" + ratio.n + "/" + ratio.d + ":"), "face counts derive the probability ratio");
  assert.ok(q.verify());
  cases.add(x);
}
assert.deepEqual([...cases].sort(), [1, 2, 5], "cover all existing reverse-die templates");
console.log("PASS g9: two full 3×3 trees, unchanged six-permutation tree, and all three equiprobable-die templates");
