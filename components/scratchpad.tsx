'use client';

import {useCallback,useEffect,useId,useRef,useState,type PointerEvent as ReactPointerEvent} from 'react';
import {Eraser,PenLine,Redo2,Trash2,Undo2} from 'lucide-react';
import {validateDrawing,type SubmittedSolution} from '@/lib/ink';
import InkPreview from './ink-preview';

type Point={x:number;y:number};
type Stroke={points:Point[];color:string;width:number;erase:boolean};
const WIDTH=1000,HEIGHT=650;
// Same-tab fallback when session storage is unavailable. Bound memory use across games.
const memory=new Map<string,Stroke[]>();
const colors=[{value:'#19364a',name:'검정'},{value:'#195aca',name:'파랑'},{value:'#c02d35',name:'빨강'}];

function readDrawing(key:string):Stroke[]{
 try{
  const raw=sessionStorage.getItem(key);
  if(raw){
   const data:unknown=JSON.parse(raw);
   if(Array.isArray(data)&&data.length<=1000&&data.every(s=>s&&Array.isArray(s.points)&&s.points.length<=12000&&s.points.every((p:Point)=>Number.isFinite(p.x)&&Number.isFinite(p.y))&&colors.some(c=>c.value===s.color)&&typeof s.erase==='boolean'&&[3,5,8,32].includes(s.width)))return data;
  }
 }catch{/* Fall back to the current tab's in-memory drawing. */}
 return memory.get(key)??[];
}

