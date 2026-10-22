import {writeFile,rename} from 'node:fs/promises';
// Fetch only our own public Pages JSON. No authorization header is sent.
try {
 const response=await fetch('https://mufradr.github.io/fortnitestats/data/tournaments.json',{signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('No published snapshot');
 const data=await response.json();
 if(data.schemaVersion!==2||data.status!=='ok'||!Number.isFinite(Date.parse(data.updatedAt))||!Array.isArray(data.tournaments)||!Array.isArray(data.players))throw Error('No valid published data');
 await writeFile('data/tournaments.json.tmp',JSON.stringify(data,null,2)+'\n');
 await rename('data/tournaments.json.tmp','data/tournaments.json');
 console.log('Restored the last published snapshot; its original timestamp is preserved.');
}catch{console.log('No previous valid snapshot available; keeping the checked-in state.');}
