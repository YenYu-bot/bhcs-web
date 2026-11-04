import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSpecimen, renderGraph, renderMaterialIcon } from '../../tools/specific-heat-desk/scene.mjs';

test('specimens share an immutable readable scale at minimum width', () => {
  for (const id of ['water100','iron100','iron200']) {
    const svg=renderSpecimen({id,temperature:34,width:240});
    assert.match(svg,/data-scale-min="20" data-scale-max="50"/);
    assert.match(svg,/font-size="17.5"/); // 17.5 SVG units × 240/300 = 14 CSS px
    assert.match(svg,/data-temperature="34.0"/);
    assert.match(svg,/M209 195V145.8/);
    assert.doesNotMatch(svg,/NaN|Infinity|1260|2520/);
  }
});
test('water and solid iron use distinct physically meaningful vessels', () => {
  assert.match(renderSpecimen({id:'water100'}),/transparent-cup/);
  for (const id of ['iron100','iron200']) {
    const svg=renderSpecimen({id});
    assert.equal((svg.match(/data-vessel="single-metal-block"/g)||[]).length,1);
    assert.match(svg,/data-embedded-probe="true"/);
  }
  const dimension=id=>Number(renderSpecimen({id}).match(/data-block-width="(\d+)"/)[1]);
  assert.ok(dimension('iron200')>dimension('iron100'));
});
test('empty seats never heat, occupied seats share light semantics', () => {
  assert.match(renderSpecimen({heating:true}),/data-heater-light="off"/);
  for (const id of ['water100','iron100','iron200']) assert.match(renderSpecimen({id,heating:true}),/data-heater-light="on"/);
  assert.doesNotMatch(renderSpecimen(),/data-temperature=/);
});
test('instrument rejects illegal temperatures rather than pretending boiling', () => {
  for (const temperature of [NaN,Infinity,19,49,100]) assert.throws(()=>renderSpecimen({id:'water100',temperature}),RangeError);
  assert.throws(()=>renderSpecimen({id:'invalid'}),RangeError);
});
test('graph fixed domains, escaped labels, and observed-only time extent', () => {
  const svg=renderGraph({width:240,series:[{id:'iron100',label:'<unsafe>',points:[{t:0,temperature:20},{t:20,temperature:29.3}]}],samples:[{id:'iron100',t:20,temperature:29.3},{id:'iron100',t:40,temperature:38.7}]});
  assert.match(svg,/data-time-max="60"/);
  assert.match(svg,/data-temperature-min="20" data-temperature-max="50"/);
  assert.match(svg,/d="M46 211 L103.333 155.2"/);
  assert.match(svg,/data-endpoint-time="20"/);
  assert.match(svg,/data-sample-time="20"/);
  assert.doesNotMatch(svg,/data-sample-time="40"/);
  assert.match(svg,/&lt;unsafe&gt;/);
  assert.match(svg,/font:14px/);
});
test('no automatic observations or future extrapolation, history marked', () => {
  const svg=renderGraph({series:[{id:'iron100',historical:true,points:[{t:0,temperature:20},{t:60,temperature:48}]}]});
  assert.doesNotMatch(svg,/data-sample-time=/);
  assert.match(svg,/data-historical="true"/);
  assert.match(svg,/（上輪）/);
  assert.match(svg,/stroke-dasharray="7 4"/);
});
test('invalid graph points are excluded; narrow requests use 240 minimum', () => {
  const svg=renderGraph({width:100,series:[{id:'water100',points:[{t:0,temperature:20},{t:70,temperature:23},{t:10,temperature:NaN}]}]});
  assert.match(svg,/width="240"/);
  assert.match(svg,/data-endpoint-time="0"/);
  assert.doesNotMatch(svg,/NaN|Infinity/);
});

test('temperature reader is supported by the base and wired to a short probe', () => {
  for (const id of ['water100','iron100','iron200']) {
    const svg=renderSpecimen({id,temperature:33.5,width:240});
    assert.match(svg,/data-instrument-support="fixed-to-base"/);
    assert.match(svg,/data-probe-connector="flexible-to-meter"/);
    assert.equal((svg.match(/data-temperature=/g)||[]).length,1);
    assert.equal((svg.match(/>33.5</g)||[]).length,1);
    assert.match(svg,/font-size="17.5"/);
  }
});
test('material icons depict the same specimens without text or false effects', () => {
  for (const id of ['water100','iron100','iron200']) {
    const svg=renderMaterialIcon(id);
    assert.match(svg,/aria-hidden="true"/);
    assert.doesNotMatch(svg,/<text|bubble|flame|data-temperature|data-probe-connector/);
    assert.equal((svg.match(/data-vessel=/g)||[]).length,1);
  }
  const dimension=id=>Number(renderMaterialIcon(id).match(/data-block-width="(\d+)"/)[1]);
  assert.ok(dimension('iron200')>dimension('iron100'));
  assert.throws(()=>renderMaterialIcon('unknown'),RangeError);
});
test('supply illustration advances only when heating and respects reduced motion',()=>{const a=renderSpecimen({id:'iron200',temperature:24,heating:true,heatTime:1}),b=renderSpecimen({id:'iron200',temperature:24,heating:true,heatTime:2});assert.notEqual(a,b);assert.match(a,/供熱輸入示意/);assert.equal((a.match(/data-supply-arrow/g)||[]).length,3);assert.equal(renderSpecimen({id:'iron200',temperature:24,heating:true,heatTime:1,reducedMotion:true}),renderSpecimen({id:'iron200',temperature:24,heating:true,heatTime:2,reducedMotion:true}));assert.doesNotMatch(renderSpecimen({id:'iron200',temperature:34,heating:false,heatTime:60}),/data-supply-arrow/);});
