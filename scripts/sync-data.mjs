import {mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
const ACCOUNT_HOST='https://account-public-service-prod.ol.epicgames.com';
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
  return {accountIds:e.teamAccountIds,id:e.teamId||e.teamAccountIds.join(':'),name:e.teamAccountIds.join(' / '),rank:e.rank,points:Number.isFinite(e.pointsEarned)?e.pointsEarned:null,teamSize:e.teamAccountIds.length,matches:Array.isArray(e.sessionHistory)?e.sessionHistory.length:null};
 });
}
export function selectWindows(tournaments,{windowId='',eventId='',now=new Date(),limit=3}={}){
 if(windowId){const match=tournaments.find(t=>t.id===windowId&&(!eventId||t.eventId===eventId));if(!match)throw Error('EPIC_EVENT_WINDOW_ID is not in this region’s event list');return [match];}
 const time=now.getTime();
 // Standings make sense once a session has begun. Prefer active, then most recent.
 return tournaments.filter(t=>Date.parse(t.start)<=time).sort((a,b)=>{
  const active=t=>Date.parse(t.end)>=time?1:0;
  return active(b)-active(a)||Date.parse(b.start)-Date.parse(a.start);
 }).slice(0,limit);
}
export async function sync({token,accountId,region='EU',windowId='',eventId='',fetcher=fetch,now=new Date(),output='data/tournaments.json',maxPages=2,maxWindows=3,resolveNames=true}={}){
 if(!token||!accountId)throw Error('EPIC_ACCESS_TOKEN and EPIC_ACCOUNT_ID are required for direct Epic access');
 if(!/^[a-f0-9]{32}$/i.test(accountId))throw Error('EPIC_ACCOUNT_ID must be a 32-character Epic account ID');
 if(!['EU','NAC','NAE','NAW','ASIA','OCE','BR','ME'].includes(region))throw Error('Invalid EPIC_REGION');
 if(!Number.isInteger(maxPages)||maxPages<1||maxPages>5||!Number.isInteger(maxWindows)||maxWindows<1||maxWindows>5)throw Error('Collection limits must be between 1 and 5');
 const warnings=[];
 const request=async(path,params,host=HOST)=>{
  const r=await fetcher(`${host}${path}?${new URLSearchParams(params)}`,{headers:{Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!r.ok){const error=Error(`Epic returned HTTP ${r.status}; verify token expiry, Fortnite scopes, and account access`);error.status=r.status;throw error;}
  return r.json();
 };
 const tournaments=normalizeTournaments(await request(`/api/v1/events/Fortnite/download/${accountId}`,{region,platform:'Windows',teamAccountIds:accountId}));
 const selected=selectWindows(tournaments,{windowId,eventId,now,limit:maxWindows});
 const standings=[];
 for(const t of selected){
  const players=new Map();let totalPages=null,pagesFetched=0;
  try{
   for(let page=0;page<maxPages;page++){
    const result=await request(`/api/v1/leaderboards/Fortnite/${encodeURIComponent(t.eventId)}/${encodeURIComponent(t.id)}/${accountId}`,{page,showLiveSessions:false,appId:'fortnite'});
    const rows=normalizePlayers(result);for(const row of rows)players.set(row.id,row);
    pagesFetched++;totalPages=Number.isInteger(result.totalPages)&&result.totalPages>=0?result.totalPages:null;
    if(!rows.length||totalPages===null||page+1>=totalPages)break;
   }
   standings.push({windowId:t.id,status:'ok',players:[...players.values()].sort((a,b)=>a.rank-b.rank),pagesFetched,totalPages});
  }catch(error){
   if(error.status===401||error.status===403||error.status===429)throw error;
   warnings.push(`Standings unavailable for ${t.id}`);
   standings.push({windowId:t.id,status:'unavailable',players:[],pagesFetched:0,totalPages:null});
  }
 }
 if(resolveNames){
  const ids=[...new Set(standings.flatMap(s=>s.players.flatMap(p=>p.accountIds)))];const names=new Map();
  for(let i=0;i<ids.length;i+=100){
   try{
    const accounts=await request('/account/api/public/account',ids.slice(i,i+100).map(id=>['accountId',id]),ACCOUNT_HOST);
    if(!Array.isArray(accounts))throw Error('Invalid account names response');
    for(const a of accounts)if(typeof a.id==='string'&&typeof a.displayName==='string')names.set(a.id,a.displayName);
   }catch{warnings.push('Some display names could not be resolved; account IDs are shown instead.');break;}
  }
  for(const s of standings)for(const p of s.players)p.name=p.accountIds.map(id=>names.get(id)||id).join(' / ');
 }
 const primary=standings.find(s=>s.status==='ok');
 const snapshot={schemaVersion:2,status:'ok',source:'Epic Games Events Service',updatedAt:now.toISOString(),windowId:primary?.windowId||null,region,tournaments,players:primary?.players||[],totalPages:primary?.totalPages??null,standings,warnings:[...new Set(warnings)],collection:{maxPages,maxWindows,selectedWindows:selected.length}};
 await mkdir(dirname(output),{recursive:true});await writeFile(`${output}.tmp`,JSON.stringify(snapshot,null,2)+'\n');await rename(`${output}.tmp`,output);return snapshot;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){sync({token:process.env.EPIC_ACCESS_TOKEN,accountId:process.env.EPIC_ACCOUNT_ID,region:process.env.EPIC_REGION||'EU',windowId:process.env.EPIC_EVENT_WINDOW_ID||''}).then(s=>console.log(`Published ${s.tournaments.length} Epic sessions and ${s.standings.length} standings snapshots (${s.warnings.length} warnings)`)).catch(e=>{console.error(e.message);process.exitCode=1;});}
