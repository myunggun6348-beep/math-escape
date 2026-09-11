import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import ts from 'typescript';
const database=new DatabaseSync(':memory:');database.exec(readFileSync('drizzle/0000_organic_silver_samurai.sql','utf8').replaceAll('--> statement-breakpoint',''));
globalThis.testDb={prepare(sql){let values=[];return{bind(...v){values=v;return this},async first(){return database.prepare(sql).get(...values)||null},async all(){return{results:database.prepare(sql).all(...values)}},async run(){return{meta:database.prepare(sql).run(...values)}}}}};
const compile=s=>ts.transpile(s,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022});
const data=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const bank=await import(data(compile(readFileSync('lib/bank.ts','utf8'))));globalThis.testBank=bank;
let source=readFileSync('app/api/game/route.ts','utf8').replace("import {db} from '@/db/raw';","const db=()=>globalThis.testDb;").replace("import {courses,questions} from '@/lib/bank';","const {courses,questions}=globalThis.testBank;");
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
console.log('PASS: 20 course banks, 15-minute cutoff, server scoring, duplicate protection, escape, persistence and teacher ownership.');
