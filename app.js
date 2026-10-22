let snapshot={tournaments:[],players:[],windowId:null}, mode='all',descending=true;
let saved=[];try{saved=JSON.parse(localStorage.getItem('dropzone-event-ids')||'[]');if(!Array.isArray(saved))saved=[];}catch{}
const $=selector=>document.querySelector(selector);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const regionNames={EU:'Europe',NAC:'NA Central',NAE:'NA East',NAW:'NA West',ASIA:'Asia',OCE:'Oceania',BR:'Brazil',ME:'Middle East'};
function describe(t){
 const text=t.id+' '+t.eventId+' '+(t.playlist||'');
 const region=t.regions?.[0]||Object.keys(regionNames).find(r=>new RegExp(`(?:^|_)${r}(?:_|$)`,'i').test(text))||'Unknown';
 const mode=/solo/i.test(text)?'Solo':/duo/i.test(text)?'Duos':/squad/i.test(text)?'Squads':/trio/i.test(text)?'Trios':'Unspecified';
 const type=/performance.?eval|evaluation|(?:^|_)eval/i.test(text)?'eval':/division|(?:^|_)div\d*/i.test(text)?'division':'other';
 return {region,mode,type};
}
function renderEvents(){
 const visible=snapshot.tournaments.filter(t=>{const d=describe(t);return (mode==='all'||d.mode===mode)&&($('#region').value==='all'||d.region===$('#region').value)&&($('#event-type').value==='all'||d.type===$('#event-type').value);}).sort((a,b)=>Date.parse(b.start)-Date.parse(a.start));
 $('#event-grid').innerHTML=visible.map(t=>{const d=describe(t),start=new Date(t.start),end=new Date(t.end),now=Date.now();const state=now<start?'UPCOMING':now<=end?'IN PROGRESS':'COMPLETED';return `<article class="event ${d.type==='eval'?'lime':d.type==='division'?'purple':'blue'}"><div class="event-art"><span class="event-tag">${state}</span><span class="event-symbol" aria-hidden="true">✦</span><span class="sample">EPIC EVENTS · ${escape(d.type==='eval'?'EVAL CUP':d.type==='division'?'DIVISION CUP':'TOURNAMENT')}</span></div><div class="event-content"><p>${escape(regionNames[d.region]||d.region)} <span>• ${escape(d.mode)}</span></p><h3 class="event-title">${escape(t.eventId.replace(/^epicgames_/,'').replaceAll('_',' '))}</h3><p class="window-id">${escape(t.id)}</p><p>Official tournament session</p><button class="view-standings save" data-window="${escape(t.id)}">View standings →</button><div class="event-bottom"><time datetime="${escape(t.start)}">${escape(start.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',timeZoneName:'short'}))}</time><button class="save" data-event="${escape(t.id)}" aria-pressed="${saved.includes(t.id)}" aria-label="${saved.includes(t.id)?'Unsave':'Save'} ${escape(t.id)}">${saved.includes(t.id)?'✓ Saved':'+ Save'}</button></div></div></article>`;}).join('')||'<p class="empty">No sessions match these filters. The snapshot contains the event windows Epic returned for the configured region.</p>';
}
const fmt=(value,digits=0)=>value===null||value===undefined?'—':Number(value).toLocaleString(undefined,{maximumFractionDigits:digits});
function renderPlayers(){
 const query=$('#player-search').value.trim().toLowerCase();
 const selected=snapshot.standings?.find(s=>s.windowId===$('#session').value);
 const players=selected?.players||($('#session').value===snapshot.windowId?snapshot.players:[]);
 $('.metrics article:nth-child(2) strong').innerHTML=`${players.length} <small>TEAM STANDINGS</small>`;
 const ranked=[...players].sort((a,b)=>a.rank-b.rank);
 const visible=ranked.filter(p=>p.name.toLowerCase().includes(query)||p.id.toLowerCase().includes(query));if(!descending)visible.reverse();
 $('#player-rows').innerHTML=visible.map(p=>`<tr><td class="rank">${fmt(p.rank)}</td><td><span class="avatar">${escape(p.name.slice(0,2).toUpperCase())}</span><strong>${escape(p.name)}</strong></td><td>${fmt(p.matches)}</td><td class="wins">${fmt(p.points)}</td><td>${fmt(p.teamSize)}</td><td>${escape(p.id)}</td></tr>`).join('');
 $('#empty-players').hidden=visible.length>0;
 $('#empty-players').textContent=query?'No players match your search.':'No standings snapshot for this session. Select the published session, or configure its event window for the next refresh.';
 $('#sort-points').closest('th').setAttribute('aria-sort',descending?'descending':'ascending');
 $('#coverage').textContent=`Official Epic team standings · ${selected?.pagesFetched??1} page(s) fetched${selected?.totalPages!==null&&selected?.totalPages!==undefined?' of '+selected.totalPages:''}. Coverage is limited to collected pages. Unresolved names show account IDs. ${selected?.status==='unavailable'?'This session could not be refreshed.':''}`;
}
for(const id of ['#region','#event-type'])$(id).addEventListener('change',renderEvents);
$('#session').addEventListener('change',renderPlayers);
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderEvents();}));
$('#event-grid').addEventListener('click',e=>{const view=e.target.closest('[data-window]');if(view){$('#session').value=view.dataset.window;renderPlayers();$('#players').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});return;}const b=e.target.closest('[data-event]');if(!b)return;const id=b.dataset.event;saved=saved.includes(id)?saved.filter(n=>n!==id):[...saved,id];try{localStorage.setItem('dropzone-event-ids',JSON.stringify(saved));}catch{}renderEvents();[...document.querySelectorAll('[data-event]')].find(x=>x.dataset.event===id)?.focus();});
$('#player-search').addEventListener('input',renderPlayers);
$('#sort-points').addEventListener('click',e=>{descending=!descending;e.target.textContent=`Points ${descending?'↓':'↑'}`;renderPlayers();});
$('#lookup-form').addEventListener('submit',e=>{e.preventDefault();const name=$('#epic-name').value.trim();if(name)window.open(`https://fortnitetracker.com/profile/all/${encodeURIComponent(name)}`,'_blank','noopener,noreferrer');});
async function load(){
 try{
 const response=await fetch('./data/tournaments.json',{cache:'no-store'});if(!response.ok)throw Error('Data file unavailable');const data=await response.json();
 if(data.schemaVersion!==2||!Array.isArray(data.tournaments)||!Array.isArray(data.players))throw Error('Invalid data file');
 if(data.status!=='ok'){$('.notice').textContent='Data source not connected. Direct Epic authentication is required to publish tournament sessions and official standings. No sample results are displayed.';return;}
 if(!Number.isFinite(Date.parse(data.updatedAt)))throw Error('Invalid refresh date');
 snapshot=data;
 const stale=Date.now()-Date.parse(data.updatedAt)>3*3600000;
 $('.pill').textContent=stale?'● STALE SNAPSHOT':'● EPIC SNAPSHOT';
 $('.notice').textContent=`${stale?'Data is older than 3 hours. ':''}Epic Games Events Service · Updated ${new Date(data.updatedAt).toLocaleString()} · Tournament sessions for ${data.region||'configured region'}. Eval and Division Cups appear when returned by Epic. Not a live feed.`;
 $('.metrics article:nth-child(1) strong').innerHTML=`${data.tournaments.length} <small>IN THE SNAPSHOT</small>`;
 $('.metrics article:nth-child(2) strong').innerHTML=`${data.players.length} <small>TEAM STANDINGS</small>`;
 const sessions=[...new Set([data.windowId,...data.tournaments.map(t=>t.id)].filter(Boolean))];
 const available=new Set(data.standings?.filter(s=>s.status==='ok').map(s=>s.windowId)||[data.windowId]);
 $('#session').innerHTML='<option value="">Select a session</option>'+sessions.map(id=>`<option value="${escape(id)}">${escape(id)}${available.has(id)?' · standings available':''}</option>`).join('');
 if(data.windowId)$('#session').value=data.windowId;
 if(data.warnings?.length)$('.notice').textContent+=' Some data is incomplete; unavailable session standings and unresolved names are marked below.';
 }catch{$('.notice').textContent='Tournament data could not be loaded. Try again later. No invented results are shown.';$('.pill').textContent='● DATA UNAVAILABLE';}
 finally{renderEvents();renderPlayers();}
}
load();
