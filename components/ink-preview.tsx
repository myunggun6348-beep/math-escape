'use client';
import {useEffect,useRef} from 'react';
import {renderInk,type InkStroke} from '@/lib/ink';
export default function InkPreview({drawing,label='제출된 손글씨 풀이'}:{drawing:InkStroke[];label?:string}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const el=canvas.current;if(!el)return;const paint=()=>{const r=el.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,3);el.width=Math.max(1,Math.round(r.width*dpr));el.height=Math.max(1,Math.round(r.width*.65*dpr));const ctx=el.getContext('2d');if(ctx)renderInk(ctx,drawing,el.width,el.height);};paint();const resize=new ResizeObserver(paint);resize.observe(el);return()=>resize.disconnect();},[drawing]);
 return <canvas ref={canvas} className="ink-preview" role="img" aria-label={label}/>;
}
