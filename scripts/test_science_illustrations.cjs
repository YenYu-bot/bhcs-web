const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const root=path.resolve(__dirname,'..');
(async()=>{
 const {microCell,microScale,MICRO_FIELD_PX,MICRO_UM_TO_WORLD}=await import('./science/microscope-geometry.mjs');
 for(const obj of [4,10,40]){
  const s=microScale(obj);assert.ok(Math.abs(s.pixels/MICRO_FIELD_PX-s.value/(18/obj))<1e-12);
  for(const x of [s.x-12,s.x+s.pixels+12])for(const y of [s.y-15,s.y+42])assert.ok(Math.hypot(x-300,y-300)<270,'Scale box must remain inside circular field');
 }
 for(const kind of ['onion','elodea','cheek']){
  const cells=[];for(let r=-5;r<=5;r++)for(let c=-5;c<=5;c++){const a=microCell(kind,r,c);assert.deepEqual(a,microCell(kind,r,c),'Geometry must stay fixed across redraws');if(a)cells.push(a)}
  assert.ok(cells.length>50);assert.ok(new Set(cells.map(c=>JSON.stringify(c.points.map(p=>[p.x-c.points[0].x,p.y-c.points[0].y])))).size>50,'Cells must not be repeated stamps');
  for(const c of cells)for(const p of c.organelles){assert.ok(p.rx*2>=5&&p.rx*2<=7);assert.ok(p.ry*2>=3&&p.ry*2<=4.2)}
  if(kind==='elodea')assert.ok(new Set(cells.map(c=>c.organelles.length)).size>8,'Chloroplast counts should vary');
 }
 assert.equal(MICRO_UM_TO_WORLD,540/4500);
 console.log('PASS microscope: calibrated scale, clipping bounds, stable varied cells and organelle sizes');
 const heat=fs.readFileSync(path.join(root,'tools/heat-phase-lab.html'),'utf8');
 const fn=heat.slice(heat.indexOf('function drawParticles()'),heat.indexOf('function updateReadouts()'));
 const noop=()=>{},gradient={addColorStop:noop},ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>o[k]||noop,set:(o,k,v)=>(o[k]=v,true)});
 for(const key of ['ice','melting','water','boiling','steam'])for(let i=0;i<=100;i++){
  let count=0;const s={key,fraction:i/100,temp:20};vm.runInNewContext(fn+';drawParticles();',{pctx:ctx,current:()=>s,phaseName:()=>key,particleDescription:()=>'',drawIce:(n=36)=>count+=n,drawLiquid:(n=36)=>count+=n,drawGas:(n=36)=>count+=n,$:()=>({textContent:''}),particles:{setAttribute:noop}});assert.equal(count,36,key+' must conserve representative particles');
 }
 console.log('PASS heat phase: 505 phase/fraction cases preserve 36 representative particles');
 // Check connectivity from the actual SVG wire paths, independent of the solver.
 const circuitDOM=new JSDOM(fs.readFileSync(path.join(root,'tools/circuit-lab.html'),'utf8'),{url:'https://www.bhcs.com.tw/tools/circuit-lab.html?noga=1',runScripts:'dangerously'});
 const cd=circuitDOM.window.document;
 function connected(segments,a,b){
  const points=[a,b,...segments.flat()],key=p=>p.join(','),adj=new Map(points.map(p=>[key(p),new Set()]));
  for(const [u,v] of segments){const on=points.filter(p=>(u[0]===v[0]?p[0]===u[0]&&p[1]>=Math.min(u[1],v[1])&&p[1]<=Math.max(u[1],v[1]):p[1]===u[1]&&p[0]>=Math.min(u[0],v[0])&&p[0]<=Math.max(u[0],v[0])));for(const x of on)for(const y of on)adj.get(key(x)).add(key(y));}
  const seen=new Set(),todo=[key(a)];while(todo.length){const n=todo.pop();if(n===key(b))return true;if(seen.has(n))continue;seen.add(n);todo.push(...adj.get(n));}return false;
 }
 for(const type of ['single','series','parallel']){
  cd.getElementById('topology').value=type;cd.getElementById('topology').dispatchEvent(new circuitDOM.window.Event('change'));
  const wires=[];
  for(const p of cd.querySelectorAll('#scene path.wire')){let at;for(const m of p.getAttribute('d').matchAll(/([MHV])\s*(-?[\d.]+)(?:\s+(-?[\d.]+))?/g)){const next=m[1]==='M'?[+m[2],+m[3]]:m[1]==='H'?[+m[2],at[1]]:[at[0],+m[2]];if(m[1]!=='M')wires.push([at,next]);at=next;}}
  const plus=[92,152],minus=[92,241],sw=[[170,78],[240,78]],closed=[...wires,sw];
  const lamps=type==='single'?[[[380,78],[456,78]]]:type==='series'?[[[315,78],[391,78]],[[483,78],[559,78]]]:[[[368,135],[444,135]],[[368,250],[444,250]]];
  assert.equal(connected(closed,plus,minus),false,type+' must not short the source');
  assert.equal(connected([...closed,...lamps],plus,minus),true,type+' must form a loaded circuit');
  assert.equal(connected([...wires,...lamps],plus,minus),false,type+' open switch must interrupt current');
  if(type==='parallel')for(const lamp of lamps){assert.ok(connected(closed,plus,lamp[0]));assert.ok(connected(closed,minus,lamp[1]));assert.ok(connected([...closed,lamp],plus,minus),'Either parallel branch must work alone');}
  if(type==='series')for(const lamp of lamps)assert.equal(connected([...closed,lamp],plus,minus),false,'Both series lamps are required');
 }
 circuitDOM.window.close();console.log('PASS circuit SVG: isolated source rails, series/parallel loads and open switch connectivity');
 const motion=fs.readFileSync(path.join(root,'tools/force-motion-lab.html'),'utf8'),arrow=motion.slice(motion.indexOf('function arrow('),motion.indexOf('function renderScene()'));
 for(const x of [98,400,702])for(const force of [-49,-12,12,49]){const svg=vm.runInNewContext(arrow+';arrow(x,145,force,"blue","F");',{x,force,fmt:v=>String(v)});const d=new JSDOM('<svg>'+svg+'</svg>').window;const line=d.document.querySelector('line');assert.ok(+line.getAttribute('x2')>=22&&+line.getAttribute('x2')<=778);d.close();}
 console.log('PASS force arrows: both directions remain inside the observation viewport');
 // Optional native Canvas rendering, not a browser or a responsive-layout test.
 if(process.env.SCIENCE_RENDER_DIR){
  const {createCanvas}=require('@napi-rs/canvas'),backings=new Map(),errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));vc.on('error',e=>errors.push(String(e)));
  const dom=new JSDOM(fs.readFileSync(path.join(root,'tools/microscope-lab.html'),'utf8'),{url:'https://www.bhcs.com.tw/tools/microscope-lab.html?noga=1',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.HTMLCanvasElement.prototype.getContext=function(){if(!backings.has(this)){const canvas=createCanvas(this.width,this.height);backings.set(this,canvas);const ctx=canvas.getContext('2d'),draw=ctx.drawImage.bind(ctx);ctx.drawImage=(source,...args)=>draw(backings.get(source)||source,...args);}return backings.get(this).getContext('2d')};w.print=()=>{};w.confirm=()=>true}});
  const d=dom.window.document,$=id=>d.getElementById(id),collage=createCanvas(1350,1440),cc=collage.getContext('2d');cc.fillStyle='white';cc.fillRect(0,0,1350,1440);cc.font='22px sans-serif';let index=0;
  for(const kind of ['onion','cheek','elodea']){
   $('specimen').value=kind;$('specimen').dispatchEvent(new dom.window.Event('change'));$('begin').click();$('autofocus').click();
   for(const obj of [4,10,40]){
    const radio=d.querySelector(`input[name=objective][value="${obj}"]`);radio.checked=true;radio.dispatchEvent(new dom.window.Event('change'));
    const canvas=backings.get($('scope')),scale=microScale(obj),pixel=canvas.getContext('2d').getImageData(Math.round(scale.x+scale.pixels/2),scale.y,1,1).data;assert.ok(pixel[0]>240&&pixel[1]>240&&pixel[2]>240,'Unclipped visible scale');
    const x=index%3*450,y=Math.floor(index/3)*480;cc.fillStyle='#152f46';cc.fillText(kind+' / '+obj*10+'x',x+16,y+26);cc.drawImage(canvas,x,y+32,450,450);index++;
   }
  }
  assert.deepEqual(errors,[]);fs.mkdirSync(process.env.SCIENCE_RENDER_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.SCIENCE_RENDER_DIR,'microscope-nine-views.png'),collage.toBuffer('image/png'));dom.window.close();console.log('PASS native Canvas renders: 3 specimens × 3 objectives');
 }
})().catch(e=>{console.error(e);process.exitCode=1});
