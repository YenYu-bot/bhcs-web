import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const file=path.join(root,'tools/microscope-lab.html');
let html=fs.readFileSync(file,'utf8');
const code=fs.readFileSync(path.join(root,'scripts/science/microscope-geometry.mjs'),'utf8').replace(/^export /gm,'')+'\n'+fs.readFileSync(path.join(root,'scripts/science/microscope-drawing.js'),'utf8');
const marker=/\/\/ microscope-drawing:start[\s\S]*?\/\/ microscope-drawing:end/;
const block='// microscope-drawing:start\n'+code+'\n// microscope-drawing:end';
if(marker.test(html))html=html.replace(marker,()=>block);
else{const start=html.indexOf('function drawOnion()'),end=html.indexOf('function movementText()');if(start<0||end<start)throw Error('Missing microscope drawing anchors');html=html.slice(0,start)+block+'\n'+html.slice(end);}
fs.writeFileSync(file,html);console.log('Built calibrated microscope illustrations');
