import {db} from '@/db/raw';
import {validateDrawing} from '@/lib/ink';
export const dynamic='force-dynamic';
type Run={id:string;owner:string;room:string|null;started:number;state:string};
type Row={question:number;drawing:string;submitted:number;after_deadline:number;revision:number};
const out=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const view=(row:Row)=>({question:row.question,drawing:JSON.parse(row.drawing),submitted:row.submitted,afterDeadline:!!row.after_deadline,revision:row.revision});
function identity(req:Request){const id=req.headers.get('oai-authenticated-user-id');if(!id)throw new Error('로그인 후 이용해 주세요.');return id;}
async function body(req:Request){
 const reader=req.body?.getReader();if(!reader)throw new Error('제출할 풀이가 없습니다.');
 const chunks:Uint8Array[]=[];let size=0;
 for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>800000){await reader.cancel();throw new Error('필기가 너무 많습니다. 필요한 풀이만 남겨 주세요.');}chunks.push(part.value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function GET(req:Request){try{
 const owner=identity(req),url=new URL(req.url),id=url.searchParams.get('run');
 const run=await db().prepare('SELECT id,owner,room,started,state FROM runs WHERE id=?').bind(id).first<Run>();
 if(!run)return out({error:'기록을 찾지 못했습니다.'},404);
 const teacher=run.room?await db().prepare('SELECT code FROM rooms WHERE code=? AND owner=?').bind(run.room,owner).first():null;
 if(run.owner!==owner&&!teacher)return out({error:'이 풀이를 볼 권한이 없습니다.'},403);
 const question=url.searchParams.get('question');if(question!==null&&!/^[0-5]$/.test(question))return out({error:'문제를 확인하세요.'},400);
 const query=question===null?'SELECT * FROM solutions WHERE run_id=? ORDER BY question':'SELECT * FROM solutions WHERE run_id=? AND question=?';
 const stmt=db().prepare(query);const found=await (question===null?stmt.bind(run.id):stmt.bind(run.id,Number(question))).all<Row>();
 return out({submissions:found.results.map(view)});
 }catch(e){return out({error:(e as Error).message},400);}}
export async function POST(req:Request){try{
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return out({error:'요청 출처를 확인하세요.'},403);
 const owner=identity(req),b=await body(req);
 if(!Number.isInteger(b.question)||b.question<0||b.question>5||!Number.isInteger(b.revision)||b.revision<0)return out({error:'문제와 제출 버전을 확인하세요.'},400);
 const run=await db().prepare('SELECT id,owner,room,started,state FROM runs WHERE id=? AND owner=?').bind(b.runId,owner).first<Run>();
 if(!run)return out({error:'본인의 풀이만 제출할 수 있습니다.'},403);
 if(!run.room)return out({error:'수업방에 참여한 게임에서 제출할 수 있습니다.'},400);
 const state=JSON.parse(run.state);
 if(Math.floor(b.question/2)>state.stage||(b.question%2===1&&!state.solved.includes(b.question-1)))return out({error:'열린 문제의 풀이만 제출할 수 있습니다.'},403);
 const drawing=validateDrawing(b.drawing),submitted=Date.now(),afterDeadline=state.done||submitted>=run.started+900000;
 const saved=await db().prepare('INSERT INTO solutions (run_id,question,drawing,submitted,after_deadline,revision) VALUES (?,?,?,?,?,1) ON CONFLICT(run_id,question) DO UPDATE SET drawing=excluded.drawing,submitted=excluded.submitted,after_deadline=excluded.after_deadline,revision=solutions.revision+1 WHERE solutions.revision=?').bind(run.id,b.question,JSON.stringify(drawing),submitted,afterDeadline?1:0,b.revision).run();
 if(!saved.meta.changes)return out({error:'다른 창에서 풀이가 변경되었습니다. 제출 상태를 새로 확인한 뒤 다시 제출하세요.'},409);
 const row=await db().prepare('SELECT * FROM solutions WHERE run_id=? AND question=?').bind(run.id,b.question).first<Row>();
 return out({submission:view(row!)});
 }catch(e){return out({error:(e as Error).message},400);}}
