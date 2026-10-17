// Grammar topics, in menu order.
// TOPICS are public. DRAFTS are waiting for review: the page shows them only with ?draft=1, and the
// resources page links only public topics. Move a topic from DRAFTS to TOPICS once its sample sheets are approved.
import be from './topics/be.js';
import simple from './topics/simple.js';
import progressive from './topics/progressive.js';
import there from './topics/there.js';
import can from './topics/can.js';
import past from './topics/past.js';

export const TOPICS = [be, simple, progressive, there, can, past];
export const DRAFTS = [];
export const ALL_TOPICS = [...TOPICS, ...DRAFTS];
