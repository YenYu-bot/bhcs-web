export const singleFormExemptions = Object.freeze([
  {topic:'gcd',unit:'factor',singleForm:true,reason:'純算法'},
  {topic:'gcd',unit:'gcd2',singleForm:true,reason:'純算法'},
  {topic:'gcd',unit:'gcd3',singleForm:true,reason:'純算法'},
  {topic:'gcd',unit:'lcm2',singleForm:true,reason:'純算法'},
  {topic:'gcd',unit:'lcm3',singleForm:true,reason:'純算法'},
  {topic:'amgm',unit:'means',singleForm:true,reason:'定義式'},
  {topic:'series',unit:'powersums',singleForm:true,reason:'題名限定兩種，兩種皆已涵蓋'},
  {topic:'series',unit:'oddeven',singleForm:true,reason:'題名限定兩種，兩種皆已涵蓋'},
  {topic:'permutations',unit:'factorial',singleForm:true,reason:'兩種互換皆已涵蓋'},
  {topic:'combinations',unit:'basic',singleForm:true,reason:'直接計算'},
  {topic:'combinations',unit:'identity',singleForm:true,reason:'兩個身分式皆已涵蓋'},
  {topic:'generalpolar',unit:'polar2cart',singleForm:true,reason:'單向映射'},
  {topic:'correlation',unit:'scatter',singleForm:true,reason:'結構正規化會折疊散佈圖差異'},
  {topic:'sincosarea',unit:'classification',singleForm:true,reason:'固定題幹由數值覆蓋銳角、直角與鈍角'},
  {topic:'matrixops',unit:'productsize',singleForm:true,reason:'AB、BA 兩向皆已涵蓋'},
  {topic:'matrixapps',unit:'rotation',singleForm:true,reason:'固定映射'},
  {topic:'matrixapps',unit:'transitionbuild',singleForm:true,reason:'固定映射'},
  {topic:'matrixapps',unit:'nextstate',singleForm:true,reason:'固定映射'},
  {topic:'matrixapps',unit:'multistate',singleForm:true,reason:'固定映射'},
  {topic:'matrixapps',unit:'reversestate',singleForm:true,reason:'固定映射'},
  {topic:'matrixapps',unit:'population',singleForm:true,reason:'固定映射'}
]);

export const singleFormKey = (topic, unit) => `${topic}/${unit}`;
export const singleFormPolicy = new Map(singleFormExemptions.map(row => [singleFormKey(row.topic,row.unit),row]));
