import {createElement as h, type ReactNode} from 'react';
// Small author-only notation rendered as native MathML. No HTML injection or external fonts.
export function parseMath(source:string):ReactNode[]{
 let i=0;let serial=0;
 const el=(tag:string,...children:ReactNode[])=>h(tag,{key:serial++},...children);
 function group(){if(source[i]!=='{')throw new Error('수식 괄호가 필요합니다.');i++;const nodes=read(true);return el('mrow',...nodes);}
 function read(inGroup=false):ReactNode[]{const result:ReactNode[]=[];while(i<source.length){
 if(source[i]==='}'&&inGroup){i++;return result;}
 const command=source.slice(i).match(/^(frac|pow|subsup|sub|root|matrix)\{/);
 if(command){const name=command[1];i+=name.length;
 if(name==='matrix'){i++;const end=source.indexOf('}',i);if(end<0)throw new Error('행렬 괄호가 닫히지 않았습니다.');const value=source.slice(i,end);i=end+1;result.push(el('mrow',el('mo','['),el('mtable',...value.split(';').map(row=>el('mtr',...row.split(',').map(cell=>el('mtd',...parseMath(cell)))))),el('mo',']')));continue;}
 const first=group();if(name==='root'){result.push(el('msqrt',first));continue;}const second=group();if(name==='subsup'){result.push(el('msubsup',first,second,group()));continue;}result.push(el(name==='frac'?'mfrac':name==='pow'?'msup':'msub',first,second));continue;}
 const token=source.slice(i).match(/^(\d+(?:\.\d+)?|[a-zA-Z]+|\s+|.)/u)?.[0];if(!token)break;i+=token.length;if(/^\s+$/.test(token))continue;
 result.push(el(/^\d/.test(token)?'mn':/^[a-zA-Zα-ωΑ-Ω]+$/.test(token)?'mi':'mo',token));
 }if(inGroup)throw new Error('수식 괄호가 닫히지 않았습니다.');return result;}
 return read();
}
export default function MathExpression({source}:{source:string}){return <div className="math-line">{h('math',{display:'block'},h('mrow',null,...parseMath(source)))}</div>;}
