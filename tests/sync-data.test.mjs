import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sync,normalizeTournaments,normalizePlayers} from '../scripts/sync-data.mjs';
const accountId='a'.repeat(32);
const event={eventId:'epicgames_S34_PerformanceEvaluation_EU',regions:['EU'],eventWindows:[{eventWindowId:'S34_PerformanceEvaluation_Event1Round1_EU',eventTemplateId:'duos',beginTime:'2025-03-07T18:00:00Z',endTime:'2025-03-07T21:00:00Z',visibility:'public'}]};
const events={events:[event],templates:[{eventTemplateId:'duos',playlistId:'Playlist_Duos'}]};
const standings={entries:[{teamAccountIds:['b'.repeat(32)],rank:1,pointsEarned:352,score:1548398805990442,sessionHistory:[]}],totalPages:30};
test('normalizes Epic windows, template mode, and official points without using packed score',()=>{
 const [t]=normalizeTournaments(events);assert.equal(t.id,event.eventWindows[0].eventWindowId);assert.equal(t.playlist,'Playlist_Duos');
 const [p]=normalizePlayers(standings);assert.equal(p.points,352);assert.equal(p.rank,1);assert.equal(p.matches,0);
 assert.throws(()=>normalizeTournaments({tournaments:[]}));assert.throws(()=>normalizePlayers({entries:[{rank:1}]}));
});
test('direct Epic requests use scoped bearer auth and correct event/window paths',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'epic-test-'));const output=join(dir,'snapshot.json');const calls=[];
 try{await sync({token:'test-only',accountId,windowId:event.eventWindows[0].eventWindowId,output,fetcher:async(url,options)=>{calls.push(new URL(url));assert.equal(options.headers.Authorization,'Bearer test-only');return {ok:true,json:async()=>url.includes('/leaderboards/')?standings:events};}});
 const raw=await readFile(output,'utf8');assert.equal(raw.includes('test-only'),false);assert.equal(calls.length,2);assert.equal(calls[0].hostname,'events-public-service-live.ol.epicgames.com');assert.equal(calls[0].searchParams.get('region'),'EU');assert.equal(calls[1].searchParams.get('page'),'0');assert.equal(JSON.parse(raw).schemaVersion,2);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('expired auth leaves the previous snapshot untouched',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'epic-test-'));const output=join(dir,'snapshot.json');
 try{await writeFile(output,'previous');await assert.rejects(sync({token:'test-only',accountId,output,fetcher:async()=>({ok:false,status:401})}),/HTTP 401/);assert.equal(await readFile(output,'utf8'),'previous');}finally{await rm(dir,{recursive:true,force:true});}
});
test('missing authentication and unknown event windows fail clearly',async()=>{
 await assert.rejects(sync(),/EPIC_ACCESS_TOKEN/);
 await assert.rejects(sync({token:'test-only',accountId,windowId:'unknown',fetcher:async()=>({ok:true,json:async()=>events})}),/not in this region/);
});
