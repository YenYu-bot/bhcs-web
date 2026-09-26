import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {parseExpressionAt} from 'acorn';

const enginePath = 'tools/math/g11-drills.html';
const git = (...args) => execFileSync('git', args, {encoding: 'utf8'}).trimEnd();

export function topicSources(html) {
  const config = html.match(/\bconst CONFIGS=\{([^}]+)\}/s);
  if (!config) throw new Error('G11 CONFIGS registry not found');
  const registry = [...config[1].matchAll(/\b([a-z]\w*):([A-Za-z]\w*)\(\)/g)];
  if (!registry.length) throw new Error('G11 CONFIGS registry is empty');
  const functions = new Map();
  const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]).find(script => /\bconst CONFIGS=/.test(script)) ?? html;
  // The parser pairs the function body's braces while respecting strings,
  // comments, regex literals and nested template expressions. body.end is just
  // after that matching }, never the next function or the CONFIGS registry.
  for (const match of source.matchAll(/^function ([A-Za-z]\w*Config)\(/gm)) {
    const node = parseExpressionAt(source, match.index, {ecmaVersion: 'latest'});
    if (node.type !== 'FunctionExpression' || node.id?.name !== match[1]) {
      throw new Error(`Invalid G11 config function: ${match[1]}`);
    }
    functions.set(node.id.name, source.slice(node.start, node.body.end));
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
