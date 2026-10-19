// B4-A Notebook view; the B1 engine remains the authority for measurement truth.
import {notebookAStatus,notebookBStatus,notebookCStatus,LIMITATION_IDEAS} from './notebook.js';
const questions=[
 ['baselineCurrent','基準接法的總電流是多少？',[['0.5','0.5 A'],['1.0','1.0 A'],['2.0','2.0 A']]],
 ['onePathChange','兩顆燈泡只有一條路時，總電流如何變化？',[['decrease','減少'],['increase','增加'],['same','不變']]],
 ['twoPathChange','兩顆燈泡各有一條路時，總電流如何變化？',[['decrease','減少'],['increase','增加'],['same','不變']]],
 ['alwaysDecrease','多接一顆燈一定讓總電流變小嗎？',[['true','對'],['false','不對']]],
];
const elem=(tag,txt,cls)=>{const e=document.createElement(tag);if(txt!==undefined)e.textContent=txt;if(cls)e.className=cls;return e;};
export function mountCircuitNotebook(root,getState){
  const learner={level:'A',a:{},b:'',c:{counterexample:'',limitation:''}};
  const title=elem('h2','我的研究筆記：Level A');title.tabIndex=-1;
  const body=elem('div');const feedback=elem('p');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
  const next=elem('button','檢查 Level A','cgg-notebook-next');next.type='button';
  root.append(title,body,feedback,next);
  function render(){
    root.hidden=false;body.replaceChildren();feedback.textContent='';
    title.textContent='我的研究筆記：Level '+learner.level;
    if(learner.level==='A'){
      for(const [key,label,choices] of questions){
        const field=elem('fieldset'),legend=elem('legend',label);field.append(legend);
        for(const [value,text] of choices){
          const wrap=elem('label'),input=document.createElement('input');input.type='radio';input.name='cgg-nb-'+key;input.value=value;input.checked=learner.a[key]===value;
          input.addEventListener('change',()=>{learner.a[key]=value;feedback.textContent='';});
          wrap.append(input,document.createTextNode(' '+text));field.append(wrap);
        }body.append(field);
      }
      next.textContent='檢查 Level A';
    }else if(learner.level==='B'){
      body.append(elem('p','為什麼同樣增加第二顆燈泡，一次總電流從 1.0 A 降到 0.5 A，另一次卻從 1.0 A 增加到 2.0 A？'));
      const textarea=elem('textarea');textarea.setAttribute('aria-label','我的解釋');textarea.rows=5;textarea.value=learner.b;textarea.addEventListener('input',()=>{learner.b=textarea.value;feedback.textContent='';});body.append(textarea);next.textContent='完成 Level B';
    }else if(learner.level==='C'){
      const entries=[['counterexample','請引用至少兩筆自己的量測，反駁「多接燈泡一定讓總電流變小」。'],['limitation','本站模型和真實電路相比，有什麼限制？']];
      for(const [key,label] of entries){
        const wrap=elem('label',label),area=elem('textarea');area.rows=4;area.value=learner.c[key];area.setAttribute('aria-label',label);
        area.addEventListener('input',()=>{learner.c[key]=area.value;feedback.textContent='';if(key==='limitation')updateIdeas();});wrap.append(area);body.append(wrap);
      }
      const ideas=elem('div');ideas.id='cgg-notebook-ideas';body.append(ideas);
      function updateIdeas(){ideas.replaceChildren();if(notebookCStatus(learner.c).showIdeas){ideas.append(elem('h3','你可以再想想'));const ul=elem('ul');for(const idea of LIMITATION_IDEAS)ul.append(elem('li',idea));ideas.append(ul);}}
      updateIdeas();next.textContent='完成研究筆記';
    }else{body.append(elem('p','你已完成三個層次的研究筆記。'));next.hidden=true;}
    next.hidden=learner.level==='done';
  }
  next.addEventListener('click',()=>{
    if(learner.level==='A'){if(!notebookAStatus(getState(),learner.a).allCorrect){feedback.textContent='請重新檢查量測紀錄與四個答案。';return;}learner.level='B';}
    else if(learner.level==='B'){if(!notebookBStatus(learner.b).ready){feedback.textContent='請寫下完整的解釋。';return;}learner.level='C';}
    else if(learner.level==='C'){if(!notebookCStatus(learner.c).ready){feedback.textContent='請完成量測反例與模型限制。';return;}learner.level='done';}
    render();title.focus();
  });
  return {show:render,hide:()=>{root.hidden=true;},snapshot:()=>structuredClone(learner)};
}
