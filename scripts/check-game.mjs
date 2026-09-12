import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import ts from 'typescript';
const database=new DatabaseSync(':memory:');database.exec(readFileSync('drizzle/0000_organic_silver_samurai.sql','utf8').replaceAll('--> statement-breakpoint',''));
globalThis.testDb={prepare(sql){let values=[];return{bind(...v){values=v;return this},async first(){return database.prepare(sql).get(...values)||null},async all(){return{results:database.prepare(sql).all(...values)}},async run(){return{meta:database.prepare(sql).run(...values)}}}}};
const compile=s=>ts.transpile(s,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const legacyUrl=data(compile(readFileSync('lib/bank.ts','utf8'))),catalogUrl=data(compile(readFileSync('lib/catalog.ts','utf8')));
const bank=await import(data(compile(readFileSync('lib/questions-v2.ts','utf8').replace("'./bank'",JSON.stringify(legacyUrl)).replace("'./catalog'",JSON.stringify(catalogUrl)))));globalThis.testBank=bank;
globalThis.testNumeric=await import(data(compile(readFileSync('lib/numeric-answer.ts','utf8'))));
let source=readFileSync('app/api/game/route.ts','utf8').replace("import {db} from '@/db/raw';","const db=()=>globalThis.testDb;").replace("import {courses,questions} from '@/lib/questions-v2';","const {courses,questions}=globalThis.testBank;").replace("import {numericAnswer} from '@/lib/numeric-answer';","const {numericAnswer}=globalThis.testNumeric;").replace("console.error('game request',e);",'');
const {POST,GET}=await import(data(compile(source)));
async function post(b,user='teacher'){const r=await POST(new Request('https://game.test/api/game',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':user},body:JSON.stringify(b)}));return{status:r.status,...await r.json()}}
async function get(path,user='teacher'){const r=await GET(new Request('https://game.test/api/game'+path,{headers:{'oai-authenticated-user-id':user}}));return{status:r.status,...await r.json()}}
const {code}=await post({action:'create',course:'확률과 통계'});assert.ok(code);
const begin=await post({action:'start',code,student:'01'},'student');let run=begin.run;assert.equal(run.deadline-run.started,900000);assert.equal(run.questions[0].answer,undefined);
assert.equal((await get('?teacher=1&room='+code,'student')).status,403);
assert.equal((await post({action:'next',id:run.id},'student')).status,400);
let wrong=await post({action:'answer',id:run.id,question:0,answer:'999'},'student');assert.equal(wrong.run.state.score,0);
for(let stage=0;stage<3;stage++){for(const i of [stage*2,stage*2+1]){let d=await post({action:'answer',id:run.id,question:i,answer:String(bank.questions('확률과 통계')[i].answer)},'student');assert.equal(d.status,200);const score=d.run.state.score;d=await post({action:'answer',id:run.id,question:i,answer:String(bank.questions('확률과 통계')[i].answer)},'student');assert.equal(d.run.state.score,score);}run=(await post({action:'next',id:run.id},'student')).run;}
assert.equal(run.state.escaped,true);assert.equal(run.state.score,1025);assert.equal(run.questions[0].answer,10);
assert.equal((await get('?teacher=1&room='+code)).records.length,1);
const second=(await post({action:'start',course:'대수',student:'02'},'student2')).run;database.prepare('UPDATE runs SET started=? WHERE id=?').run(Date.now()-901000,second.id);const expired=await post({action:'answer',id:second.id,question:0,answer:'5'},'student2');assert.equal(expired.run.state.done,true);assert.equal(expired.run.state.score,0);
assert.equal((await get('?id='+run.id,'student2')).run,null);
assert.equal(bank.courses.length,20);for(const c of bank.courses){assert.equal(bank.questions(c).length,6);for(const q of bank.questions(c))assert.ok(Number.isFinite(q.answer));}
// New answer representation must never disclose a solution before it is earned.
assert.equal(begin.run.questions[0].explanation,undefined);assert.equal(begin.run.questions[2].answerText,undefined);assert.equal(run.questions[2].answerText,'2/3');
const fractionRun=(await post({action:'start',course:'확률과 통계',student:'03'},'fraction')).run;
await post({action:'answer',id:fractionRun.id,question:0,answer:'10'},'fraction');await post({action:'next',id:fractionRun.id},'fraction');
const invalid=await post({action:'answer',id:fractionRun.id,question:2,answer:'1/0'},'fraction');assert.equal(invalid.status,400);
const fraction=await post({action:'answer',id:fractionRun.id,question:2,answer:'4/6'},'fraction');assert.ok(fraction.run.state.solved.includes(2));assert.equal(fraction.run.state.score,250);assert.ok(fraction.run.questions[2].explanation.length>0);
assert.equal(globalThis.testNumeric.numericAnswer('−3'),-3);assert.equal(globalThis.testNumeric.numericAnswer(' .5 '),.5);for(const bad of ['NaN','Infinity','1/0','1/2/3','2+3',''])assert.equal(globalThis.testNumeric.numericAnswer(bad),null);
const old=(await post({action:'start',course:'확률과 통계',student:'04'},'legacy')).run;const oldState={solved:[],hints:[],attempts:{},score:0,stage:0,done:false,escaped:false};database.prepare('UPDATE runs SET state=? WHERE id=?').run(JSON.stringify(oldState),old.id);
const restored=await get('?id='+old.id,'legacy');assert.ok(restored.run.questions[1].prompt.includes('3을 곱하고 7'));await post({action:'answer',id:old.id,question:0,answer:'10'},'legacy');const oldBonus=await post({action:'answer',id:old.id,question:1,answer:'37'},'legacy');assert.equal(oldBonus.run.state.score,350);
// Independently derived checks for the more involved new problems.
const challengeAnswers={ '확률과 통계':[10-3,2/3,8*.25*.75], '미적분Ⅰ':[4,3-2*2,4-8/3], '대수':[Math.sqrt(9),Math.sqrt(1-.6**2),8+7*3], '기하':[2*Math.sqrt(25-9),6/2,Math.hypot(3,4,0)], '인공지능 수학':[4/(2*4),(1+4)/2,3], '직무 수학':[(200*.04+300*.09)/500*100,12/.25,(100*.02+300*.04)/400*100]};
for(const [course,values] of Object.entries(challengeAnswers))values.forEach((a,i)=>assert.ok(Math.abs(bank.questions(course)[i*2+1].answer-a)<1e-9));
// Render every authored expression as MathML without a browser.
const react=await import('react'),{renderToStaticMarkup}=await import('react-dom/server');globalThis.mathReact=react;
const mathSource=readFileSync('components/math-expression.tsx','utf8').replace("import {createElement as h, type ReactNode} from 'react';","const h=globalThis.mathReact.createElement;");
const math=await import(data(ts.transpileModule(mathSource,{fileName:'math.tsx',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022,jsx:ts.JsxEmit.React,jsxFactory:'h'}}).outputText));
let count=0;for(const c of bank.courses)for(const q of bank.questions(c)){if(q.id%2)assert.ok(!q.prompt.includes('앞선 단서'));for(const f of q.formula??[]){const rendered=renderToStaticMarkup(react.createElement(math.default,{source:f}));assert.ok(rendered.includes('<math'));assert.ok(!rendered.includes('frac{'));count++;}}
assert.ok(renderToStaticMarkup(react.createElement(math.default,{source:'frac{pow{x}{2}}{3}'})).includes('<mfrac>'));
console.log(`PASS: 120 questions, ${count} MathML expressions, fractions, solution gating, legacy records, scoring, timeout and teacher ownership.`);
