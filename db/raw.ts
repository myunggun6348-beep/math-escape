import {env} from 'cloudflare:workers';
export function db(){if(!env.DB)throw new Error('저장소 연결을 확인하고 다시 시도해 주세요.');return env.DB;}
