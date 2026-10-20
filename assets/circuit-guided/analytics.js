// Circuit Guided anonymous milestones. No circuit observations or learner data are emitted.
export const MILESTONES=Object.freeze(['lab_start','trial_recorded','compare_complete','notebook_complete','challenge_complete','lab_complete']);
export function createCircuitAnalytics(send=()=>{}){
  const emitted=new Set();
  function emit(milestone,key=''){
    if(!MILESTONES.includes(milestone))return false;
    const id=milestone+':'+key;
    if(emitted.has(id))return false;
    emitted.add(id);
    try{send(milestone,'circuit-guided');}catch{/* tracking must not interrupt learning */}
    return true;
  }
  return {emit};
}
