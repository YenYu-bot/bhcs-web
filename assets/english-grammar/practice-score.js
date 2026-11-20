/** Whole-item scoring: a multi-blank item earns one point when all blanks are correct. */
export function practiceResult(totals) {
  const {correct, incorrect, partial, unanswered, review} = totals;
  const denominator = correct + incorrect + partial + unanswered;
  const attempted = correct + incorrect + partial;
  if (!denominator) return {score:null, denominator, note:'這份練習以自行核對為主。先試著作答，再對照參考答案，找出做法不同的地方。'};
  if (!attempted) return {score:null, denominator, note:'先挑一道你有把握的題目開始，填好後再按「核對作答」。'};
  const score = Math.round(1000 * correct / denominator) / 10;
  let note;
  if (correct === denominator) note = '很棒，可自動判分的題目全答對了！換一份題目試試，看能不能再做對一次。';
  else if (unanswered || partial) note = '你已經開始了！先把還沒填完的題目補上，再核對一次，看看自己多掌握了哪些。';
  else if (score >= 80) note = '大部分都掌握了！挑一道錯題，說說為什麼要用那個文法，再做一次。';
  else if (score >= 50) note = '有些題目已經答對了。先挑一種最常錯的句型，對照例題後重試。';
  else note = '這一輪找出了可以練的地方。先從一道錯題開始，照著參考答案讀一遍，再自己填一次。';
  return {score,denominator,note};
}
