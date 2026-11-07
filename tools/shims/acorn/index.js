// Local-only shim: bracket matcher aware of strings, templates, comments, regex literals.
function skip(s,i,close){ // returns index after matching close bracket; s[i] is the opening char
 const stack=[close];i++;let prevSig='(';
 while(i<s.length){const c=s[i];
  if(c==='/'&&s[i+1]==='/'){i=s.indexOf('\n',i);if(i<0)return s.length;continue;}
  if(c==='/'&&s[i+1]==='*'){i=s.indexOf('*/',i+2)+2;continue;}
  if(c==='"'||c==="'"){i++;while(s[i]!==c){if(s[i]==='\\')i++;i++;}i++;prevSig='a';continue;}
  if(c==='`'){i++;for(;;){if(s[i]==='\\'){i+=2;continue}if(s[i]==='`'){i++;break}if(s[i]==='$'&&s[i+1]==='{'){i=skip(s,i+1,'}');continue}i++;}prevSig='a';continue;}
  if(c==='/'){const before=s.slice(Math.max(0,i-8),i);if(/[(,=:\[!&|?{};+\-*%<>~^]$/.test(prevSig)||/\b(return|typeof|case)\s*$/.test(before)){i++;let cls=false;while(true){const d=s[i];if(d==='\\'){i+=2;continue}if(d==='[')cls=true;else if(d===']')cls=false;else if(d==='/'&&!cls)break;i++;}i++;while(/[a-z]/.test(s[i]))i++;prevSig='a';continue;}}
  if(c==='('||c==='['||c==='{'){stack.push(c==='('?')':c==='['?']':'}');i++;prevSig=c;continue;}
  if(c===')'||c===']'||c==='}'){const e=stack.pop();if(e!==c)throw Error('shim mismatch at '+i);i++;if(!stack.length)return i;prevSig=c;continue;}
  if(!/\s/.test(c))prevSig=c;i++;}
 throw Error('shim: unterminated');}
export function parseExpressionAt(s,pos){
 const fm=s.slice(pos).match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/);
 if(fm){const p=pos+fm[0].length-1;const afterParams=skip(s,p,')');const b=s.indexOf('{',afterParams);const end=skip(s,b,'}');return{type:'FunctionExpression',id:{name:fm[1]},start:pos,end,body:{start:b,end}};}
 const cm=s.slice(pos).match(/^[\w$.]+\s*\(/);if(cm){const end=skip(s,pos+cm[0].length-1,')');return{type:'CallExpression',start:pos,end};}
 throw Error('shim: unsupported expression');}
export default {parseExpressionAt};
