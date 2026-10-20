// Grammar topics, in menu order.
// TOPICS are public. DRAFTS are waiting for review: the page shows them only with ?draft=1, and the
// resources page links only public topics. Move a topic from DRAFTS to TOPICS once its sample sheets are approved.
import be from './topics/be.js';
import simple from './topics/simple.js';
import progressive from './topics/progressive.js';
import there from './topics/there.js';
import can from './topics/can.js';
import past from './topics/past.js';
import pronoun from './topics/pronoun.js';
import plural from './topics/plural.js';
import demonstrative from './topics/this.js';
import freq from './topics/freq.js';
import imperative from './topics/imperative.js';
import article from './topics/article.js';
import quantity from './topics/quantity.js';
import wh from './topics/wh.js';
import prep from './topics/prep.js';
import future from './topics/future.js';
import compare from './topics/compare.js';
import conj from './topics/conj.js';
import must from './topics/must.js';
import perfect from './topics/perfect.js';
import gerund from './topics/gerund.js';
import give from './topics/give.js';
import exclaim from './topics/exclaim.js';
import passive from './topics/passive.js';
import relative from './topics/relative.js';
import tag from './topics/tag.js';
import sense from './topics/sense.js';
import indef from './topics/indef.js';
import reflexive from './topics/reflexive.js';
import indirect from './topics/indirect.js';
import tooenough from './topics/tooenough.js';
import whenif from './topics/whenif.js';

export const TOPICS = [be, simple, progressive, there, can, past, pronoun, plural, demonstrative, freq, imperative, article, quantity, wh, prep, future, compare, conj, must, perfect, gerund, give, exclaim, passive, relative, tag, sense];
export const DRAFTS = [indef, reflexive, indirect, tooenough, whenif];
export const ALL_TOPICS = [...TOPICS, ...DRAFTS];
