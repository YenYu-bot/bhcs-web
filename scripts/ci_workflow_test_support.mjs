// Reads .github/workflows/ci.yml for the station tests that check how their browser gates are wired into CI.
// CI runs as parallel jobs, so "runs after X" means: in the same job after X, or in another job that CI Gate also needs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const CI_WORKFLOW = '.github/workflows/ci.yml';
export const CHROMIUM_INSTALL = 'playwright install --with-deps chromium';

export function ciWorkflow() {
  return fs.readFileSync(path.join(root, CI_WORKFLOW), 'utf8');
}

/** { jobId: { text, steps: [raw step text, in order], needs: [jobId] } } */
export function ciJobs(wf = ciWorkflow()) {
  const jobs = {};
  let inJobs = false;
  let cur = null;
  for (const line of wf.split('\n')) {
    if (/^jobs:\s*$/.test(line)) { inJobs = true; continue; }
    if (!inJobs) continue;
    if (/^\S/.test(line)) { inJobs = false; cur = null; continue; }
    const id = /^ {2}([A-Za-z0-9_-]+):\s*$/.exec(line);
    if (id) { cur = jobs[id[1]] = { text: '', steps: [], needs: [] }; continue; }
    if (!cur) continue;
    cur.text += `${line}\n`;
    const needs = /^ {4}needs:\s*\[(.*)\]\s*$/.exec(line);
    if (needs) cur.needs = needs[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (/^ {6}- /.test(line)) cur.steps.push(line);
    else if (cur.steps.length && /^ {8,}\S/.test(line)) cur.steps[cur.steps.length - 1] += `\n${line}`;
  }
  return jobs;
}

/** Ids of the jobs whose text mentions `needle`. */
export function jobsMentioning(needle, jobs = ciJobs()) {
  return Object.keys(jobs).filter((id) => jobs[id].text.includes(needle));
}
