// 學期字表登記處。每學期新增一個字表檔（例如 115-2.js），在這裡 import 並加進 TERMS 最前面；舊學期不要刪，舊卷號才還原得出來。
import t1151 from './115-1.js';
import w2000 from './w2000.js';

export const TERMS = [t1151];
export const W2000 = w2000;
/** The term shown first on the page. */
export const CURRENT = TERMS[0];
