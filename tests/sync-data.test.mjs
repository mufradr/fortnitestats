import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {sync,normalizeTournaments,normalizePlayers} from '../scripts/sync-data.mjs';
const tournament={eventId:'epicgames_S34_PerformanceEvaluation_EU',eventWindowId:'S34_PerformanceEvaluation_Event1Round1_EU',startTime:1741370400,endTime:1741381200,totalMatches:20,parsingProgress:0.8};
test('normalizes provider fields without inventing wins or K/D',()=>{
 assert.equal(normalizeTournaments({tournaments:[tournament]})[0].start,'2025-03-07T18:00:00.000Z');
 const [p]=normalizePlayers({players:[{epicId:'abc',epicUsername:'Test',matchesPlayed:3,eliminations:7}]});
 assert.equal(p.damage,null);assert.equal(p.eliminations,7);assert.equal('wins' in p,false);
 assert.throws(()=>normalizeTournaments({events:[]}));
});
test('bounded authenticated fetches use documented paths and write a public snapshot',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dropzone-'));const output=join(dir,'snapshot.json');const requests=[];
 try{await sync({key:'test-only',windowId:tournament.eventWindowId,output,now:new Date('2025-03-08T00:00:00Z'),fetcher:async(url,options)=>{requests.push(new URL(url));assert.equal(options.headers.Authorization,'Bearer test-only');return {ok:true,json:async()=>url.includes('/stats?')?{players:[{epicId:'abc',eliminations:3}]}:{tournaments:[tournament]}};}});
 const raw=await readFile(output,'utf8');assert.equal(raw.includes('test-only'),false);assert.equal(requests.length,2);assert.equal(requests[0].pathname,'/fortnite/v1/tournaments');assert.equal(requests[1].searchParams.get('eventWindowId'),tournament.eventWindowId);assert.equal(JSON.parse(raw).players.length,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('missing key and provider failures cannot produce a success snapshot',async()=>{
 await assert.rejects(sync(),/OSIRION_API_KEY/);
 await assert.rejects(sync({key:'test-only',fetcher:async()=>({ok:false,status:401})}),/HTTP 401/);
});
