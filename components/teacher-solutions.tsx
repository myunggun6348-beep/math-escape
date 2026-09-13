'use client';
import {useEffect,useState} from 'react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {ProblemText,type VisibleQuestion} from './puzzle';
import InkPreview from './ink-preview';
import type {SubmittedSolution} from '@/lib/ink';
export default function TeacherSolutions({run,onClose}:{run:{id:string;student:string;questions:VisibleQuestion[]}|null;onClose:()=>void}){
 const [items,setItems]=useState<SubmittedSolution[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{if(!run)return;const controller=new AbortController();setItems([]);setError('');setLoading(true);
 fetch('/api/solutions?run='+encodeURIComponent(run.id),{signal:controller.signal,cache:'no-store'}).then(async r=>{const d=await r.json() as {error?:string;submissions:SubmittedSolution[];submission:SubmittedSolution};if(!r.ok)throw new Error(d.error);return d;}).then(d=>{setItems(d.submissions);setLoading(false);}).catch(e=>{if(!controller.signal.aborted){setError(e.message);setLoading(false);}});return()=>controller.abort();},[run?.id,reload]);
 return <Dialog open={!!run} onOpenChange={v=>{if(!v)onClose();}}><DialogContent className="teacher-ink-dialog"><DialogTitle>{run?.student} 학생의 손글씨 풀이</DialogTitle><DialogDescription>문제별 최신 제출본입니다. 풀이 제출은 게임 점수와 별도로 기록됩니다.</DialogDescription><button type="button" className="quiet" onClick={()=>setReload(v=>v+1)} disabled={loading}>제출 목록 새로고침</button>{loading?<p role="status">풀이를 불러오는 중…</p>:error?<p role="alert">{error}</p>:run?.questions.map(q=>{const item=items.find(s=>s.question===q.id);return <section className="teacher-ink-question" key={q.id}><h3>문제 {q.id+1} · {q.topic}</h3><ProblemText question={q}/>{item?<><p className="submission-stamp">{new Date(item.submitted).toLocaleString('ko-KR')} · {item.revision}차 제출{item.afterDeadline?' · 종료 후 제출':''}</p><InkPreview drawing={item.drawing} label={run.student+' 학생의 문제 '+(q.id+1)+' 풀이'}/></>:<p className="submission-stamp">아직 제출하지 않았습니다.</p>}</section>;})}</DialogContent></Dialog>;
}
