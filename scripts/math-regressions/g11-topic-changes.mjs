import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {changedG11Topics, changedTopicSources, topicSources} from '../math-g11-topic-changes.mjs';

// Use a fixed fixture: production topic counts and PR changes are expected to grow.
const html = `function vectorCauchyConfig(){ return {}; }
function planeVectorConfig(){ return {}; }
const CONFIGS={vectorcauchy:vectorCauchyConfig(),planevector:planeVectorConfig()};`;
assert.deepEqual([...topicSources(html).keys()], ['vectorcauchy', 'planevector']);
assert.deepEqual([...changedTopicSources(html, html)], []);

const altered = html.replace('function vectorCauchyConfig(){', 'function vectorCauchyConfig(){\n// modified topic program\n');
assert.deepEqual([...changedTopicSources(html, altered)], ['vectorcauchy']);
const original = String.raw`function vectorCauchyConfig(){
 const text="}"; /* } */ // }
 const regex=/[{}]/;
 const template=\`brace } \${(() => ({value: "{"}))().value}\`;
 return {text,regex,template};
}`.replaceAll('\\`','`').replaceAll('\\${','${');
const before=original+'\nconst UNIT_POLICIES={vectorcauchy:{}};\nconst CONFIGS={vectorcauchy:vectorCauchyConfig()};';
const after=original+'\nfunction planeVectorConfig(){return {nested:{}};}\nfunction determinantConfig(){return {};}\nconst UNIT_POLICIES={vectorcauchy:{},planevector:{},determinant:{}};\nconst CONFIGS={vectorcauchy:vectorCauchyConfig(),planevector:planeVectorConfig(),determinant:determinantConfig()};';
assert.equal(topicSources(before).get('vectorcauchy'),original);
assert.equal(topicSources(after).get('vectorcauchy'),original);
assert.deepEqual([...changedTopicSources(before,after)],['planevector','determinant']);
assert.deepEqual([...changedTopicSources(before,before.replace('vectorcauchy:{}','vectorcauchy:{modes:[]}'))],[]);
const root=fs.mkdtempSync(path.join(os.tmpdir(),'bhcs-g11-topic-'));
const git=(...args)=>execFileSync('git',['-C',root,...args],{stdio:'pipe'});
try{
  git('init');
  git('config','user.name','BHCS test');
  git('config','user.email','test@example.invalid');
  const file=path.join(root,'tools/math/g11-drills.html');
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,html);
  git('add','.'); git('commit','-m','fixture baseline');
  git('update-ref','refs/remotes/origin/main','HEAD');
  assert.deepEqual([...changedG11Topics(root)],[]);
  fs.writeFileSync(file,altered);
  assert.deepEqual([...changedG11Topics(root)],['vectorcauchy']);
  git('add','.'); git('commit','-m','modify topic');
  assert.deepEqual([...changedG11Topics(root)],['vectorcauchy']);
}finally{ fs.rmSync(root,{recursive:true,force:true}); }
console.log(JSON.stringify({test:'g11-topic-changes',passed:true}));
