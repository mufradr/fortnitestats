const events = [
  {name:'Champion Series',mode:'Duos',region:'Europe',day:'FRI',time:'18:00 UTC',tag:'FINALS',theme:'purple'},
  {name:'Solo Victory Cup',mode:'Solo',region:'NA Central',day:'SAT',time:'22:00 UTC',tag:'OPEN',theme:'lime'},
  {name:'Reload Rally',mode:'Squads',region:'Europe',day:'SUN',time:'17:00 UTC',tag:'OPEN',theme:'blue'},
  {name:'Challenger Cup',mode:'Duos',region:'Asia',day:'FRI',time:'10:00 UTC',tag:'QUALIFIER',theme:'blue'},
  {name:'Late Night Trials',mode:'Solo',region:'Europe',day:'SAT',time:'20:00 UTC',tag:'OPEN',theme:'purple'},
  {name:'Squad Showdown',mode:'Squads',region:'NA Central',day:'SUN',time:'21:00 UTC',tag:'INVITATIONAL',theme:'lime'}
];
const players = [
  {name:'NovaPulse',region:'Europe',wins:248,kd:6.42,rate:28.4},
  {name:'ZeroBloom',region:'NA Central',wins:231,kd:5.91,rate:26.1},
  {name:'VortexAce',region:'Europe',wins:219,kd:5.83,rate:24.8},
  {name:'EchoDrift',region:'Asia',wins:204,kd:5.61,rate:23.6},
  {name:'LunarRush',region:'NA Central',wins:192,kd:5.32,rate:22.9},
  {name:'OrbitWave',region:'Europe',wins:186,kd:5.14,rate:21.5},
  {name:'FrostByte',region:'Asia',wins:173,kd:4.98,rate:20.7},
  {name:'SolarDash',region:'Europe',wins:165,kd:4.76,rate:19.8}
];
let mode='all', descending=true;
const region=document.querySelector('#region');
function renderEvents(){
 const visible=events.filter(e=>(mode==='all'||e.mode===mode)&&(region.value==='all'||e.region===region.value));
 document.querySelector('#event-grid').innerHTML=visible.map(e=>`<article class="event ${e.theme}"><div class="event-art"><span class="event-tag">${e.tag}</span><span class="event-symbol" aria-hidden="true">${e.mode==='Solo'?'◈':e.mode==='Duos'?'⟐':'✦'}</span><span class="sample">SAMPLE EVENT</span></div><div class="event-content"><p>${e.region} <span>• ${e.mode}</span></p><h3>${e.name}</h3><div class="event-bottom"><span>${e.day} <b>${e.time}</b></span><button class="save" data-event="${e.name}" aria-pressed="${saved.includes(e.name)}" aria-label="${saved.includes(e.name)?'Unsave':'Save'} ${e.name}">${saved.includes(e.name)?'✓ Saved':'+ Save'}</button></div></div></article>`).join('')||'<p class="empty">No sample events for this region and mode. Try another filter.</p>';
}
let saved=[];try{saved=JSON.parse(localStorage.getItem('dropzone-events')||'[]');if(!Array.isArray(saved))saved=[];}catch{saved=[];}
region.addEventListener('change',renderEvents);
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderEvents();}));
document.querySelector('#event-grid').addEventListener('click',e=>{const button=e.target.closest('[data-event]');if(!button)return;const name=button.dataset.event;saved=saved.includes(name)?saved.filter(n=>n!==name):[...saved,name];try{localStorage.setItem('dropzone-events',JSON.stringify(saved));}catch{}renderEvents();const replacement=[...document.querySelectorAll('[data-event]')].find(b=>b.dataset.event===name);replacement?.focus();});
function renderPlayers(){const query=document.querySelector('#player-search').value.trim().toLowerCase();const ranked=[...players].sort((a,b)=>b.wins-a.wins);const visible=ranked.filter(p=>p.name.toLowerCase().includes(query)).sort((a,b)=>descending?b.wins-a.wins:a.wins-b.wins);document.querySelector('#player-rows').innerHTML=visible.map(p=>`<tr><td class="rank">${String(ranked.indexOf(p)+1).padStart(2,'0')}</td><td><span class="avatar">${p.name.slice(0,2).toUpperCase()}</span><strong>${p.name}</strong></td><td>${p.region}</td><td class="wins">${p.wins}</td><td>${p.kd.toFixed(2)}</td><td>${p.rate.toFixed(1)}%</td></tr>`).join('');document.querySelector('#empty-players').hidden=visible.length>0;document.querySelector('#sort-wins').closest('th').setAttribute('aria-sort',descending?'descending':'ascending');}
document.querySelector('#player-search').addEventListener('input',renderPlayers);
document.querySelector('#sort-wins').addEventListener('click',e=>{descending=!descending;e.target.textContent=`Wins ${descending?'↓':'↑'}`;renderPlayers();});
document.querySelector('#lookup-form').addEventListener('submit',e=>{e.preventDefault();const name=document.querySelector('#epic-name').value.trim();if(name)window.open(`https://fortnitetracker.com/profile/all/${encodeURIComponent(name)}`,'_blank','noopener,noreferrer');});
renderEvents();renderPlayers();
