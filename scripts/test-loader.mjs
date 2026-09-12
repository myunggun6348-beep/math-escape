import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import * as React from 'react';
globalThis.__testReact=React;
const cache=new Map();
export function moduleUrl(path){const file=resolve(path);if(cache.has(file))return cache.get(file);let source=readFileSync(file,'utf8');if(file.replaceAll('\\','/').endsWith('/db/raw.ts'))source='export const db=()=>globalThis.testDb;';
 source=source.replace(/import\s+\{([^}]+)\}\s+from\s+['"]react['"];?/g,(_,names)=>'const {'+names.replace(/\bas\b/g,':').replace(/,?\s*type\s+\w+/g,'')+'}=globalThis.__testReact;');
 let output=ts.transpileModule(source,{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React,jsxFactory:'globalThis.__testReact.createElement',jsxFragmentFactory:'globalThis.__testReact.Fragment'}}).outputText;
 output=output.replace(/from\s+(['"])([^'"]+)\1/g,(full,quote,spec)=>{if(!spec.startsWith('.')&&!spec.startsWith('@/'))return full;const base=spec.startsWith('@/')?resolve(spec.slice(2)):resolve(dirname(file),spec);let dependency;for(const suffix of ['', '.ts','.tsx']){try{readFileSync(base+suffix);dependency=base+suffix;break;}catch{}}if(!dependency)throw Error('Missing '+base);return 'from '+JSON.stringify(moduleUrl(dependency));});
 const url='data:text/javascript;base64,'+Buffer.from(output).toString('base64');cache.set(file,url);return url;}
export async function loadModule(path){return import(moduleUrl(path));}
