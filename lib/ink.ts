export type InkPoint={x:number;y:number};
export type InkStroke={points:InkPoint[];color:string;width:number;erase:boolean};
export type SubmittedSolution={question:number;drawing:InkStroke[];submitted:number;afterDeadline:boolean;revision:number};
export function validateDrawing(value:unknown):InkStroke[]{
 if(!Array.isArray(value)||!value.length||value.length>1000)throw new Error('풀이를 작성한 뒤 제출하세요.');
 let count=0;const result:InkStroke[]=value.map(s=>{
  if(!s||typeof s!=='object'||!Array.isArray(s.points)||!s.points.length||typeof s.erase!=='boolean'||!['#19364a','#195aca','#c02d35'].includes(s.color)||![3,5,8,32].includes(s.width))throw new Error('필기 형식을 확인하세요.');
  count+=s.points.length;if(count>15000)throw new Error('필기가 너무 많습니다. 필요한 풀이만 남겨 주세요.');
  return{color:s.color,width:s.width,erase:s.erase,points:s.points.map((p:InkPoint)=>{
   if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1000||p.y<0||p.y>650)throw new Error('필기 좌표를 확인하세요.');
   return{x:Math.round(p.x*100)/100,y:Math.round(p.y*100)/100};
  })};
 });
 if(!result.some(s=>!s.erase))throw new Error('풀이를 작성한 뒤 제출하세요.');
 return result;
}
export function renderInk(ctx:CanvasRenderingContext2D,strokes:InkStroke[],width:number,height:number){
 ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,width,height);
 ctx.setTransform(width/1000,0,0,height/650,0,0);ctx.lineCap='round';ctx.lineJoin='round';
 for(const s of strokes){ctx.globalCompositeOperation=s.erase?'destination-out':'source-over';ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.width;const p=s.points[0];if(!p)continue;
  ctx.beginPath();if(s.points.length===1){ctx.arc(p.x,p.y,s.width/2,0,Math.PI*2);ctx.fill();}else{ctx.moveTo(p.x,p.y);for(const point of s.points.slice(1))ctx.lineTo(point.x,point.y);ctx.stroke();}
 }ctx.globalCompositeOperation='source-over';
}
