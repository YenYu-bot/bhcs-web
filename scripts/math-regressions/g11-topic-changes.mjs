import assert from 'node:assert/strict';
import fs from 'node:fs';
import {changedG11Topics, changedTopicSources, topicSources} from '../math-g11-topic-changes.mjs';

const html = fs.readFileSync(new URL('../../tools/math/g11-drills.html', import.meta.url), 'utf8');
assert.equal(topicSources(html).size, 32);
assert.deepEqual([...changedTopicSources(html, html)], []);
assert.deepEqual([...changedG11Topics(new URL('../..', import.meta.url).pathname)], []);

const altered = html.replace('function vectorCauchyConfig(){', 'function vectorCauchyConfig(){\n// modified topic program');
assert.deepEqual([...changedTopicSources(html, altered)], ['vectorcauchy']);
console.log(JSON.stringify({test:'g11-topic-changes',passed:true}));
