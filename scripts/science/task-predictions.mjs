import {calculate} from './models.mjs';
// Task questions are data, serialized with the page. Answers use the shared model.
export function applyTaskPredictions(items){
 const compare=[['less','比較小'],['equal','相同'],['greater','比較大']];
 const override={
  optics:{0:{prediction:'目前的像與物體相比，大小如何？',choices:[['less','像較小'],['equal','一樣大'],['greater','像較大'],['undefined','無有限像距']],rule:{metric:'m',absolute:true,reference:1}}},
  'wave-sound':{0:{prediction:'固定目前聲速，這次波長與頻率 340 Hz 時相比？',choices:compare,rule:{metric:'wavelength',baseline:{f:340}}}},
  energy:{0:{prediction:'目前「位能＋動能」與起始總能量相比？',choices:compare,rule:{sum:['potential','kinetic'],referenceMetric:'total'}},1:{prediction:'這個位置已轉成的內能與零相比？',choices:[['greater','有一部分轉成內能'],['equal','尚未轉成內能'],['less','內能變成負值']],rule:{metric:'thermal',reference:0}},2:{prediction:'保持高度、位置與損耗比例，目前速度和質量 1 kg 時相比？',choices:compare,rule:{metric:'speed',baseline:{mass:1}}}},
  'plant-exchange':{1:{prediction:'只改濕度，目前蒸散指標與濕度 20% 時相比？',choices:compare,rule:{metric:'transpiration',baseline:{humidity:20}}}},
  ecosystem:{0:{prediction:'目前次級消費者的能量，和傳遞比例 10% 時相比？',choices:compare,rule:{metric:'energy.2',baseline:{efficiency:10}}}}
 };
 for(const t of items)t.tasks.forEach((task,i)=>{task.prediction={question:t.prediction,choices:t.choices,...override[t.id]?.[i]};if(task.prediction.prediction){task.prediction.question=task.prediction.prediction;delete task.prediction.prediction}});
}
export function taskAnswer(id,s,r,prediction){
 const rule=prediction?.rule;if(!rule)return r.kind;
 const get=(o,p)=>p.split('.').reduce((v,k)=>v?.[k],o);
 let value=rule.sum?rule.sum.reduce((n,p)=>n+get(r,p),0):get(r,rule.metric);
 if(value==null||!Number.isFinite(value))return 'undefined';if(rule.absolute)value=Math.abs(value);
 const reference=rule.baseline?get(calculate(id,{...s,...rule.baseline}),rule.metric):rule.referenceMetric?get(r,rule.referenceMetric):rule.reference;
 const eps=1e-8*Math.max(1,Math.abs(reference));return Math.abs(value-reference)<=eps?'equal':value<reference?'less':'greater';
}
