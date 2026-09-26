import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';

const enginePath = 'tools/math/g11-drills.html';
const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trimEnd();

export function topicSources(html) {
  const config = html.match(/\bconst CONFIGS=\{([^}]+)\}/s);
  if (!config) throw new Error('G11 CONFIGS registry not found');
  const registry = [...config[1].matchAll(/\b([a-z]\w*):([A-Za-z]\w*)\(\)/g)];
  if (!registry.length) throw new Error('G11 CONFIGS registry is empty');
  const functions = new Map();
  const starts = [...html.matchAll(/^function ([A-Za-z]\w*Config)\(/gm)];
  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : config.index;
    functions.set(starts[i][1], html.slice(start, end).trim());
  }
  return new Map(registry.map(([, topic, name]) => {
    const source = functions.get(name);
    if (!source) throw new Error(`G11 topic ${topic} uses missing function ${name}`);
    return [topic, source];
  }));
}

export function changedTopicSources(before, after) {
  const previous = topicSources(before), current = topicSources(after);
  return new Set([...current].filter(([topic, source]) => previous.get(topic) !== source).map(([topic]) => topic));
}

export function changedG11Topics(root) {
  const base = git('-C', root, 'merge-base', 'HEAD', 'origin/main');
  const before = git('-C', root, 'show', `${base}:${enginePath}`);
  const after = fs.readFileSync(path.join(root, enginePath), 'utf8').trimEnd();
  return changedTopicSources(before, after);
}
