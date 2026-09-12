export const difficultyLabels={basic:'기본',standard:'보통',advanced:'심화'} as const;
export type Difficulty=keyof typeof difficultyLabels;
export const courseUnits:Record<string,string[]>={
'수학 종합':[],
'공통수학1':['다항식','방정식','경우의 수'],'기본수학1':['다항식','방정식','경우의 수'],
'공통수학2':['도형의 방정식','집합과 명제','함수'],'기본수학2':['도형의 방정식','집합과 명제','함수'],
'대수':['지수와 로그','삼각함수','수열'],'미적분Ⅰ':['함수의 극한','미분','적분'],
'확률과 통계':['경우의 수','확률','통계'],'기하':['이차곡선','벡터','공간도형'],
'미적분Ⅱ':['수열과 급수','여러 가지 미분법','여러 가지 적분법'],
'경제 수학':['경제 지표','금융','함수와 경제'],'인공지능 수학':['자료의 표현','분류와 예측','최적화'],
'직무 수학':['수와 연산','도형과 측정','자료와 가능성'],'수학과 문화':['수학과 예술','수학과 생활','수학과 음악'],
'실용 통계':['자료 수집','자료 분석','통계적 해석'],'수학과제 탐구':['탐구 설계','자료 분석','탐구 결과'],
'전문 수학':['행렬','극좌표','복소수'],'이산 수학':['그래프','집합과 경우의 수','알고리즘'],
'고급 기하':['공간벡터','공간좌표','평면'],'고급 대수':['행렬','벡터공간','선형변환'],
'고급 미적분':['편미분','급수','미분방정식']};
export type Settings={unit:string;difficulty:Difficulty};
export function validateSettings(course:string,unit:unknown='all',difficulty:unknown='standard'):Settings{
 if(!courseUnits[course])throw new Error('과목을 선택하세요.');
 if(typeof unit!=='string'||(unit!=='all'&&!courseUnits[course].includes(unit)))throw new Error('선택한 과목의 단원을 확인하세요.');
 if(typeof difficulty!=='string'||!Object.hasOwn(difficultyLabels,difficulty))throw new Error('난이도를 선택하세요.');
 return {unit,difficulty:difficulty as Difficulty};
}
export type Diagram={kind:'plot';coefficients:[number,number,number];xRange:[number,number];yRange:[number,number];points?:{x:number;y:number;label:string}[];caption:string}
|{kind:'triangle';width:number;height:number;caption:string}
|{kind:'bars';labels:string[];values:number[];caption:string}
|{kind:'venn';a:number;b:number;both:number;outside:number;caption:string}
|{kind:'network';vertices:number;caption:string}
|{kind:'rectangle';width:number;height:number;caption:string}
|{kind:'conic';shape:'ellipse'|'parabola';parameter:number;caption:string};
