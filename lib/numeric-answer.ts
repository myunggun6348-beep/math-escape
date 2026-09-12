export function numericAnswer(input:unknown):number|null{
 const value=String(input??'').trim().replaceAll('−','-').replaceAll('／','/').replace(/\s/g,'');
 if(value.length>80)return null;
 const parts=value.split('/');if(parts.length>2||parts.some(v=>!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(v)))return null;
 const a=Number(parts[0]),b=parts.length===2?Number(parts[1]):1;
 if(!Number.isFinite(a)||!Number.isFinite(b)||b===0)return null;
 const result=a/b;return Number.isFinite(result)?result:null;
}
