/* =========================================================
   Constants & helpers
   ========================================================= */
const SEAS = ['Spring','Summer','Fall','Winter'];
const SEAS2 = ['Sp','Su','Fa','Wi'];
const SC = ['sp','su','fa','wi'];
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const DOWL = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const KEY = 'reefledger.v1';
const CATS = [['fish','Fish'],['insects','Insects'],['critters','Ocean critters'],['fossils','Fossils'],['artifacts','Artifacts'],['gems','Gems']];
const TOOLS = ['Hoe','Axe','Pickaxe','Scythe','Watering can','Fishing pole','Bug net','Lumina wand'];
const TIERS = ['Basic','Bronze','Silver','Gold','Osmium'];
const SKILLS = ['Farming','Ranching','Mining','Foraging','Catching','Fishing','Diving','Combat'];
const RANKS = ['F','E','D','C','B','A','S'];
const ALTARS = ['Essentials & seasons','Fish, insects & critters','Animals & cooking','Rare goods','Guardian offerings'];
const ROUTINE = [
  ['water','Water your crops'],
  ['animals','Feed and pet your animals, collect their products'],
  ['machines','Collect from and refill your machines'],
  ['chat','Chat with a few villagers (friendship points)'],
  ['mail','Check your mail and errands'],
  ['forage','Forage a little on your walk']
];
const FESTIVALS = [
  {s:0,a:10,b:10,n:'Cherry Blossom Potluck',time:'09:00–14:00',where:'Alun-Alun Square',note:'Potluck: 300 town points for winning, 40 for attending.'},
  {s:0,a:21,b:21,n:'Tree Planting Festival',time:'08:00–14:00',where:'Near the Ranch',note:'Plant trees (up to 3 times) for town points and friendship with every townie.'},
  {s:1,a:12,b:12,n:'Animal Festival',time:'09:00–14:00',where:'Starlet Town',note:'Pet Race: 300 town points for winning, 40 for attending. Side events: chicken, cow, rodeo (100 each).'},
  {s:1,a:27,b:27,n:'Beach Cleanup Day',time:'09:00–14:00',where:'Beach',note:'40 town points for attending. Side events: swimming contest, tug of war (100 each).'},
  {s:2,a:15,b:15,n:'Harvest Festival',time:'19:00–22:00',where:'Alun-Alun Square',note:'Harvest Display: 300 town points for winning, 40 for attending. Side: apple bobbing, smashing pumpkin.'},
  {s:2,a:28,b:28,n:'Spooky Day Festival',time:'19:00–22:00',where:'Starlet Town',note:'Ogoh-Ogoh parade, 40 town points for attending. Side: bonk the skeleton, ring toss, scavenger hunt.'},
  {s:3,a:17,b:21,n:'Winter Fair',time:'18:00–late',where:'Beach',note:'Five evenings of side events: curling, magnet fishing, match pattern, shooting, trivia (100 each). 40 points for attending.'},
  {s:3,a:28,b:28,n:'New Year Eve Feast',time:'19:00–22:00',where:'Vineyard',note:'Watch the fireworks (40 town points). Side: Don’t Drop Balloon, Lucky Wheel.'}
];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (n,a,b) => Math.max(a, Math.min(b, n));
const pct = (a,b) => b ? Math.round(100*a/b) : 0;
const short = (s,n=64) => { s = String(s||''); return s.length > n ? s.slice(0,n-1).trimEnd()+'…' : s; };
const plural = (n,w) => n + ' ' + w + (n===1 ? '' : 's');
const ICONS = {
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  museum:'<path d="M3 12c3-5 8-6 12-3l6-3v12l-6-3c-4 3-9 2-12-3z"/><circle cx="9" cy="11" r=".6"/>',
  people:'<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z"/>',
  more:'<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  offerings:'<path d="M4 19c0-6 3-11 8-14 5 3 8 8 8 14z"/><path d="M12 5v14M8 8.5c-1 3-1.5 6-1.5 10.5M16 8.5c1 3 1.5 6 1.5 10.5"/>',
  recipes:'<path d="M4 11h16v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM2 11h20M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>',
  quests:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  farm:'<path d="M12 21v-9M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
  progress:'<path d="M4 20V11M10 20V4M16 20v-6M22 20H2"/>',
  data:'<path d="M4 6h9M19 6h1M4 12h3M13 12h7M4 18h11M21 18h-1"/><circle cx="16" cy="6" r="2.2"/><circle cx="10" cy="12" r="2.2"/><circle cx="17.5" cy="18" r="2.2"/>',
  tips:'<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v8h14v-8M12 8c-2-4-6-3-5 0 .5 1.5 3 1 5 0zM12 8c2-4 6-3 5 0-.5 1.5-3 1-5 0z"/>',
  bug:'<path d="M12 8c-3 0-5 2-5 5s2 6 5 6 5-3 5-6-2-5-5-5zM12 8V5M9 5l1 2M15 5l-1 2M7 12H4M17 12h3M7.5 16L5 18M16.5 16l2.5 2"/>',
  gem:'<path d="M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l-2 5 5 11M15 4l2 5-5 11"/>',
  bone:'<path d="M6 6l12 12M4.5 7.5a2 2 0 1 1 3-3M7.5 4.5a2 2 0 1 1 0 0M16.5 19.5a2 2 0 1 0 3-3M19.5 16.5a2 2 0 1 0 0 0"/>',
  scroll:'<path d="M8 4h10v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V4zM8 4H6a2 2 0 0 0-2 2v1h4"/>',
  route:'<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6"/>',
  guide:'<path d="M3 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H3zM21 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z"/>',
  planner:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 12l3 3 5-6"/>'
};
const svg = n => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||''}</svg>`;

/* dates: 4 seasons x 28 days, day 1 is always a Monday */
const absDay = d => ((d.y-1)*4 + d.s)*28 + (d.d-1);
const fromAbs = n => ({y:Math.floor(n/112)+1, s:Math.floor((n%112)/28), d:(n%28)+1});
const addDays = (d,n) => fromAbs(Math.max(0, absDay(d)+n));
const fmt = d => `${SEAS[d.s]} ${d.d}`;
const fmtY = d => `${SEAS[d.s]} ${d.d}, Year ${d.y}`;
const dowOf = d => (d-1)%7;
const untilBirthday = b => { const t = absDay(S.date)%112, x = b[0]*28+b[1]-1; return (x - t + 112) % 112; };

/* =========================================================
   State + persistence (everything stays on this device)
   ========================================================= */
const def = () => ({v:1, ts:0, date:{y:1,s:3,d:28},
  done:{fish:{},insects:{},critters:{},fossils:{},artifacts:{},gems:{},recipes:{},quests:{}},
  off:{}, ship:{}, hearts:{}, rel:{}, fav:{}, tools:{}, skills:{}, rank:{r:'F',pts:0}, daily:{k:'',done:{}}, todos:[], notes:'', time:'Morning', weather:'Sunny', recent:[]});
const migrate = r => { const b = def(); const o = Object.assign(b, r||{}); Object.keys(b.done).forEach(k => o.done[k] = Object.assign({}, b.done[k], (r&&r.done&&r.done[k])||{})); o.date = Object.assign(b.date, (r&&r.date)||{}); o.rank = Object.assign(b.rank, (r&&r.rank)||{}); o.daily = Object.assign(b.daily, (r&&r.daily)||{}); if(!Array.isArray(o.todos)) o.todos = []; if(!Array.isArray(o.recent)) o.recent = []; if(!o.ship || typeof o.ship !== 'object') o.ship = {};
  // favourites are stored as 'category:id'; older saves stored a bare villager id
  const fav = {}; Object.keys(o.fav||{}).forEach(k => { fav[k.includes(':') ? k : 'people:' + k] = 1; }); o.fav = fav; return o; };
let S;
try { S = migrate(JSON.parse(localStorage.getItem(KEY)||'null')); } catch(e){ S = def(); }

const PREF = 'reefledger.prefs';
let prefs = {theme:'auto'};
try { prefs = Object.assign(prefs, JSON.parse(localStorage.getItem(PREF)||'{}')); } catch(e){}
function applyTheme(){
  const r = document.documentElement;
  if(prefs.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', prefs.theme);
}
function savePrefs(){ try { localStorage.setItem(PREF, JSON.stringify(prefs)); } catch(e){} }
let saveFailed = false;
function persist(){
  S.ts = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); saveFailed = false; }
  catch(e){ if(!saveFailed){ saveFailed = true; toast('Could not save on this device. Export a backup from Settings.'); } }
}
// another tab or window of the app saved something: pick it up
window.addEventListener('storage', e => { if(e.key === KEY && e.newValue){ try { S = migrate(JSON.parse(e.newValue)); render(); } catch(x){} } });

/* =========================================================
   UI state (not persisted)
   ========================================================= */
const ui = {route:'today', cat:'fish', q:'', missing:false, season:false, time:'any', open:{}, calS:null, calD:null, pf:'all', ps:'birthday', off:0, rq:'', rm:'All', rmissing:false, qg:'All', qmissing:false, cropS:null, gc:'crops', gf:'All', gs:false, gmore:false, shipExp:{}, shipAll:{}, sq:'', shipMiss:false, tipShift:0, tc:'All', installEvt:null, sort:'game', now:false, pt:'overview', pexp:{}, pq:'', gq:'', gv:''};
const TIMES = ['Morning','Afternoon','Evening','Night'];
const timeOk = it => timeMatch(it, ui.time);

/* =========================================================
   Data helpers
   ========================================================= */
const items = c => D[c];
const cnt = c => D[c].filter(i => S.done[c][i.id]).length;
const museumTotal = () => CATS.reduce((a,[c]) => a + cnt(c), 0);
const museumMax = () => CATS.reduce((a,[c]) => a + D[c].length, 0);
const offCount = o => Object.keys(S.off[o.id]||{}).filter(k => S.off[o.id][k]).length;
const offDone = o => offCount(o) >= o.need;
const heartsOf = v => S.hearts[v.id] || 0;
const bdayOn = (s,d) => D.villagers.filter(v => v.b && v.b[0]===s && v.b[1]===d);
const festOn = (s,d) => FESTIVALS.filter(f => f.s===s && d>=f.a && d<=f.b);
const dateOf = d => d.b ? `${SEAS[d.b[0]]} ${d.b[1]}` : 'Unknown';
const growDays = c => parseInt(c.g) || 99;
const regrow = c => { const m = /(\d+) days? \(regrowth\)/.exec(c.g); return m ? +m[1] : 0; };
const rarRank = r => /very|legend/i.test(r||'') ? 3 : /rare/i.test(r||'') ? 2 : /uncommon/i.test(r||'') ? 1 : 0;

function seasonChips(it){
  return '<span class="sc" title="Seasons">' + it.s.map((v,i) => `<b class="${SC[i]} ${v===1?'on':v===2?'part':''} ${i===S.date.s?'cur':''}">${SEAS2[i]}</b>`).join('') + '</span>';
}
function bar(a,b,cls=''){ return `<div class="bar ${cls}" role="progressbar" aria-valuenow="${a}" aria-valuemax="${b}"><i style="width:${pct(a,b)}%"></i></div>`; }

/* collectible availability */
const CRIT3 = ['fish','insects','critters'];
function missingSeason(s, fromNext){
  const nx = (s+1)%4, out = [];
  CRIT3.forEach(c => D[c].forEach(it => {
    if(S.done[c][it.id]) return;
    out.push({c, it, now: it.s[s]>0, leaving: it.s[s]>0 && it.s[nx]===0, arriving: it.s[s]===0 && it.s[nx]>0, n: it.s.filter(Boolean).length});
  }));
  return out;
}
const byScarce = (a,b) => a.n-b.n || rarRank(b.it.r)-rarRank(a.it.r) || b.it.p-a.it.p;

/* =========================================================
   Views
   ========================================================= */
const NAV = [['today','Today'],['planner','Planner'],['guide','Field Guide'],['progress','Progress'],['data','Settings']];
const TAB_OF = r => ({today:'today', planner:'planner', calendar:'planner', progress:'progress', data:'data', guide:'guide'})[r] || 'guide';
const SUBPAGES = ['catalog','museum','people','offerings','recipes','quests','farm','tips','gifts','crops','route'];

function renderChrome(){
  const cur = TAB_OF(ui.route);
  $('#rail').innerHTML = `<div class="brand">${svg('offerings')}Reef Ledger</div>` + NAV.map(([k,l]) => `<button data-act="nav" data-to="${k}" ${cur===k?'aria-current="page"':''}>${svg(k)}${l}</button>`).join('');
  $('#tabbar').innerHTML = NAV.map(([k,l]) => `<button class="${k==='guide'?'mid':''}" data-act="nav" data-to="${k}" ${cur===k?'aria-current="page"':''}><span class="ic">${svg(k)}</span><span>${k==='guide'?'Guide':l}</span></button>`).join('');
  $('#datepill').innerHTML = ctxHtml();
  $('#ctx').innerHTML = ctxHtml();
  $('#install').hidden = !ui.installEvt;
}

/* ---------- TODAY ---------- */
function todayView(){
  const d = S.date, s = d.s, nx = (s+1)%4, left = 28 - d.d, dow = dowOf(d.d);
  const fest = festOn(s,d.d), bd = bdayOn(s,d.d);
  const tomorrow = addDays(d,1);
  if(S.daily.k !== `${d.y}-${s}-${d.d}`){ S.daily = {k:`${d.y}-${s}-${d.d}`, done:{}}; }
  const lastDay = left === 0;
  let h = '';

  /* hero */
  h += `<section class="hero">
    <h1 class="when">${SEAS[s]} <span>${d.d}</span></h1>
    <p class="sub">${DOWL[dow]} · Year ${d.y} · ${lastDay ? (s===3 ? 'last day of the year' : 'last day of '+SEAS[s]) : plural(left,'day')+' left in '+SEAS[s]}</p>
    <div class="acts"><button class="btn pri" data-act="next">Sleep → ${fmt(tomorrow)}</button><button class="btn" data-act="nav" data-to="route">Today’s route</button></div>
  </section>`;

  /* banners */
  fest.forEach(f => {
    h += `<div class="banner"><div><div class="t"><b>${esc(f.n)}</b> · ${esc(f.time)} · ${esc(f.where)}</div><div class="small">${esc(f.note)}</div></div></div>`;
  });
  if(lastDay && s===3) h += `<div class="banner teal"><div><div class="t"><b>Tomorrow is Spring 1, Year ${d.y+1}.</b></div><div class="small">A new season starts: seeds, fish and insects all change. Use today to finish anything that only exists in Winter.</div></div></div>`;
  else if(lastDay) h += `<div class="banner teal"><div><div class="t"><b>Last day of ${SEAS[s]}.</b></div><div class="small">Tomorrow it is ${SEAS[nx]} — see “Last chance” below for what leaves with the season.</div></div></div>`;
  bd.forEach(v => {
    h += `<div class="banner sun"><div><div class="t"><b>${esc(v.n)}’s birthday</b></div><div class="small">Gift something they love: ${esc(v.loved.slice(0,5).join(', ')||'see People')}. Birthday gifts are worth much more.</div></div></div>`;
  });

  /* tips of the day */
  const ctx = {s, d:d.d, y:d.y, left, date:d, abs:absDay(d)};
  const tipRow = (t, now) => `<li class="row tip"><div class="body"><div class="ttl"><span class="tag ${now?'coral':''}">${esc(t.c)}</span></div><div class="tx">${esc(t.t)}</div></div></li>`;
  h += `<section><div class="h-row"><h2>Tips of the day</h2><span class="aside"><button class="link" data-act="tipmore">Another set</button> · <button class="link" data-act="nav" data-to="tips">All tips</button></span></div><ul class="list">` +
    contextTips(ctx).slice(0,2).map(t => tipRow(t,true)).join('') + dailyTips(ctx, ui.tipShift).map(t => tipRow(t,false)).join('') + `</ul></section>`;

  /* routine */
  const rdone = ROUTINE.filter(([k]) => S.daily.done[k]).length;
  h += `<section><div class="h-row"><h2>Daily routine</h2><span class="aside num">${rdone}/${ROUTINE.length}</span></div><ul class="list">` +
    ROUTINE.map(([k,t]) => `<li class="row ${S.daily.done[k]?'done':''}"><button class="chk" data-act="rt" data-k="${k}" aria-pressed="${!!S.daily.done[k]}" aria-label="${esc(t)}"></button><div class="body"><div class="ttl">${esc(t)}</div></div></li>`).join('') +
    `</ul></section>`;

  /* right now (uses the time and weather from the context bar) */
  const nowList = missingSeason(s).filter(x => x.now && nowOk(x.it)).sort(byScarce);
  h += `<section><div class="h-row"><h2>Biting right now</h2><span class="aside">${S.time} · ${WX_LABEL[S.weather]}</span></div>`;
  if(nowList.length) h += `<ul class="list">${nowList.slice(0,6).map(x => `<li class="row"><div class="body"><div class="ttl">${esc(x.it.n)} <span class="tag">${x.c==='critters'?'critter':x.c.slice(0,-1)}</span>${x.leaving?' <span class="tag coral">last chance</span>':''}</div><div class="sub">${esc(short(x.it.w,90))}</div></div></li>`).join('')}</ul><p class="small muted">${nowList.length>6?'+'+(nowList.length-6)+' more · ':''}<button class="link" data-act="nav" data-to="route">Open today’s route</button></p>`;
  else h += `<div class="empty">Nothing you are missing bites at this time and weather. Change them in the bar below, or open today’s route.</div>`;
  h += `</section>`;

  /* collectibles */
  const M = missingSeason(s);
  const leaving = M.filter(x => x.leaving).sort(byScarce);
  const now = M.filter(x => x.now).sort(byScarce);
  const arriving = M.filter(x => x.arriving).sort(byScarce);
  const row = x => `<li class="row"><div class="body"><div class="ttl">${esc(x.it.n)} <span class="tag">${x.c==='critters'?'critter':x.c.slice(0,-1)}</span> ${seasonChips(x.it)}</div><div class="sub">${esc(short(x.it.w,90))}${x.it.t?' · '+esc(x.it.t):''}</div></div></li>`;
  const see = (c,f,label) => `<button class="link" data-act="goto" data-to="museum" data-cat="${c}" data-f="${f}">${label}</button>`;
  if(left <= 7 && leaving.length){
    h += `<section><div class="h-row"><h2>Last chance this season</h2><span class="aside">${leaving.length} missing · gone in ${SEAS[nx]}</span></div><ul class="list">${leaving.slice(0,lastDay?14:8).map(row).join('')}</ul>${leaving.length>(lastDay?14:8)?`<p class="small muted">+${leaving.length-(lastDay?14:8)} more · ${see('fish','season','open Museum, in season only')}</p>`:''}</section>`;
  }
  h += `<section><div class="h-row"><h2>Catch & collect now</h2><span class="aside">${now.length} still missing in ${SEAS[s]}</span></div>`;
  if(!now.length) h += `<div class="empty">Nothing missing for ${SEAS[s]} — every fish, insect and critter available this season is donated.</div>`;
  else h += `<ul class="list">${now.filter(x => !(left<=7 && x.leaving)).slice(0,8).map(row).join('') || '<li class="row"><div class="body muted">Everything left is in “Last chance” above.</div></li>'}</ul><p class="small muted">Rarest first. ${see('fish','season','See the full in-season list')}</p>`;
  const art = D.artifacts.length - cnt('artifacts'), fos = D.fossils.length - cnt('fossils'), gem = D.gems.length - cnt('gems');
  const dig = [];
  if(art) dig.push(`${art} artifacts (till soil or sand, fish for coffers)`);
  if(fos) dig.push(`${fos} fossils (till soil, break rocks)`);
  if(gem) dig.push(`${gem} gems (geodes and mine nodes)`);
  if(dig.length) h += `<p class="small muted" style="margin-top:8px">Also missing: ${dig.join('; ')}.</p>`;
  h += `</section>`;
  if(left <= 7 && arriving.length){
    h += `<section><div class="h-row"><h2>Arriving in ${SEAS[nx]}</h2><span class="aside">${arriving.length} missing</span></div><ul class="list">${arriving.slice(0,6).map(row).join('')}</ul></section>`;
  }

  /* people */
  const soon = D.villagers.filter(v => v.b).map(v => ({v, n: untilBirthday(v.b)})).filter(x => x.n>=1 && x.n<=7).sort((a,b)=>a.n-b.n);
  const favs = D.villagers.filter(v => isFav('people', v.id)).sort((a,b) => heartsOf(a)-heartsOf(b)).slice(0,5);
  let pr = '';
  soon.forEach(({v,n}) => pr += `<li class="row"><div class="body"><div class="ttl">${esc(v.n)}’s birthday in ${plural(n,'day')} <span class="tag sun">${dateOf(v)}</span></div><div class="sub">Loves: ${esc(v.loved.slice(0,4).join(', ')||'—')}</div></div></li>`);
  favs.forEach(v => pr += `<li class="row"><div class="body"><div class="ttl">Chat with ${esc(v.n)} <span class="tag">♥ ${heartsOf(v)}</span></div><div class="sub">Gift idea: ${esc(v.loved.slice(0,3).join(', ')||'—')}</div></div></li>`);
  h += `<section><div class="h-row"><h2>People</h2><span class="aside"><button class="link" data-act="nav" data-to="people">Open People</button></span></div>` +
    (pr ? `<ul class="list">${pr}</ul>` : `<div class="empty">No birthdays this week. Star villagers in People to get a daily chat reminder with a gift idea.</div>`) + `</section>`;

  /* farm */
  const inS = D.crops.filter(c => c.k === 'Crop' && c.s[s]);
  const plantable = inS.filter(c => growDays(c) <= left).sort((a,b) => b.ppd - a.ppd);
  const nextCrops = D.crops.filter(c => c.k === 'Crop' && c.s[nx]).sort((a,b) => b.ppd - a.ppd);
  h += `<section><div class="h-row"><h2>Farm & shopping</h2><span class="aside"><button class="link" data-act="nav" data-to="farm">Crop guide</button></span></div>`;
  if(plantable.length) h += `<ul class="list">${plantable.slice(0,5).map(c => `<li class="row"><div class="body"><div class="ttl">Plant ${esc(c.n)} <span class="tag kelp">ready ${fmt(addDays(d,growDays(c)))}</span></div><div class="sub">${esc(c.g)} · seed ${c.seed} · sells ${c.p}</div></div></li>`).join('')}</ul><p class="small muted">Only crops that finish before ${SEAS[s]} ends, best profit per day first.</p>`;
  else h += `<div class="empty">Nothing planted today would ripen before ${SEAS[s]} ends. ${left<=7?`Plan for ${SEAS[nx]}: buy seeds at Sam’s General Store and plant on day 1.`:''}</div>`;
  if(left <= 7 && nextCrops.length) h += `<h3 class="grp" style="margin-top:12px;padding-inline:0;background:none">Best ${SEAS[nx]} crops to buy</h3><ul class="list">${nextCrops.slice(0,5).map(c => `<li class="row"><div class="body"><div class="ttl">${esc(c.n)} <span class="tag">${esc(c.t)}</span></div><div class="sub">${esc(c.g)} · seed ${c.seed} · sells ${c.p}</div></div></li>`).join('')}</ul>`;
  h += `</section>`;

  /* offerings */
  const sesajen = D.offerings.find(o => o.n === SEAS[s]+' Sesajen');
  const nextSes = D.offerings.find(o => o.n === SEAS[nx]+' Sesajen');
  let oh = '';
  if(sesajen && !offDone(sesajen)) oh += `<li class="row"><div class="body"><div class="ttl">${esc(sesajen.n)} <span class="tag coral">${offCount(sesajen)}/${sesajen.need}</span></div><div class="sub">${esc(sesajen.items.map(i=>i.n).join(', '))}</div></div></li>`;
  if(left<=7 && nextSes && !offDone(nextSes)) oh += `<li class="row"><div class="body"><div class="ttl">${esc(nextSes.n)} <span class="tag">next season</span></div><div class="sub">${esc(nextSes.items.map(i=>i.n).join(', '))}</div></div></li>`;
  if(oh) h += `<section><div class="h-row"><h2>Seasonal offerings</h2><span class="aside"><button class="link" data-act="nav" data-to="offerings">Open Offerings</button></span></div><ul class="list">${oh}</ul></section>`;

  /* coming up */
  let up = '';
  for(let i=1;i<=7;i++){
    const dd = addDays(d,i), ev = [];
    festOn(dd.s,dd.d).forEach(f => ev.push(`<b>${esc(f.n)}</b> ${esc(f.time)}`));
    bdayOn(dd.s,dd.d).forEach(v => ev.push(`${esc(v.n)}’s birthday`));
    if(ev.length) up += `<li class="row"><div class="body"><div class="ttl">${fmt(dd)} <span class="muted small">${DOW[dowOf(dd.d)]}${dd.y!==d.y?' · Y'+dd.y:''}</span></div><div class="sub">${ev.join(' · ')}</div></div></li>`;
  }
  h += `<section><div class="h-row"><h2>Coming up</h2><span class="aside">next 7 days</span></div>${up?`<ul class="list">${up}</ul>`:'<div class="empty">A quiet week — no festivals or birthdays.</div>'}</section>`;

  /* goals within reach */
  let g = '';
  const tot = museumTotal();
  const nextM = D.museumMilestones.find(m => m.n > tot);
  if(nextM) g += `<li class="row"><div class="body"><div class="ttl">Museum: ${nextM.n-tot} more ${nextM.n-tot===1?'donation':'donations'} → ${esc(nextM.r||'milestone')}</div><div class="sub">${tot}/${nextM.n} donated</div></div></li>`;
  collections().filter(c => c.have < c.need && c.need-c.have <= 5).forEach(c => g += `<li class="row"><div class="body"><div class="ttl">${esc(c.n)}: ${c.need-c.have} to go</div><div class="sub">${c.have}/${c.need}${c.r?' · reward: '+esc(c.r):''}</div></div></li>`);
  D.offerings.filter(o => !offDone(o) && offCount(o) >= o.need-1 && offCount(o)>0).slice(0,3).forEach(o => g += `<li class="row"><div class="body"><div class="ttl">${esc(o.n)}: one item left</div><div class="sub">${offCount(o)}/${o.need}</div></div></li>`);
  if(g) h += `<section><div class="h-row"><h2>Almost there</h2></div><ul class="list">${g}</ul></section>`;

  h += favoritesSection() + recentSection();
  return h;
}

/* museum collections progress (also used on Progress + Today) */
function collections(){
  const catOf = {'Fossil Collection':'fossils','Insect Collection':'insects','Fish Collection':'fish','Critters Collection':'critters','Artifact Collection':'artifacts','Gem Collection':'gems'};
  return D.museumCollections.map(c => {
    let have = 0, need = c.need;
    if(catOf[c.n]){ have = cnt(catOf[c.n]); need = D[catOf[c.n]].length; }
    else if(c.n === 'Sharks Collection') have = ['great-white-shark','raja-ampat-shark','hammerhead'].filter(id => S.done.fish[id]).length;
    else if(/^(Wind|Water|Earth|Fire) Gem$/.test(c.n)){ const g = c.n.split(' ')[0]; const list = D.gems.filter(x => x.g === g); have = list.filter(x => S.done.gems[x.id]).length; need = list.length; }
    else if(c.n === 'Vintage Artifact') have = ['c-i-jo','cassete-player','dumbphone','vinyl-record','water-bottle'].filter(id => S.done.artifacts[id]).length;
    return {n:c.n, have, need, r:c.r};
  });
}

/* ---------- CALENDAR ---------- */
function calendarView(){
  const s = ui.calS ?? S.date.s;
  const sel = ui.calD;
  let h = `<section><div class="h-row"><h2>Calendar</h2></div><div class="tabs">${SEAS.map((n,i) => `<button class="chip" data-act="cals" data-s="${i}" aria-pressed="${i===s}">${n}</button>`).join('')}</div></section>`;
  h += `<section><div class="cal" role="grid">${DOW.map(d => `<div class="dh">${d}</div>`).join('')}`;
  for(let d=1; d<=28; d++){
    const f = festOn(s,d), b = bdayOn(s,d);
    const isToday = S.date.s===s && S.date.d===d;
    h += `<button class="cell ${isToday?'today':''} ${sel===d?'sel':''}" data-act="cald" data-d="${d}" aria-label="${SEAS[s]} ${d}">
      <span class="d">${d}</span>
      <span class="dots">${f.map(()=>'<i class="f"></i>').join('')}${b.map(()=>'<i></i>').join('')}</span>
      ${f.map(x => `<span class="nm" style="color:var(--coral);font-weight:700">${esc(short(x.n,18))}</span>`).join('')}${b.map(v => `<span class="nm">${esc(v.n)}</span>`).join('')}
    </button>`;
  }
  h += `</div><p class="legend" style="margin-top:10px"><span><i class="f"></i>Festival</span><span><i></i>Birthday</span></p></section>`;
  if(sel){
    const f = festOn(s,sel), b = bdayOn(s,sel), isToday = S.date.s===s && S.date.d===sel;
    h += `<section><div class="h-row"><h2>${SEAS[s]} ${sel}</h2><span class="aside">${DOW[dowOf(sel)]}</span></div>`;
    if(!f.length && !b.length) h += `<div class="empty">Nothing scheduled.</div>`;
    else h += `<ul class="list">${f.map(x => `<li class="row"><div class="body"><div class="ttl">${esc(x.n)}</div><div class="sub">${esc(x.time)} · ${esc(x.where)}<br>${esc(x.note)}</div></div></li>`).join('')}${b.map(v => `<li class="row"><div class="body"><div class="ttl">${esc(v.n)}’s birthday ${v.rom?'<span class="tag coral">romanceable</span>':''}</div><div class="sub">Loves: ${esc(v.loved.join(', ')||'—')}</div></div></li>`).join('')}</ul>`;
    h += `<div style="margin-top:10px">${isToday?'<span class="tag teal">Today</span>':`<button class="btn sm" data-act="setdate" data-s="${s}" data-d="${sel}">Set as today</button>`}</div></section>`;
  }
  return h;
}

/* ---------- MUSEUM ---------- */
function museumView(){
  const c = ui.cat, list = D[c];
  const total = museumTotal(), max = museumMax();
  const s = S.date.s;
  const isC = CRIT3.includes(c);
  const arr = museumItems(c);
  const have = cnt(c);
  let h = `<section><div class="h-row"><h2>${esc(CATS.find(x=>x[0]===c)[1])}</h2><span class="aside num">${total}/${max} donated in all</span></div></section>`;
  h += `<div class="tabs" role="tablist">${CATS.map(([k,l]) => `<button class="chip" role="tab" data-act="cat" data-c="${k}" aria-pressed="${k===c}">${l}<small class="num">${cnt(k)}/${D[k].length}</small></button>`).join('')}</div>`;
  h += `<div class="toolbar"><input type="search" id="q" placeholder="Search ${esc(CATS.find(x=>x[0]===c)[1].toLowerCase())}" value="${esc(ui.q)}" aria-label="Search">
    <div class="r"><button class="chip" data-act="fmiss" aria-pressed="${ui.missing}">Missing only</button>${isC?`<button class="chip" data-act="fnow" aria-pressed="${ui.now}">Catchable right now</button><button class="chip" data-act="fseas" aria-pressed="${ui.season}">In season (${SEAS[s]})</button>`:''}<button class="chip" data-act="fsort" aria-pressed="${ui.sort==='az'}">A–Z</button></div>
    ${isC?`<div class="tabs" role="group" aria-label="Time of day">${['any',...TIMES].map(t => `<button class="chip" data-act="ftime" data-t="${t}" aria-pressed="${ui.time===t}">${t==='any'?'Any time':t}</button>`).join('')}</div>`:''}
    ${ui.now&&isC?`<p class="small muted">Showing what bites in ${SEAS[s]}, ${S.time.toLowerCase()}, ${WX_LABEL[S.weather].toLowerCase()} weather. Change them with the bar at the bottom.</p>`:''}</div>`;
  h += `<section><div class="progress-head"><b class="num">${have}<span class="muted" style="font:600 16px var(--body)"> / ${list.length}</span></b><span class="muted small">${arr.length} shown</span><span style="flex:1"></span><button class="btn sm" data-act="bulk" data-m="on">Mark shown</button><button class="btn sm" data-act="bulk" data-m="off">Clear shown</button></div>${bar(have,list.length,'kelp')}</section>`;
  h += arr.length ? `<ul class="list">${arr.map(it => itemRow(c,it)).join('')}</ul>` : `<div class="empty">Nothing matches these filters.</div>`;
  return h;
}
function itemRow(c,it){
  const on = !!S.done[c][it.id], open = !!ui.open[c+':'+it.id];
  const isC = CRIT3.includes(c);
  let meta = '';
  if(isC) meta = [short(it.w,70), it.t].filter(Boolean).join(' · ');
  else if(c==='fossils') meta = it.w;
  else if(c==='artifacts') meta = it.w;
  else meta = 'Sells ' + it.p;
  let det = '';
  if(open){
    const rows = [];
    if(isC){ rows.push(['Where', it.w], ['When', it.t]); if(it.wx) rows.push(['Weather', it.wx]); if(it.sz) rows.push(['Size', it.sz]); if(it.d) rows.push(['Difficulty', it.d]); rows.push(['Rarity', it.r]); rows.push(['Base price', it.p]); }
    else if(c==='fossils') rows.push(['Found in', it.w], ['Skeleton', it.g]);
    else if(c==='artifacts') rows.push(['Comes from', it.w], ['Tip', 'Coffers drop from tilled soil, sand and fishing']);
    else rows.push(['Found', it.w], ['Sells', it.p], ['Element', it.g||'—']);
    det = `<dl class="det">${rows.map(([k,v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  }
  const tags = ((c==='gems' && it.g) ? `<em class="tag">${it.g}</em>` : '') + (isShipped(c, it.id) ? '<em class="tag kelp">Shipped</em>' : '');
  return `<li class="it ${on?'done':''}"><button class="chk" data-act="tog" data-c="${c}" data-id="${it.id}" aria-pressed="${on}" aria-label="Donated: ${esc(it.n)}"></button><div class="it-main" role="button" tabindex="0" aria-expanded="${open}" data-act="open" data-k="${c}:${it.id}"><div class="it-t"><span class="nm">${esc(it.n)}</span>${isC?seasonChips(it):''}${tags}</div><div class="it-s">${esc(meta)}</div>${det}</div>${heartBtn(c, it.id, it.n)}</li>`;
}

/* ---------- OFFERINGS ---------- */
function offeringsView(){
  const all = D.offerings, regular = all.filter(o => o.altar<4), done = regular.filter(offDone).length;
  let h = `<section><div class="h-row"><h2>Lake Temple offerings</h2><span class="aside num">${done}/${regular.length}</span></div>${bar(done,regular.length,'kelp')}<p class="lead">Tap the items you have given. An offering completes once you reach its item count.</p></section>`;
  h += `<div class="tabs">${ALTARS.map((n,i) => `<button class="chip" data-act="altar" data-i="${i}" aria-pressed="${ui.off===i}">${n}<small class="num">${all.filter(o=>o.altar===i&&offDone(o)).length}/${all.filter(o=>o.altar===i).length}</small></button>`).join('')}</div>`;
  h += `<div class="off-grid">${all.filter(o => o.altar===ui.off).map(o => {
    const ok = offDone(o);
    return `<article class="off ${ok?'done':''}"><div class="progress-head"><h3>${esc(o.n)}</h3><span class="tag ${ok?'kelp':''} num">${offCount(o)}/${o.need}</span></div>
      <div class="chips">${o.items.map((it,i) => `<button class="chip" data-act="offi" data-o="${o.id}" data-i="${i}" aria-pressed="${!!(S.off[o.id]&&S.off[o.id][i])}">${esc(it.n)}${it.q>1?`<small>×${it.q}</small>`:''}</button>`).join('')}</div>
      ${o.reward?`<div class="small muted">Reward: <b style="color:var(--ink)">${esc(o.reward)}</b></div>`:''}</article>`;
  }).join('')}</div>`;
  return h;
}

/* ---------- PEOPLE ---------- */
function peopleView(){
  let arr = D.villagers.slice();
  if(ui.pf==='rom') arr = arr.filter(v => v.rom);
  if(ui.pf==='fav') arr = arr.filter(v => isFav('people', v.id));
  if(ui.q){ const q = ui.q.toLowerCase(); arr = arr.filter(v => v.n.toLowerCase().includes(q) || v.loved.some(g => g.toLowerCase().includes(q))); }
  if(ui.ps==='birthday') arr.sort((a,b) => (a.b?untilBirthday(a.b):999) - (b.b?untilBirthday(b.b):999));
  else if(ui.ps==='hearts') arr.sort((a,b) => heartsOf(b)-heartsOf(a) || a.n.localeCompare(b.n));
  else arr.sort((a,b) => a.n.localeCompare(b.n));
  let h = `<section><div class="h-row"><h2>People</h2><span class="aside num">${D.villagers.filter(v=>heartsOf(v)>=8).length} at 8+ hearts</span></div>
    <p class="lead">Romanceable villagers stop at 8 hearts until you give them the Locket, then 10. Universally loved gift: ${esc((D.universal&&D.universal.loved||[]).join(', ')||'—')}.</p></section>`;
  h += `<div class="toolbar"><input type="search" id="q" placeholder="Search a villager or a gift they love" value="${esc(ui.q)}" aria-label="Search villagers or gifts">
    <div class="r">${[['all','All'],['rom','Romanceable'],['fav','Favourites']].map(([k,l]) => `<button class="chip" data-act="pf" data-k="${k}" aria-pressed="${ui.pf===k}">${l}</button>`).join('')}<span style="flex:1"></span>
    <select id="psort" style="width:auto" aria-label="Sort"><option value="birthday" ${ui.ps==='birthday'?'selected':''}>Next birthday</option><option value="hearts" ${ui.ps==='hearts'?'selected':''}>Most hearts</option><option value="name" ${ui.ps==='name'?'selected':''}>Name</option></select></div></div>`;
  h += arr.length ? `<ul class="list">${arr.map(v => {
    const hr = heartsOf(v), n = v.b ? untilBirthday(v.b) : null, rel = S.rel[v.id];
    const cap = v.rom && !rel ? 8 : 10;
    return `<li class="ppl"><div class="ppl-h">${heartBtn('people', v.id, v.n)}
      <div style="flex:1;min-width:0"><div class="nm">${esc(v.n)} ${v.rom?'<span class="tag coral">romanceable</span>':''} ${rel?`<span class="tag kelp">${rel}</span>`:''}</div>
      <div class="small muted">${v.b?`Birthday ${dateOf(v)} · ${n===0?'<b style="color:var(--coral)">today</b>':'in '+plural(n,'day')}`:'Birthday unknown'}</div></div></div>
      <div class="hearts"><button class="step" data-act="heart" data-id="${v.id}" data-d="-1" aria-label="Fewer hearts for ${esc(v.n)}">−</button>
        <div class="pips" aria-label="${hr} hearts">${Array.from({length:10},(_,i) => `<i class="${i<hr?'on':(i>=cap?'lock':'')}"></i>`).join('')}</div>
        <button class="step" data-act="heart" data-id="${v.id}" data-d="1" aria-label="More hearts for ${esc(v.n)}">+</button><b class="num" style="width:34px;text-align:right">${hr}</b></div>
      ${v.rom?`<div class="seg"><button data-act="rel" data-id="${v.id}" data-v="dating" aria-pressed="${rel==='dating'}">Dating (Locket given)</button><button data-act="rel" data-id="${v.id}" data-v="married" aria-pressed="${rel==='married'}">Married</button></div>`:''}
      <div class="gifts"><b>Loves:</b> ${esc(v.loved.join(', ')||'—')}${v.liked&&v.liked.length?`<br><b>Likes:</b> ${esc(v.liked.join(', '))}`:''}${v.hated.length?`<br><b>Hates:</b> ${esc(v.hated.join(', '))}`:''}</div></li>`;
  }).join('')}</ul>` : `<div class="empty">No villagers match. ${ui.pf==='fav'?'Tap the ♡ on a villager to add them here.':''}</div>`;
  return h;
}

/* ---------- KITCHEN ---------- */
function recipesView(){
  const mediums = ['All', ...new Set(D.recipes.map(r => r.m).filter(Boolean))];
  let arr = D.recipes.filter(r => (ui.rm==='All'||r.m===ui.rm) && (!ui.rmissing || !S.done.recipes[r.id]) && (!ui.rq || r.n.toLowerCase().includes(ui.rq.toLowerCase())));
  const have = D.recipes.filter(r => S.done.recipes[r.id]).length;
  let h = `<section><div class="h-row"><h2>Kitchen</h2><span class="aside num">${have}/${D.recipes.length} cooked</span></div>${bar(have,D.recipes.length,'kelp')}<p class="lead">Cook every recipe once to earn the Chef de Cuisine badge.</p></section>`;
  h += `<div class="toolbar"><input type="search" id="rq" placeholder="Search recipes" value="${esc(ui.rq)}" aria-label="Search recipes"><div class="tabs">${mediums.map(m => `<button class="chip" data-act="rm" data-m="${esc(m)}" aria-pressed="${ui.rm===m}">${esc(m)}</button>`).join('')}</div><div class="r"><button class="chip" data-act="rmiss" aria-pressed="${ui.rmissing}">Not cooked yet</button></div></div>`;
  h += arr.length ? `<ul class="list">${arr.map(r => {
    const on = !!S.done.recipes[r.id];
    return `<li class="it ${on?'done':''}"><button class="chk" data-act="tog" data-c="recipes" data-id="${r.id}" aria-pressed="${on}" aria-label="Cooked: ${esc(r.n)}"></button><div class="it-main" data-act="open" data-k="recipes:${r.id}"><div class="it-t"><span class="nm">${esc(r.n)}</span><em class="tag">${esc(r.m)}</em></div><div class="it-s">${r.src?'Learn: '+esc(r.src):'Available from the start'}${r.e!==undefined?' · restores '+r.e+' energy / '+r.h+' health':''}</div>${ui.open['recipes:'+r.id]?`<dl class="det"><dt>Needs</dt><dd>${esc(r.i)}</dd>${r.y>1?`<dt>Makes</dt><dd>${r.y}</dd>`:''}${r.b?`<dt>Buff</dt><dd>${esc(r.b)}</dd>`:''}</dl>`:''}</div>${heartBtn('recipes', r.id, r.n)}</li>`;
  }).join('')}</ul>` : `<div class="empty">Nothing matches.</div>`;
  return h;
}

/* ---------- QUESTS ---------- */
function questsView(){
  const groups = ['All', ...new Set(D.quests.map(q => q.g))];
  let arr = D.quests.filter(q => (ui.qg==='All'||q.g===ui.qg) && (!ui.qmissing || !S.done.quests[q.id]));
  const have = D.quests.filter(q => S.done.quests[q.id]).length;
  let h = `<section><div class="h-row"><h2>Quests</h2><span class="aside num">${have}/${D.quests.length}</span></div>${bar(have,D.quests.length,'kelp')}<p class="lead">Main, mine, ocean and museum storylines.</p></section>`;
  h += `<div class="toolbar"><div class="tabs">${groups.map(g => `<button class="chip" data-act="qg" data-g="${esc(g)}" aria-pressed="${ui.qg===g}">${esc(g)}</button>`).join('')}</div><div class="r"><button class="chip" data-act="qmiss" aria-pressed="${ui.qmissing}">Not done yet</button></div></div>`;
  h += arr.length ? `<ul class="list">${arr.map(q => {
    const on = !!S.done.quests[q.id];
    return `<li class="it ${on?'done':''}"><button class="chk" data-act="tog" data-c="quests" data-id="${q.id}" aria-pressed="${on}" aria-label="Done: ${esc(q.n)}"></button><div class="it-main" data-act="open" data-k="quests:${q.id}"><div class="it-t"><span class="nm">${esc(q.n)}</span><em class="tag">${esc(q.g)}</em></div><div class="it-s">${esc(short(q.by,80))}</div>${ui.open['quests:'+q.id]?`<dl class="det"><dt>Given by</dt><dd>${esc(q.by)}</dd><dt>To do</dt><dd>${esc(q.req||'—')}</dd></dl>`:''}</div></li>`;
  }).join('')}</ul>` : `<div class="empty">All done here.</div>`;
  return h;
}

/* ---------- FARM & SKILLS ---------- */
function farmView(){
  const s = ui.cropS ?? S.date.s, left = 28 - S.date.d;
  const crops = D.crops.filter(c => c.s[s]).sort((a,b) => b.ppd - a.ppd);
  let h = `<section><div class="h-row"><h2>Tools</h2><span class="aside">tap the tier you own</span></div><ul class="list">${TOOLS.map(t => {
    const cur = S.tools[t] || 0;
    return `<li class="kv"><span class="k">${t}</span><div class="seg">${TIERS.map((n,i) => `<button data-act="tool" data-t="${esc(t)}" data-i="${i}" aria-pressed="${cur===i}">${n}</button>`).join('')}</div></li>`;
  }).join('')}</ul></section>`;
  h += `<section><div class="h-row"><h2>Mastery levels</h2><span class="aside num">${SKILLS.reduce((a,k)=>a+(S.skills[k]||0),0)}/${SKILLS.length*10}</span></div><ul class="list">${SKILLS.map(k => {
    const lv = S.skills[k] || 0;
    return `<li class="kv"><span class="k">${k}</span><div class="hearts" style="width:60%;max-width:280px"><button class="step" data-act="skill" data-k="${k}" data-d="-1" aria-label="Lower ${k}">−</button><div style="flex:1">${bar(lv,10)}</div><button class="step" data-act="skill" data-k="${k}" data-d="1" aria-label="Raise ${k}">+</button><b class="num" style="width:22px;text-align:right">${lv}</b></div></li>`;
  }).join('')}</ul></section>`;
  const r = S.rank.r, ri = RANKS.indexOf(r), nxt = RANKS[ri+1];
  const need = nxt ? (D.rankTotals.find(x => x.r === nxt)||{}).total : 0;
  h += `<section><div class="h-row"><h2>Town rank</h2><span class="aside">${nxt?'next: '+nxt:'top rank'}</span></div><ul class="list"><li class="kv"><span class="k">Current rank</span><div class="seg">${RANKS.map(x => `<button data-act="rank" data-r="${x}" aria-pressed="${r===x}">${x}</button>`).join('')}</div></li>
    <li class="kv"><label class="k" for="rpts">Town points</label><input type="number" id="rpts" min="0" style="width:110px" value="${S.rank.pts||0}"></li>
    ${nxt?`<li class="kv" style="display:block"><div class="progress-head"><span class="small muted">Rank ${nxt} needs ${need} total points</span><b class="num small">${S.rank.pts||0}/${need}</b></div>${bar(Math.min(S.rank.pts||0,need),need)}</li>`:''}</ul></section>`;
  h += `<section><div class="h-row"><h2>Crops</h2></div><button class="btn" data-act="nav" data-to="crops">Open the best-crop planner</button></section>`;
  return h;
}

/* ---------- PROGRESS ---------- */
function progressView(){
  const tot = museumTotal(), max = museumMax();
  const offs = D.offerings, offN = offs.filter(offDone).length;
  const rec = D.recipes.filter(r => S.done.recipes[r.id]).length;
  const qn = D.quests.filter(q => S.done.quests[q.id]).length;
  const toolPts = TOOLS.reduce((a,t) => a+(S.tools[t]||0),0), toolMax = TOOLS.length*4;
  const skPts = SKILLS.reduce((a,k) => a+(S.skills[k]||0),0), skMax = SKILLS.length*10;
  const hearts = D.villagers.reduce((a,v) => a+Math.min(heartsOf(v),10),0), heartMax = D.villagers.length*10;
  const sections = [
    ['Museum', tot, max], ['Offerings', offN, offs.length], ['Kitchen', rec, D.recipes.length], ['Quests', qn, D.quests.length],
    ['Tools', toolPts, toolMax], ['Mastery', skPts, skMax], ['Friendships', hearts, heartMax], ['Shipped', shipTotal(), shipMax()]
  ];
  const counted = sections.filter(x => x[0] !== 'Friendships' && x[0] !== 'Shipped');
  const overall = Math.round(counted.reduce((a,[,x,y]) => a+pct(x,y),0)/counted.length);
  let h = `<section class="hero"><div class="h-row" style="margin:0"><h2>Overall</h2><span class="aside">${fmtY(S.date)}</span></div><div class="big num">${overall}<span style="font-size:.4em;color:var(--ink2)">%</span></div>${bar(overall,100)}<p class="lead">Average across museum, offerings, kitchen, quests, tools and mastery. Friendships and shipping are shown below but not counted: maxing every villager and selling every item are very long games.</p></section>`;
  h += `<section><div class="h-row"><h2>By area</h2></div><div class="stat-grid">${sections.map(([n,a,b]) => `<div class="stat"><div class="r"><span>${n}</span><span class="num">${a}/${b} · ${pct(a,b)}%</span></div>${bar(a,b,pct(a,b)===100?'kelp':'')}</div>`).join('')}</div></section>`;
  h += `<section><div class="h-row"><h2>Museum collections</h2></div><ul class="list">${collections().map(c => `<li class="kv"><div><div class="k">${esc(c.n)}</div><div class="sub">${c.r?'Reward: '+esc(c.r):''}</div></div><span class="tag ${c.have>=c.need?'kelp':''} num">${c.have}/${c.need}</span></li>`).join('')}</ul></section>`;
  const nextM = D.museumMilestones.find(m => m.n > tot);
  h += `<section><div class="h-row"><h2>Donation rewards</h2><span class="aside num">${tot} donated</span></div><ul class="list">${D.museumMilestones.map(m => `<li class="ms ${m.n<=tot?'reached':''} ${m===nextM?'next':''}"><span class="n num">${m.n}</span><span class="r">${m.n<=tot?'✓ ':''}${esc(m.r||'Quest: Empty No More')}</span></li>`).join('')}</ul></section>`;
  return h;
}

/* ---------- TIPS ---------- */
function tipsView(){
  const d = S.date, left = 28 - d.d;
  const ctx = {s:d.s, d:d.d, y:d.y, left, date:d, abs:absDay(d)};
  const now = contextTips(ctx);
  const cats = ['All', ...new Set(TIPS.map(t => t.c))];
  const q = (ui.q || '').toLowerCase();
  const list = TIPS.filter(t => (ui.tc==='All' || t.c===ui.tc) && (!t.when || t.when(ctx) || ui.tc!=='All' || q) && (!q || t.t.toLowerCase().includes(q) || t.c.toLowerCase().includes(q)));
  const row = (t, isNow) => `<li class="row tip"><div class="body"><div class="ttl"><span class="tag ${isNow?'coral':''}">${esc(t.c)}</span></div><div class="tx">${esc(t.t)}</div></div></li>`;
  let h = `<section><div class="h-row"><h2>Tips</h2><span class="aside">${TIPS.length} tips</span></div><p class="lead">Facts from the Coral Island wiki, plus advice built from your date and progress.</p></section>`;
  if(now.length) h += `<section><div class="h-row"><h2>Right now</h2><span class="aside">${fmt(d)}</span></div><ul class="list">${now.map(t => row(t,true)).join('')}</ul></section>`;
  h += `<div class="toolbar"><input type="search" id="q" placeholder="Search tips" value="${esc(ui.q)}" aria-label="Search tips"><div class="tabs">${cats.map(c => `<button class="chip" data-act="tc" data-c="${esc(c)}" aria-pressed="${ui.tc===c}">${esc(c)}</button>`).join('')}</div></div>`;
  h += list.length ? `<ul class="list">${list.map(t => row(t,false)).join('')}</ul>` : `<div class="empty">No tip matches.</div>`;
  return h;
}

/* ---------- SETTINGS ---------- */
function isStandalone(){ return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; }
function dataView(){
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let inst;
  if(isStandalone()) inst = `<p class="lead">You are running the installed app.</p>`;
  else if(ui.installEvt) inst = `<p class="lead">Install Reef Ledger as an app. It opens in its own window and works without a connection.</p><div style="margin-top:10px"><button class="btn pri" data-act="install">Install app</button></div>`;
  else if(ios) inst = `<p class="lead">On iPhone or iPad: open this page in Safari, tap the Share button, then “Add to Home Screen”.</p>`;
  else inst = `<p class="lead">In Chrome or Edge, open the browser menu and choose “Install Reef Ledger” (or “Add to Home screen” on Android). Firefox on Android has “Install” in its menu too.</p>`;
  const ver = {auto:'Match my device', light:'Light', dark:'Dark'};
  return `<section><div class="h-row"><h2>Install</h2></div>${inst}</section>
  <section><div class="h-row"><h2>Appearance</h2></div><div class="seg">${Object.keys(ver).map(k => `<button data-act="theme" data-v="${k}" aria-pressed="${prefs.theme===k}">${ver[k]}</button>`).join('')}</div></section>
  <section><div class="h-row"><h2>Backup & moving devices</h2></div>
    <p class="lead">Your progress is stored on this device only, and it survives closing the app. To move it to another phone or computer, save a backup file here and restore it there.</p>
    <div class="chips" style="margin-top:12px"><button class="btn pri" data-act="export">Save backup file</button><button class="btn" data-act="copy">Copy backup text</button></div></section>
  <section><div class="h-row"><h2>Restore</h2></div>
    <div class="chips"><label class="btn" for="impfile" style="cursor:pointer">Choose a backup file</label><input type="file" id="impfile" accept=".json,application/json" hidden></div>
    <textarea id="imp" placeholder="Or paste backup text here" aria-label="Backup text" style="margin-top:10px"></textarea><div style="margin-top:10px"><button class="btn" data-act="import">Restore from text</button></div></section>
  <section><div class="h-row"><h2>Reset</h2></div><button class="btn warn" data-act="reset">Erase all progress on this device</button></section>
  <section><div class="h-row"><h2>About</h2></div><p class="lead">Reef Ledger is an unofficial fan-made tracker. It is not affiliated with Stairway Games or Humble Games. Item lists (${D.fish.length} fish, ${D.insects.length} insects, ${D.critters.length} critters, ${D.artifacts.length} artifacts, ${D.fossils.length} fossils, ${D.gems.length} gems), seasons, birthdays, gift preferences, recipes, offerings and quests come from the <a class="link" href="https://coralisland.fandom.com/" target="_blank" rel="noopener">Coral Island Wiki</a> on Fandom, used under CC BY-SA. The wiki can lag behind the latest game version, so a newer patch may add items that are missing here. Daily plans are computed from your date and what you have ticked.</p></section>`;
}

/* =========================================================
   Render
   ========================================================= */
const VIEWS = {today:todayView, planner:plannerView, guide:guideView, progress:progressHub, data:dataView, tips:tipsView, calendar:plannerView, museum:museumView, people:peopleView, offerings:offeringsView, recipes:recipesView, quests:questsView, farm:farmView, gifts:giftsView, crops:cropsView, route:routeView, catalog:catalogView};
function render(){
  const a = document.activeElement, id = a && a.id, pos = a && a.selectionStart;
  renderChrome();
  $('#view').innerHTML = (SUBPAGES.includes(ui.route) ? '<div><button class="link back" data-act="nav" data-to="guide">‹ Field Guide</button></div>' : '') + VIEWS[ui.route]();
  if(id){ const el = document.getElementById(id); if(el){ el.focus(); try{ if(pos!=null) el.setSelectionRange(pos,pos); }catch(e){} } }
}
function nav(to){ ui.route = to; ui.q = ''; window.scrollTo(0,0); render(); }
let toastT;
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => t.hidden = true, 2200); }
function modal(html){ const m = $('#modal'); m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`; m.hidden = false; const f = m.querySelector('input,select,button'); if(f) f.focus(); }
function closeModal(){ $('#modal').hidden = true; $('#modal').innerHTML = ''; }
function ask(msg, label='Confirm'){
  return new Promise(res => {
    modal(`<h2>Are you sure?</h2><p class="lead" style="margin:0">${esc(msg)}</p><div class="acts"><button class="btn" data-act="mno">Cancel</button><button class="btn warn" data-act="myes">${esc(label)}</button></div>`);
    window.__ask = v => { closeModal(); res(v); };
  });
}
function dateModal(){
  const d = S.date;
  modal(`<h2>Where are you in the game?</h2><p class="lead" style="margin:0">Set the date, the time of day and the weather. The plan and the “catchable right now” lists follow them.</p>
    <div class="f"><label for="m-s">Season</label><select id="m-s">${SEAS.map((n,i) => `<option value="${i}" ${i===d.s?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="f2"><div class="f"><label for="m-d">Day (1–28)</label><input type="number" id="m-d" min="1" max="28" value="${d.d}"></div><div class="f"><label for="m-y">Year</label><input type="number" id="m-y" min="1" value="${d.y}"></div></div>
    <div class="f2"><div class="f"><label for="m-t">Time of day</label><select id="m-t">${TIMES.map(t => `<option ${t===S.time?'selected':''}>${t}</option>`).join('')}</select></div>
    <div class="f"><label for="m-w">Weather</label><select id="m-w">${WEATHERS.map(w => `<option value="${w}" ${w===S.weather?'selected':''}>${WX_LABEL[w]}</option>`).join('')}</select></div></div>
    <div class="acts"><button class="btn" data-act="mcancel">Cancel</button><button class="btn pri" data-act="msave">Save</button></div>`);
}

/* =========================================================
   Events
   ========================================================= */
let noteT;
document.addEventListener('input', e => {
  const t = e.target;
  if(t.id === 'q'){ ui.q = t.value; render(); }
  else if(t.id === 'rq'){ ui.rq = t.value; render(); }
  else if(t.id === 'gq'){ ui.gq = t.value; render(); }
  else if(t.id === 'pq'){ ui.pq = t.value; render(); }
  else if(t.id === 'sq'){ ui.sq = t.value; render(); }
  else if(t.id === 'notes'){ S.notes = t.value; clearTimeout(noteT); noteT = setTimeout(persist, 600); }
  else if(t.id === 'rpts'){ S.rank.pts = Math.max(0, parseInt(t.value)||0); clearTimeout(noteT); noteT = setTimeout(() => { persist(); render(); }, 700); }
});
document.addEventListener('change', e => {
  if(e.target.id === 'psort'){ ui.ps = e.target.value; render(); }
  else if(e.target.id === 'gvsel'){ ui.gv = e.target.value; render(); }
});
document.addEventListener('keydown', e => {
  if(e.key === 'Escape' && !$('#modal').hidden){ if(window.__ask) window.__ask(false); else closeModal(); }
  else if(e.key === 'Enter' && e.target.id === 'todo-in'){ e.preventDefault(); addTodo(); }
  else if((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.it-main')){ e.preventDefault(); e.target.click(); }
});
$('#modal').addEventListener('click', e => { if(e.target.id === 'modal'){ if(window.__ask){ window.__ask(false); window.__ask = null; } else closeModal(); } });

document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if(!el) return;
  const a = el.dataset.act, D_ = el.dataset;
  switch(a){
    case 'nav': nav(D_.to); break;
    case 'goto': ui.route = D_.to; ui.cat = D_.cat; ui.season = D_.f==='season'; ui.now = false; ui.missing = true; ui.time = 'any'; ui.q=''; window.scrollTo(0,0); render(); break;
    case 'g': { // Field Guide tile
      ui.route = D_.r; ui.q = ''; ui.gq = '';
      if(D_.r === 'museum'){ ui.cat = D_.c; ui.now = D_.f === 'now'; ui.season = false; ui.missing = false; ui.time = 'any'; }
      if(D_.r === 'crops') ui.cropS = null;
      if(D_.pt) ui.pt = D_.pt;
      if(D_.r === 'catalog'){ ui.gc = D_.gc; ui.gf = 'All'; ui.gs = false; ui.gmore = false; }
      window.scrollTo(0,0); render(); break; }
    case 'gsel': { // a global search result
      const t = D_.t, n = D_.n; ui.gq = '';
      if(t === 'gift'){ ui.route = 'people'; ui.q = n; ui.pf = 'all'; }
      else if(t === 'people'){ ui.route = 'people'; ui.q = n; ui.pf = 'all'; }
      else if(t === 'recipes'){ ui.route = 'recipes'; ui.rq = n; ui.rm = 'All'; ui.rmissing = false; }
      else if(CATALOG[t]){ ui.route = 'catalog'; ui.gc = t; ui.gf = 'All'; ui.gs = false; ui.gmore = false; ui.q = n; }
      else if(t === 'quests'){ ui.route = 'quests'; ui.qg = 'All'; ui.qmissing = false; }
      else { ui.route = 'museum'; ui.cat = t; ui.q = n; ui.missing = false; ui.season = false; ui.now = false; ui.time = 'any'; }
      window.scrollTo(0,0); render(); break; }
    case 'date': dateModal(); break;
    case 'mcancel': closeModal(); break;
    case 'msave': { ui.tipShift = 0;
      const s = clamp(parseInt($('#m-s').value)||0,0,3), d = clamp(parseInt($('#m-d').value)||1,1,28), y = Math.max(1,parseInt($('#m-y').value)||1);
      S.date = {y,s,d};
      const tm = $('#m-t') && $('#m-t').value, wx = $('#m-w') && $('#m-w').value;
      if(TIMES.includes(tm)) S.time = tm; if(WEATHERS.includes(wx)) S.weather = wx;
      persist(); closeModal(); render(); break; }
    case 'next': S.date = addDays(S.date,1); ui.tipShift = 0; S.time = 'Morning'; persist(); render(); window.scrollTo(0,0); toast('Good morning — ' + fmtY(S.date)); break;
    case 'setdate': S.date = {y:S.date.y, s:+D_.s, d:+D_.d}; persist(); render(); break;
    case 'rt': S.daily.done[D_.k] = !S.daily.done[D_.k]; persist(); render(); break;
    case 'tog': { const m = S.done[D_.c]; if(m[D_.id]){ delete m[D_.id]; dropRecent(D_.c, D_.id); } else { m[D_.id] = 1; pushRecent(D_.c, D_.id); } persist(); render(); break; }
    case 'open': { const k = D_.k; ui.open[k] = !ui.open[k]; render(); break; }
    case 'cat': ui.cat = D_.c; ui.q = ''; render(); break;
    case 'fmiss': ui.missing = !ui.missing; render(); break;
    case 'fseas': ui.season = !ui.season; render(); break;
    case 'fnow': ui.now = !ui.now; render(); break;
    case 'shp': { const k = shipKey(D_.c, D_.id); if(S.ship[k]) delete S.ship[k]; else S.ship[k] = 1; persist(); render(); break; }
    case 'shpexp': ui.shipExp[D_.c] = !ui.shipExp[D_.c]; render(); break;
    case 'shpall': ui.shipAll[D_.c] = true; render(); break;
    case 'shpmiss': ui.shipMiss = !ui.shipMiss; render(); break;
    case 'shpsel': {
      const c = D_.c, on = D_.m === 'on', list = shipList(c);
      if(!list.length) break;
      if(on || await ask('Clear ' + plural(list.length, 'shipped item') + '?', 'Clear')){
        list.forEach(it => { const k = shipKey(c, it.id); if(on) S.ship[k] = 1; else delete S.ship[k]; });
        persist(); render();
      }
      break; }
    case 'gf': ui.gf = D_.g; ui.gmore = false; render(); break;
    case 'gs': ui.gs = !ui.gs; render(); break;
    case 'gmore': ui.gmore = true; render(); break;
    case 'fsort': ui.sort = ui.sort === 'az' ? 'game' : 'az'; render(); break;
    case 'bulk': {
      const c = ui.cat, s = S.date.s;
      const arr = museumItems(c);
      const on = D_.m === 'on';
      if(!arr.length) break;
      if(await ask(`${on?'Mark':'Clear'} ${plural(arr.length,'item')} as ${on?'donated':'not donated'}?`, on?'Mark them':'Clear them')){
        arr.forEach(it => { if(on) S.done[c][it.id] = 1; else { delete S.done[c][it.id]; dropRecent(c, it.id); } }); persist(); render();
      }
      break; }
    case 'mno': window.__ask && window.__ask(false); break;
    case 'myes': window.__ask && window.__ask(true); break;
    case 'altar': ui.off = +D_.i; render(); break;
    case 'offi': { const o = S.off[D_.o] || (S.off[D_.o] = {}); if(o[D_.i]) delete o[D_.i]; else o[D_.i] = 1; persist(); render(); break; }
    case 'pf': ui.pf = D_.k; render(); break;
    case 'fav': toggleFav(D_.c, D_.id); persist(); render(); break;
    case 'heart': { const v = D.villagers.find(x => x.id === D_.id); const cur = S.hearts[D_.id]||0; S.hearts[D_.id] = clamp(cur + (+D_.d), 0, 10); persist(); render(); break; }
    case 'rel': { S.rel[D_.id] = S.rel[D_.id] === D_.v ? undefined : D_.v; if(!S.rel[D_.id]) delete S.rel[D_.id]; persist(); render(); break; }
    case 'cals': ui.calS = +D_.s; ui.calD = null; render(); break;
    case 'cald': ui.calS = ui.calS ?? S.date.s; ui.calD = +D_.d; render(); break;
    case 'rm': ui.rm = D_.m; render(); break;
    case 'rmiss': ui.rmissing = !ui.rmissing; render(); break;
    case 'qg': ui.qg = D_.g; render(); break;
    case 'qmiss': ui.qmissing = !ui.qmissing; render(); break;
    case 'tool': S.tools[D_.t] = +D_.i; persist(); render(); break;
    case 'skill': S.skills[D_.k] = clamp((S.skills[D_.k]||0) + (+D_.d), 0, 10); persist(); render(); break;
    case 'rank': S.rank.r = D_.r; persist(); render(); break;
    case 'crops': ui.cropS = +D_.s; render(); break;
    case 'export': {
      const json = JSON.stringify(S, null, 1);
      const name = `reef-ledger-y${S.date.y}-${SEAS[S.date.s].toLowerCase()}-${S.date.d}.json`;
      try {
        const file = new File([json], name, {type:'application/json'});
        if(matchMedia('(pointer:coarse)').matches && navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], title:'Reef Ledger backup'}); toast('Backup shared'); break;
        }
      } catch(err){ if(err && err.name === 'AbortError') break; }
      try {
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], {type:'application/json'})); a.download = name;
        document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1500); toast('Backup saved to your downloads');
      } catch(err){ toast('Could not save. Try “Copy backup text”.'); }
      break; }
    case 'copy': {
      try { await navigator.clipboard.writeText(JSON.stringify(S)); toast('Backup copied'); }
      catch(err){ const ta = $('#imp'); if(ta){ ta.value = JSON.stringify(S); ta.select(); toast('Select and copy the text in the box'); } }
      break; }
    case 'import': { const t = $('#imp').value.trim(); if(t) await restoreFrom(t); break; }
    case 'reset': if(await ask('This erases all ticked items, hearts, tools, to-dos and notes on this device.', 'Erase everything')){ S = def(); persist(); render(); toast('Progress erased'); } break;
    case 'install': if(ui.installEvt){ const ev = ui.installEvt; ev.prompt(); try { await ev.userChoice; } catch(e){} ui.installEvt = null; render(); } break;
    case 'theme': prefs.theme = D_.v; savePrefs(); applyTheme(); render(); break;
    case 'tipmore': ui.tipShift++; render(); break;
    case 'tc': ui.tc = D_.c; render(); break;
    case 'ftime': ui.time = D_.t; render(); break;
    case 'todoadd': addTodo(); break;
    case 'todoclear': S.todos = S.todos.filter(x => !x.done); persist(); render(); break;
    case 'pt': ui.pt = D_.k; window.scrollTo(0,0); render(); break;
    case 'pexp': ui.pexp[D_.c] = !ui.pexp[D_.c]; render(); break;
    case 'psel': {
      const c = D_.c, on = D_.m === 'on';
      if(on || await ask('Clear every ' + (CATS.find(x => x[0] === c) || [0,c])[1].toLowerCase() + ' donation?', 'Clear all')){
        D[c].forEach(it => { if(on) S.done[c][it.id] = 1; else { delete S.done[c][it.id]; dropRecent(c, it.id); } });
        persist(); render();
      }
      break; }
    case 'settime': S.time = D_.t; persist(); render(); break;
    case 'setwx': S.weather = D_.w; persist(); render(); break;
    case 'todo': { const t = S.todos.find(x => x.id === D_.id); if(t){ t.done = !t.done; persist(); render(); } break; }
    case 'tododel': S.todos = S.todos.filter(x => x.id !== D_.id); persist(); render(); break;
  }
});

function addTodo(){
  const el = $('#todo-in'); const t = ((el && el.value) || '').trim(); if(!t) return;
  S.todos.push({id: Date.now().toString(36) + Math.random().toString(36).slice(2,5), t, done:false});
  persist(); render();
  const n = $('#todo-in'); if(n) n.focus();
}
async function restoreFrom(text){
  try {
    const r = JSON.parse(text); if(!r || typeof r !== 'object' || !r.done) throw 0;
    if(await ask('Replace your current progress with this backup?', 'Restore')){ S = migrate(r); persist(); render(); toast('Backup restored'); }
  } catch(err){ toast('That is not a valid backup'); }
}
document.addEventListener('change', e => {
  if(e.target.id === 'impfile' && e.target.files && e.target.files[0]){
    const rd = new FileReader();
    rd.onload = () => restoreFrom(String(rd.result || ''));
    rd.readAsText(e.target.files[0]);
  }
});

/* boot */
applyTheme();
{ const r0 = new URLSearchParams(location.search).get('r'); if(r0 && VIEWS[r0]) ui.route = r0; }
render();
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); ui.installEvt = e; render(); });
window.addEventListener('appinstalled', () => { ui.installEvt = null; render(); toast('Installed. Find it with your other apps.'); });
if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
