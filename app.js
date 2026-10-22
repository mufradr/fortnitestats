let snapshot={tournaments:[],players:[],windowId:null}, mode='all',descending=true;
let saved=[];try{saved=JSON.parse(localStorage.getItem('dropzone-event-ids')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
const $=selector=>document.querySelector(selector);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regionNames={EU:'Europe',NAC:'NA Central',NAE:'NA East',NAW:'NA West',ASIA:'Asia',OCE:'Oceania',BR:'Brazil',ME:'Middle East'};
function describe(t){
 const text=t.id+' '+t.eventId;
 const region=Object.keys(regionNames).find(r=>new RegExp(`(?:^|_)${r}(?:_|$)`,'i').test(text))||'Unknown';
 const mode=/solo/i.test(text)?'Solo':/duo/i.test(text)?'Duos':/squad/i.test(text)?'Squads':/trio/i.test(text)?'Trios':'Unspecified';
 const type=/performance.?eval|evaluation|(?:^|_)eval/i.test(text)?'eval':/division|(?:^|_)div\d*/i.test(text)?'division':'other';
 return {region,mode,type};
}
function renderEvents(){
 const visible=snapshot.tournaments.filter(t=>{const d=describe(t);return (mode==='all'||d.mode===mode)&&($('#region').value==='all'||d.region===$('#region').value)&&($('#event-type').value==='all'||d.type===$('#event-type').value);}).sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
 $('#event-grid').innerHTML=visible.map(t=>{const d=describe(t),start=new Date(t.start),end=new Date(t.end),now=Date.now();const state=now<start?'UPCOMING':now<=end?'IN PROGRESS':'COMPLETED';return `<article class="event ${d.type==='eval'?'lime':d.type==='division'?'purple':'blue'}"><div class="event-art"><span class="event-tag">${state}</span><span class="event-symbol" aria-hidden="true">✦</span><span class="sample">REPLAY INDEX · ${escape(d.type==='eval'?'EVAL CUP':d.type==='division'?'DIVISION CUP':'TOURNAMENT')}</span></div><div class="event-content"><p>${escape(regionNames[d.region]||d.region)} <span>• ${escape(d.mode)}</span></p><h3 class="event-title">${escape(t.eventId.replace(/^epicgames_/,'').replaceAll('_',' '))}</h3><p class="window-id">${escape(t.id)}</p><p>${t.matches??'—'} indexed matches</p><div class="event-bottom"><time datetime="${escape(t.start)}">${escape(start.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}))}</time><button class="save" data-event="${escape(t.id)}" aria-pressed="${saved.includes(t.id)}" aria-label="${saved.includes(t.id)?'Unsave':'Save'} ${escape(t.id)}">${saved.includes(t.id)?'✓ Saved':'+ Save'}</button></div></div></article>`;}).join('')||'<p class="empty">No indexed sessions match these filters. Coverage depends on available replays; this is not the complete Fortnite schedule.</p>';
}
const fmt=(value,digits=0)=>value===null||value===undefined?'—':Number(value).toLocaleString(undefined,{maximumFractionDigits:digits});
function renderPlayers(){
 const query=$('#player-search').value.trim().toLowerCase();
 const players=$('#session').value===snapshot.windowId?snapshot.players:[];
 const ranked=[...players].sort((a,b)=>(b.eliminations??-1)-(a.eliminations??-1));
 const visible=ranked.filter(p=>p.name.toLowerCase().includes(query)||p.id.toLowerCase().includes(query));if(!descending)visible.reverse();
 $('#player-rows').innerHTML=visible.map(p=>`<tr><td class="rank">${ranked.indexOf(p)+1}</td><td><span class="avatar">${escape(p.name.slice(0,2).toUpperCase())}</span><strong>${escape(p.name)}</strong></td><td>${fmt(p.matches)}</td><td class="wins">${fmt(p.eliminations)}</td><td>${fmt(p.avgPlacement,2)}</td><td>${fmt(p.damage)}</td></tr>`).join('');
 $('#empty-players').hidden=visible.length>0;
 $('#empty-players').textContent=query?'No players match your search.':'No player snapshot for this session. Select the published session, or configure its event window for the next data refresh.';
 $('#sort-eliminations').closest('th').setAttribute('aria-sort',descending?'descending':'ascending');
 $('#coverage').textContent='Replay-derived statistics, sorted by eliminations—not official points standings. Only matches parsed by Osirion are included; absent metrics appear as —.';
}
for(const id of ['#region','#event-type'])$(id).addEventListener('change',renderEvents);
$('#session').addEventListener('change',renderPlayers);
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderEvents();}));
$('#event-grid').addEventListener('click',e=>{const b=e.target.closest('[data-event]');if(!b)return;const id=b.dataset.event;saved=saved.includes(id)?saved.filter(n=>n!==id):[...saved,id];try{localStorage.setItem('dropzone-event-ids',JSON.stringify(saved));}catch{}renderEvents();[...document.querySelectorAll('[data-event]')].find(x=>x.dataset.event===id)?.focus();});
$('#player-search').addEventListener('input',renderPlayers);
$('#sort-eliminations').addEventListener('click',e=>{descending=!descending;e.target.textContent=`Eliminations ${descending?'↓':'↑'}`;renderPlayers();});
$('#lookup-form').addEventListener('submit',e=>{e.preventDefault();const name=$('#epic-name').value.trim();if(name)window.open(`https://fortnitetracker.com/profile/all/${encodeURIComponent(name)}`,'_blank','noopener,noreferrer');});
async function load(){
 try{
 const response=await fetch('./data/tournaments.json',{cache:'no-store'});if(!response.ok)throw Error('Data file unavailable');const data=await response.json();
 if(data.schemaVersion!==1||!Array.isArray(data.tournaments)||!Array.isArray(data.players))throw Error('Invalid data file');
 if(data.status!=='ok'){$('.notice').textContent='Data source not connected. An Osirion API key and credits are required to publish real tournament sessions. No sample results are displayed.';return;}
 if(!Number.isFinite(Date.parse(data.updatedAt)))throw Error('Invalid refresh date');
 snapshot=data;
 const stale=Date.now()-Date.parse(data.updatedAt)>3*3600000;
 $('.pill').textContent=stale?'● STALE SNAPSHOT':'● OSIRION SNAPSHOT';
 $('.notice').textContent=`${stale?'Data is older than 3 hours. ':''}Osirion replay index · Updated ${new Date(data.updatedAt).toLocaleString()} · Recent sessions, not a complete upcoming schedule. Eval and Division Cups appear when indexed. Not a live feed.`;
 $('.metrics article:nth-child(1) strong').innerHTML=`${data.tournaments.length} <small>IN THE SNAPSHOT</small>`;
 $('.metrics article:nth-child(2) strong').innerHTML=`${data.players.length} <small>REPLAY COVERAGE</small>`;
 const sessions=[...new Set([data.windowId,...data.tournaments.map(t=>t.id)].filter(Boolean))];
 $('#session').innerHTML='<option value="">Select a session</option>'+sessions.map(id=>`<option value="${escape(id)}">${escape(id)}${id===data.windowId?' · stats available':''}</option>`).join('');
 if(data.windowId)$('#session').value=data.windowId;
 }catch{$('.notice').textContent='Tournament data could not be loaded. Try again later. No invented results are shown.';$('.pill').textContent='● DATA UNAVAILABLE';}
 finally{renderEvents();renderPlayers();}
}
load();
