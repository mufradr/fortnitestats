import {mkdir, writeFile, rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const HOST = 'https://api.osirion.gg';
export function normalizeTournaments(body) {
  if (!Array.isArray(body?.tournaments)) throw new Error('Invalid Osirion tournaments response');
  return body.tournaments.map(t => {
    if (typeof t.eventId !== 'string' || typeof t.eventWindowId !== 'string' || !Number.isFinite(t.startTime) || !Number.isFinite(t.endTime)) throw new Error('Invalid tournament record');
    return {id:t.eventWindowId,eventId:t.eventId,start:new Date(t.startTime*1000).toISOString(),end:new Date(t.endTime*1000).toISOString(),matches:Number.isFinite(t.totalMatches)?t.totalMatches:null,progress:Number.isFinite(t.parsingProgress)?t.parsingProgress:null};
  });
}
export function normalizePlayers(body) {
  if (!Array.isArray(body?.players)) throw new Error('Invalid Osirion player response');
  return body.players.map(p=>{
    if(typeof p.epicId!=='string') throw new Error('Invalid player record');
    const metric=k=>Number.isFinite(p[k])&&p[k]>=0?p[k]:null;
    return {id:p.epicId,name:typeof p.epicUsername==='string'&&p.epicUsername?p.epicUsername:p.epicId,matches:metric('matchesPlayed'),eliminations:metric('eliminations'),avgPlacement:metric('avgPlacement'),damage:metric('damageToPlayers')};
  });
}
export async function sync({key,windowId='',fetcher=fetch,now=new Date(),output='data/tournaments.json'}={}) {
  if (!key) throw new Error('OSIRION_API_KEY is required; configure it as a GitHub Actions secret');
  const request=async(path,params)=>{
    const response=await fetcher(`${HOST}${path}?${new URLSearchParams(params)}`,{headers:{Authorization:`Bearer ${key}`,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
    // Never log response bodies or authorization headers.
    if(!response.ok)throw new Error(`Osirion returned HTTP ${response.status}; check API access and credit balance`);
    return response.json();
  };
  // Bounded requests: one page of replay-indexed tournaments, and optionally one player page.
  const tournaments=normalizeTournaments(await request('/fortnite/v1/tournaments',{fromUnix:Math.floor(now.getTime()/1000)-14*86400,toUnix:Math.floor(now.getTime()/1000),fromIndex:0,limit:50}));
  const players=windowId?normalizePlayers(await request('/fortnite/v1/tournaments/stats',{eventWindowId:windowId,limit:100,fromIndex:0})):[];
  const snapshot={schemaVersion:1,status:'ok',source:'Osirion public API',updatedAt:now.toISOString(),windowId:windowId||null,tournaments,players};
  await mkdir(new URL('../data/',import.meta.url),{recursive:true});
  await writeFile(`${output}.tmp`,JSON.stringify(snapshot,null,2)+'\n');
  await rename(`${output}.tmp`,output);
  return snapshot;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  sync({key:process.env.OSIRION_API_KEY,windowId:process.env.OSIRION_EVENT_WINDOW_ID||''}).then(s=>console.log(`Published ${s.tournaments.length} tournament windows and ${s.players.length} player rows`)).catch(e=>{console.error(e.message);process.exitCode=1;});
}