export default function Scratchpad({storageKey,submission}:{storageKey:string;submission?:{runId:string;question:number}}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const strokes=useRef<Stroke[]>([]),draft=useRef<Stroke|null>(null);
 const past=useRef<Stroke[][]>([]),future=useRef<Stroke[][]>([]);
 const pointer=useRef<number|null>(null),frame=useRef<number|null>(null);
 const [tool,setTool]=useState<'pen'|'eraser'>('pen');
 const [color,setColor]=useState(colors[0].value),[width,setWidth]=useState(5);
 const [finger,setFinger]=useState(false),[ready,setReady]=useState(false);
 const [revision,setRevision]=useState(0),[temporary,setTemporary]=useState(false);
 const helpId=useId();
 const [submitted,setSubmitted]=useState<SubmittedSolution|null>(null),[sending,setSending]=useState(false),[submitError,setSubmitError]=useState(''),[loaded,setLoaded]=useState(false),[refresh,setRefresh]=useState(0);
 useEffect(()=>{if(!submission)return;const controller=new AbortController();setLoaded(false);setSubmitError('');
 fetch('/api/solutions?run='+encodeURIComponent(submission.runId)+'&question='+submission.question,{cache:'no-store',signal:controller.signal}).then(async r=>{const d=await r.json() as {error?:string;submissions:SubmittedSolution[];submission:SubmittedSolution};if(!r.ok)throw new Error(d.error);return d;}).then(d=>{setSubmitted(d.submissions[0]??null);setLoaded(true);}).catch(e=>{if(!controller.signal.aborted)setSubmitError(e.message);});return()=>controller.abort();},[submission?.runId,submission?.question,refresh]);
 const submit=async()=>{
  if(!submission||sending)return;setSending(true);setSubmitError('');
  try{const drawing=validateDrawing(strokes.current);const r=await fetch('/api/solutions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...submission,drawing,revision:submitted?.revision??0})});const d=await r.json() as {error?:string;submissions:SubmittedSolution[];submission:SubmittedSolution};if(!r.ok){if(r.status===409)setLoaded(false);throw new Error(d.error);}setSubmitted(d.submission);}
  catch(e){setSubmitError((e as Error).message);}finally{setSending(false);}
 };

 const paint=useCallback(()=>{
  const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,el.width,el.height);
  ctx.setTransform(el.width/WIDTH,0,0,el.height/HEIGHT,0,0);
  ctx.lineCap='round';ctx.lineJoin='round';
  for(const stroke of draft.current?[...strokes.current,draft.current]:strokes.current){
   ctx.globalCompositeOperation=stroke.erase?'destination-out':'source-over';
   ctx.strokeStyle=stroke.color;ctx.fillStyle=stroke.color;ctx.lineWidth=stroke.width;
   const first=stroke.points[0];if(!first)continue;
   if(stroke.points.length===1){ctx.beginPath();ctx.arc(first.x,first.y,stroke.width/2,0,Math.PI*2);ctx.fill();}
   else{ctx.beginPath();ctx.moveTo(first.x,first.y);for(const p of stroke.points.slice(1))ctx.lineTo(p.x,p.y);ctx.stroke();}
  }
  ctx.globalCompositeOperation='source-over';
 },[]);
 const schedulePaint=()=>{if(frame.current===null)frame.current=requestAnimationFrame(()=>{frame.current=null;paint();});};
 const save=useCallback((drawing:Stroke[])=>{
  memory.delete(storageKey);memory.set(storageKey,drawing);
  while(memory.size>24)memory.delete(memory.keys().next().value!);
  try{sessionStorage.setItem(storageKey,JSON.stringify(drawing));setTemporary(false);}
  catch{setTemporary(true);}
 },[storageKey]);
 const commit=(next:Stroke[])=>{
  past.current=[...past.current.slice(-29),strokes.current];future.current=[];
  strokes.current=next;save(next);setRevision(v=>v+1);paint();
 };

 useEffect(()=>{
  strokes.current=readDrawing(storageKey);
  const first=Math.max(0,strokes.current.length-30);
  past.current=Array.from({length:strokes.current.length-first},(_,i)=>strokes.current.slice(0,first+i));future.current=[];
  setReady(true);setRevision(v=>v+1);paint();
 },[storageKey,paint]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const resize=()=>{
   const rect=el.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,3);
   el.width=Math.max(1,Math.round(rect.width*ratio));el.height=Math.max(1,Math.round(rect.height*ratio));paint();
  };
  resize();const observer=new ResizeObserver(resize);observer.observe(el);
  window.addEventListener('resize',resize);
  return()=>{observer.disconnect();window.removeEventListener('resize',resize);if(frame.current!==null)cancelAnimationFrame(frame.current);};
 },[paint]);
 // Preserve even an unfinished stroke if the timer closes the problem or the page reloads.
 useEffect(()=>{
  const flush=()=>{
   const drawing=draft.current?[...strokes.current,draft.current]:strokes.current;
   memory.set(storageKey,drawing);
   try{sessionStorage.setItem(storageKey,JSON.stringify(drawing));}catch{/* In-memory fallback remains available. */}
  };
  window.addEventListener('pagehide',flush);
  return()=>{window.removeEventListener('pagehide',flush);flush();};
 },[storageKey]);

 const point=(event:{clientX:number;clientY:number}):Point=>{
  const rect=canvas.current!.getBoundingClientRect();
  return{x:Math.max(0,Math.min(WIDTH,(event.clientX-rect.left)*WIDTH/rect.width)),y:Math.max(0,Math.min(HEIGHT,(event.clientY-rect.top)*HEIGHT/rect.height))};
 };
 const start=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(!ready||pointer.current!==null||(!finger&&event.pointerType==='touch')||(event.pointerType==='touch'&&!event.isPrimary)||(event.pointerType==='mouse'&&event.button!==0))return;
  if(strokes.current.length>=1000)return;
  event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);pointer.current=event.pointerId;
  const erase=tool==='eraser'||(event.pointerType==='pen'&&(event.button===5||(event.buttons&32)!==0));
  draft.current={points:[point(event)],color,width:erase?32:width,erase};paint();
 };
 const move=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(pointer.current!==event.pointerId||!draft.current)return;
  event.preventDefault();
  const coalesced=event.nativeEvent.getCoalescedEvents?.();
  for(const sample of coalesced?.length?coalesced:[event]){
   const p=point(sample),last=draft.current.points.at(-1)!;
   if(Math.hypot(p.x-last.x,p.y-last.y)>=.5&&draft.current.points.length<12000)draft.current.points.push(p);
  }
  schedulePaint();
 };
 const finish=(event:ReactPointerEvent<HTMLCanvasElement>)=>{
  if(pointer.current!==event.pointerId)return;
  pointer.current=null;const completed=draft.current;draft.current=null;
  if(completed)commit([...strokes.current,completed]);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 const undo=()=>{const prev=past.current.pop();if(!prev)return;future.current.push(strokes.current);strokes.current=prev;save(prev);setRevision(v=>v+1);paint();};
 const redo=()=>{const next=future.current.pop();if(!next)return;past.current.push(strokes.current);strokes.current=next;save(next);setRevision(v=>v+1);paint();};

 return <section className="scratchpad" aria-label="문제별 필기 공간" data-revision={revision}>
  <div className="scratchpad-heading"><h3><PenLine size={19}/>직접 풀어보기</h3><span>나만의 풀이 노트</span></div>
  <div className="scratchpad-tools" role="group" aria-label="필기 도구">
   <button type="button" aria-pressed={tool==='pen'} onClick={()=>setTool('pen')}><PenLine size={17}/>펜</button>
   <button type="button" aria-pressed={tool==='eraser'} onClick={()=>setTool('eraser')}><Eraser size={17}/>지우개</button>
   <div className="ink-colors" role="group" aria-label="펜 색상">{colors.map(c=><button type="button" key={c.value} aria-label={c.name+' 펜'} aria-pressed={color===c.value} onClick={()=>{setColor(c.value);setTool('pen');}}><span style={{background:c.value}}/></button>)}</div>
   <label className="ink-width">굵기<select value={width} onChange={e=>setWidth(Number(e.target.value))} aria-label="펜 굵기"><option value={3}>가는 선</option><option value={5}>보통</option><option value={8}>굵은 선</option></select></label>
   <button type="button" aria-label="필기 실행 취소" title="실행 취소" disabled={!ready||!past.current.length} onClick={undo}><Undo2 size={19}/></button>
   <button type="button" aria-label="필기 다시 실행" title="다시 실행" disabled={!ready||!future.current.length} onClick={redo}><Redo2 size={19}/></button>
   <button type="button" disabled={!ready||!strokes.current.length} onClick={()=>commit([])}><Trash2 size={17}/>전체 지우기</button>
  </div>
  <label className="finger-drawing"><input type="checkbox" checked={finger} onChange={e=>setFinger(e.target.checked)}/>손가락으로도 쓰기 <span>기본은 펜 전용</span></label>
  <div className="scratchpad-paper">
   <canvas ref={canvas} aria-label="펜으로 수식을 쓰거나 그림을 그리는 연습장" aria-describedby={helpId} onPointerDown={start} onPointerMove={move} onPointerUp={e=>{move(e);finish(e);}} onPointerCancel={finish} onLostPointerCapture={finish} onContextMenu={e=>e.preventDefault()}>필기는 펜이나 마우스로 할 수 있습니다. 정답은 별도 답안 칸에 입력하세요.</canvas>
  </div>
  <p id={helpId} className="scratchpad-help">{submission?'작성 중인 필기는 이 탭에 임시 보관됩니다. 풀이 제출을 누르면 선생님께 저장됩니다.':'필기는 이 기기의 현재 탭에만 임시 보관됩니다.'} 정답은 답안 칸에 제출하세요.<br/>화면을 이동하려면 필기 공간 바깥을 밀어 주세요.</p>
  {submission&&<div className="ink-submission"><button type="button" className="primary" disabled={!loaded||sending||!ready||!strokes.current.some(s=>!s.erase)} onClick={submit}>{sending?'제출 중…':submitted?'풀이 다시 제출':'선생님께 풀이 제출'}</button>{!loaded&&<button type="button" className="quiet" onClick={()=>setRefresh(v=>v+1)}>제출 상태 다시 확인</button>}{submitError&&<p role="alert">{submitError}</p>}{submitted&&<><p role="status">{new Date(submitted.submitted).toLocaleTimeString('ko-KR')} · {submitted.revision}차 제출 완료{submitted.afterDeadline?' · 종료 후 제출':''}<br/>이후 수정한 필기는 다시 제출해야 반영됩니다.</p><details><summary>제출된 풀이 확인</summary><InkPreview drawing={submitted.drawing}/></details></>}</div>}
  {temporary&&<p role="status" className="scratchpad-warning">임시 저장 공간이 부족합니다. 새로고침하면 필기가 사라질 수 있어요.</p>}
  {strokes.current.length>=1000&&<p role="status" className="scratchpad-warning">필기 공간이 가득 찼습니다. 전체 지우기로 새로 시작할 수 있어요.</p>}
 </section>;
}
