import {execFileSync} from 'node:child_process';
const root='/home/claude/yenyu-bot/bhcs-web';const {assertMathDrillCoverage}=await import(root+'/scripts/math_drill_discovery.mjs');
const only=process.argv[2];
for(const link of assertMathDrillCoverage(root).links){if(only&&!link.startsWith(only))continue;const [f,q]=link.split('.html?topic=');let out;
 try{out=execFileSync('node',['audit.mjs',f,q],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}catch(e){out=(e.stdout||'')+'\n!! CRASH '+String(e.stderr).split('\n').find(l=>/Error/.test(l));}
 if(out.trim())console.log('### '+link+'\n'+out.trim().split('\n').map(l=>l.slice(0,400)).join('\n'));}
console.log('audit done');
