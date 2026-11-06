import test from 'node:test';
import assert from 'node:assert/strict';
import {renderHydrogenChain} from '../../tools/metal-activity-desk/hydrogen-view.mjs';

test('hydrogen chain gives every adjacent pair a connector in one ordered sequence',()=>{
 const html=renderHydrogenChain();
 const cards=[...html.matchAll(/<span class="order-element( hydrogen)?" aria-hidden="true"><b>([^<]+)<\/b><small>([^<]+)<\/small><\/span>/g)];
 assert.deepEqual(cards.map(m=>[m[2],m[3]]),[['鋅','Zn'],['鐵','Fe'],['氫','H'],['銅','Cu']]);
 const connectors=[...html.matchAll(/<i class="order-more" aria-hidden="true">＞<\/i>/g)];
 assert.equal(connectors.length,3);
 for(let i=0;i<3;i++) assert.ok(cards[i].index<connectors[i].index&&connectors[i].index<cards[i+1].index);
 assert.deepEqual(cards.filter(m=>m[1]).map(m=>m[3]),['H']);
});

test('compact chain retains a complete accessible relation and its evidence sources',()=>{
 const html=renderHydrogenChain();
 assert.match(html,/role="img" aria-label="依前述證據與參考知識：鋅大於鐵，鐵大於氫，氫大於銅。"/);
 for(const source of ['Zn ＞ Fe：前章置換證據','Fe ＞ H：本章產氫反應與模型','H ＞ Cu：本課參考知識','氫是比較基準','不是全部金屬的完整排序','鋅與鐵都產氣，本身不足以排它們的先後']) assert.ok(html.includes(source));
 assert.equal(renderHydrogenChain(),html);
});
