import {mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const HOST='https://events-public-service-live.ol.epicgames.com';
export function normalizeTournaments(body){
 if(!Array.isArray(body?.events))throw Error('Invalid Epic events response');
 const templates=new Map((body.templates||[]).map(t=>[t.eventTemplateId,t]));
 return body.events.flatMap(e=>{
  if(typeof e.eventId!=='string'||!Array.isArray(e.eventWindows))throw Error('Invalid Epic event');
  return e.eventWindows.filter(w=>w.visibility!=='private').map(w=>{
   if(typeof w.eventWindowId!=='string'||!Number.isFinite(Date.parse(w.beginTime))||!Number.isFinite(Date.parse(w.endTime)))throw Error('Invalid Epic event window');
   return {id:w.eventWindowId,eventId:e.eventId,start:w.beginTime,end:w.endTime,regions:Array.isArray(e.regions)?e.regions:[],playlist:templates.get(w.eventTemplateId)?.playlistId||null,round:w.round??null};
  });
 });
}
export function normalizePlayers(body){
 if(!Array.isArray(body?.entries))throw Error('Invalid Epic leaderboard response');
 return body.entries.map(e=>{
  if(!Array.isArray(e.teamAccountIds)||!e.teamAccountIds.length||e.teamAccountIds.some(id=>typeof id!=='string')||!Number.isFinite(e.rank))throw Error('Invalid Epic leaderboard entry');
  return {id:e.teamId||e.teamAccountIds.join(':'),name:e.teamAccountIds.join(' / '),rank:e.rank,points:Number.isFinite(e.pointsEarned)?e.pointsEarned:null,teamSize:e.teamAccountIds.length,matches:Array.isArray(e.sessionHistory)?e.sessionHistory.length:null};
 });
}
export async function sync({token,accountId,region='EU',windowId='',eventId='',fetcher=fetch,now=new Date(),output='data/tournaments.json'}={}){
 if(!token||!accountId)throw Error('EPIC_ACCESS_TOKEN and EPIC_ACCOUNT_ID are required for direct Epic access');
 if(!/^[a-f0-9]{32}$/i.test(accountId))throw Error('EPIC_ACCOUNT_ID must be a 32-character Epic account ID');
 if(!['EU','NAC','NAE','NAW','ASIA','OCE','BR','ME'].includes(region))throw Error('Invalid EPIC_REGION');
 const request=async(path,params)=>{const r=await fetcher(`${HOST}${path}?${new URLSearchParams(params)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(`Epic returned HTTP ${r.status}; verify token expiry, Fortnite scopes, and account access`);return r.json();};
 const tournaments=normalizeTournaments(await request(`/api/v1/events/Fortnite/download/${accountId}`,{region,platform:'Windows',teamAccountIds:accountId}));
 const selected=windowId?tournaments.find(t=>t.id===windowId&&(!eventId||t.eventId===eventId)):null;
 if(windowId&&!selected)throw Error('EPIC_EVENT_WINDOW_ID is not in this region’s event list');
 const leaderboard=selected?await request(`/api/v1/leaderboards/Fortnite/${encodeURIComponent(selected.eventId)}/${encodeURIComponent(windowId)}/${accountId}`,{page:0,showLiveSessions:false,appId:'fortnite'}):null;
 const snapshot={schemaVersion:2,status:'ok',source:'Epic Games Events Service',updatedAt:now.toISOString(),windowId:selected?.id||null,region,tournaments,players:leaderboard?normalizePlayers(leaderboard):[],totalPages:leaderboard?.totalPages??null};
 await mkdir(dirname(output),{recursive:true});await writeFile(`${output}.tmp`,JSON.stringify(snapshot,null,2)+'\n');await rename(`${output}.tmp`,output);return snapshot;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){sync({token:process.env.EPIC_ACCESS_TOKEN,accountId:process.env.EPIC_ACCOUNT_ID,region:process.env.EPIC_REGION||'EU',windowId:process.env.EPIC_EVENT_WINDOW_ID||''}).then(s=>console.log(`Published ${s.tournaments.length} Epic sessions and ${s.players.length} leaderboard teams`)).catch(e=>{console.error(e.message);process.exitCode=1;});}
