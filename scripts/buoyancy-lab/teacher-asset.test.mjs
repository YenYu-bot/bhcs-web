import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {teacherSVG} from '../../tools/buoyancy-lab/bench.mjs';
const asset=fs.readFileSync(new URL('../../tools/buoyancy-lab/img/teacher-body-v3.png',import.meta.url));
const provenance=JSON.parse(fs.readFileSync(new URL('../../tools/buoyancy-lab/img/teacher-body-v3.provenance.json',import.meta.url),'utf8'));
test('teacher PNG is the exact approved microscope asset, not a recreated character',()=>{const gitBlob=createHash('sha1').update(Buffer.from(`blob ${asset.length}\0`)).update(asset).digest('hex');assert.equal(gitBlob,'0aaa1b8ff727b271b363e6ff5d3106dc098e38c1');assert.equal(provenance.sourceGitBlob,gitBlob);assert.equal(provenance.sourcePath,'tools/microscope-3d/img/teacher-body-v3.png');assert.equal(provenance.sourceRepository,'YenYu-bot/bhcs-web');assert.equal(asset.readUInt32BE(16),948);assert.equal(asset.readUInt32BE(20),1659)});
test('teacher avatar references local original with semantic label and undistorted shoulder crop',()=>{assert.match(teacherSVG,/role="img"/);assert.match(teacherSVG,/aria-label="[^\"]*余老師/);assert.match(teacherSVG,/href="img\/teacher-body-v3\.png"/);assert.match(teacherSVG,/viewBox="0 0 680 850"/);assert.match(teacherSVG,/width="948" height="1659"/);assert.match(teacherSVG,/preserveAspectRatio="xMinYMin meet"/);assert.match(teacherSVG,/overflow="hidden"/);assert.doesNotMatch(teacherSVG,/<path|<ellipse|<circle/)});
