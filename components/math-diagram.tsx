import {useId} from 'react';
import type {Diagram} from '@/lib/game-settings';
export default function MathDiagram({diagram:d}:{diagram:Diagram}){
 const id=useId().replaceAll(':','');const W=440,H=280;let graphic;let description=d.caption;
 if(d.kind==='plot'){
 const [xmin,xmax]=d.xRange,[ymin,ymax]=d.yRange;const sx=(x:number)=>48+(x-xmin)/(xmax-xmin)*360,sy=(y:number)=>230-(y-ymin)/(ymax-ymin)*200;
 const xticks=Array.from({length:5},(_,i)=>xmin+i*(xmax-xmin)/4),yticks=Array.from({length:5},(_,i)=>ymin+i*(ymax-ymin)/4);
 const path=Array.from({length:181},(_,i)=>{const x=xmin+i*(xmax-xmin)/180;const y=d.coefficients[0]*x*x+d.coefficients[1]*x+d.coefficients[2];return `${i?'L':'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`;}).join(' ');
 description+=`. x 범위 ${xmin}~${xmax}, y 범위 ${ymin}~${ymax}. 수식은 문제 본문에 표시되어 있습니다.`;
 graphic=<><defs><clipPath id={id}><rect x="48" y="30" width="360" height="200"/></clipPath></defs>{xticks.map((x,i)=><g key={'x'+i}><line x1={sx(x)} x2={sx(x)} y1="30" y2="230" stroke="#dce6ed"/><text x={sx(x)} y="250" textAnchor="middle">{Number(x.toFixed(1))}</text></g>)}{yticks.map((y,i)=><g key={'y'+i}><line x1="48" x2="408" y1={sy(y)} y2={sy(y)} stroke="#dce6ed"/><text x="40" y={sy(y)+5} textAnchor="end">{Number(y.toFixed(1))}</text></g>)}{xmin<=0&&xmax>=0&&<line x1={sx(0)} x2={sx(0)} y1="30" y2="230" stroke="#6b8595"/>}{ymin<=0&&ymax>=0&&<line x1="48" x2="408" y1={sy(0)} y2={sy(0)} stroke="#6b8595"/>}<path d={path} clipPath={`url(#${id})`} fill="none" stroke="#276887" strokeWidth="3"/><text x="416" y="250">x</text><text x="38" y="20">y</text></>;
 }else if(d.kind==='triangle'){
 const scale=Math.min(280/d.width,165/d.height),x1=75,y1=220,x2=x1+d.width*scale,y2=y1-d.height*scale;description+=`. 밑변 ${d.width}, 높이 ${d.height}.`;
 graphic=<><path d={`M${x1},${y1}H${x2}V${y2}Z`} fill="#deedf4" stroke="#286683" strokeWidth="2.5"/><path d={`M${x2-14},${y1}v-14h14`} fill="none" stroke="#286683"/><text x={(x1+x2)/2} y={y1+27} textAnchor="middle">{d.width}</text><text x={x2+18} y={(y1+y2)/2} dominantBaseline="middle">{d.height}</text></>;
 }else if(d.kind==='bars'){
 const max=Math.max(...d.values)*1.2;description+=`. ${d.labels.map((label,i)=>`${label}: ${d.values[i]}`).join(', ')}.`;
 graphic=<><line x1="50" x2="405" y1="225" y2="225" stroke="#6b8595"/>{d.values.map((v,i)=>{const x=80+i*310/d.values.length,h=v/max*170;return <g key={i}><rect x={x} y={225-h} width={Math.min(55,220/d.values.length)} height={h} rx="3" fill="#347998"/><text x={x+25} y={213-h} textAnchor="middle">{v}</text><text x={x+25} y="249" textAnchor="middle">{d.labels[i]}</text></g>})}</>;
 }else if(d.kind==='venn'){
 description+=`. A에만 ${d.a}, 교집합 ${d.both}, B에만 ${d.b}, 두 집합 밖 ${d.outside}.`;
 graphic=<><rect x="30" y="30" width="380" height="205" rx="8" fill="#f3f7fa" stroke="#b0c4d0"/><circle cx="175" cy="125" r="75" fill="#669ec533" stroke="#407594" strokeWidth="2"/><circle cx="270" cy="125" r="75" fill="#61ad9233" stroke="#39846d" strokeWidth="2"/><text x="165" y="40">A</text><text x="285" y="40">B</text><text x="45" y="55">U</text><text x="148" y="130">{d.a}</text><text x="217" y="130">{d.both}</text><text x="290" y="130">{d.b}</text><text x="365" y="212">{d.outside}</text></>;
 }else if(d.kind==='rectangle'){
 const scale=Math.min(280/d.width,170/d.height),w=d.width*scale,h=d.height*scale;
 description+=`. 가로 ${d.width}, 세로 ${d.height}.`;
 graphic=<><rect x={220-w/2} y={130-h/2} width={w} height={h} fill="#e3eff5" stroke="#286683" strokeWidth="2.5"/><text x="220" y={155+h/2} textAnchor="middle">{d.width}</text><text x={235+w/2} y="135">{d.height}</text></>;
 }else if(d.kind==='conic'){
 const n=d.parameter,a=Math.sqrt(n*n+9),s=d.shape==='ellipse'?Math.min(140/a,85/3):85/(2*n),cx=d.shape==='ellipse'?220:130,cy=135;
 const points=Array.from({length:181},(_,i)=>{if(d.shape==='ellipse'){const t=2*Math.PI*i/180;return `${i?'L':'M'}${cx+a*s*Math.cos(t)},${cy-3*s*Math.sin(t)}`;}const y=-2*n+4*n*i/180,x=y*y/(4*n);return `${i?'L':'M'}${cx+x*s},${cy-y*s}`;}).join(' ');
 description+=d.shape==='ellipse'?`. x²/${n*n+9}+y²/9=1.`:`. y²=${4*n}x.`;
 graphic=<><line x1="45" x2="400" y1={cy} y2={cy} stroke="#9fb4c1"/><line x1={cx} x2={cx} y1="28" y2="244" stroke="#9fb4c1"/><text x="405" y={cy+5}>x</text><text x={cx+8} y="24">y</text><text x={cx-15} y={cy+20}>0</text><path d={points} stroke="#286683" fill="none" strokeWidth="3"/></>;
 }else{
 const points=Array.from({length:d.vertices},(_,i)=>({x:220+95*Math.cos(2*Math.PI*i/d.vertices-Math.PI/2),y:135+95*Math.sin(2*Math.PI*i/d.vertices-Math.PI/2)}));description+=`. 각 꼭짓점은 나머지 모든 꼭짓점과 연결되어 있습니다.`;
 graphic=<>{points.flatMap((p,i)=>points.slice(i+1).map((p2,j)=><line key={i+'-'+j} x1={p.x} y1={p.y} x2={p2.x} y2={p2.y} stroke="#94b4c5" strokeWidth="1.5"/>))}{points.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="13" fill="#255d7a"/><text x={p.x} y={p.y+5} textAnchor="middle" style={{fill:"#fff"}}>{i+1}</text></g>)}</>;
 }
 return <figure className="math-diagram"><svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby={'title-'+id} preserveAspectRatio="xMidYMid meet"><title id={'title-'+id}>{description}</title>{graphic}</svg><figcaption>{d.caption}</figcaption><details><summary>그림을 글로 확인</summary><p>{description}</p></details></figure>;
}
