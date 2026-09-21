/* Field Guide hub, planner, gift planner, best crops, route, favourites and other views.
   Loaded before app.js: only function/const declarations here; they run later, once app.js has defined S, D and ui. */

const WEATHERS = ['Sunny','Windy','Rain','Storm','Snow','Blizzard'];
const WX_LABEL = {Sunny:'Sunny', Windy:'Windy', Rain:'Rainy', Storm:'Stormy', Snow:'Snowy', Blizzard:'Blizzard'};
const TYPE_LABEL = {fish:'Fish', insects:'Insect', critters:'Critter', fossils:'Fossil', artifacts:'Artifact', gems:'Gem', crops:'Crop', recipes:'Recipe', people:'Villager', quests:'Quest'};

/* ---------- favourites and recent ---------- */
const isFav = (c, id) => !!S.fav[c + ':' + id];
function toggleFav(c, id){ const k = c + ':' + id; if(S.fav[k]) delete S.fav[k]; else S.fav[k] = 1; }
function pushRecent(c, id){ S.recent = (S.recent || []).filter(x => !(x.c === c && x.id === id)); S.recent.unshift({c, id, d: absDay(S.date)}); S.recent = S.recent.slice(0, 12); }
function dropRecent(c, id){ S.recent = (S.recent || []).filter(x => !(x.c === c && x.id === id)); }
const heartBtn = (c, id, label) => `<button class="fav" data-act="fav" data-c="${c}" data-id="${id}" aria-pressed="${isFav(c,id)}" aria-label="Favourite ${esc(label)}">${isFav(c,id) ? '♥' : '♡'}</button>`;
function lookup(c, id){
  if(c === 'people') return D.villagers.find(x => x.id === id);
  return (D[c] || []).find(x => x.id === id);
}

/* ---------- time and weather ---------- */
function timeMatch(it, tm){
  if(!tm || tm === 'any' || !it.t) return true;
  const t = it.t.toLowerCase();
  if(t.includes('all day') || t.includes(tm.toLowerCase())) return true;
  return tm !== 'Night' && /(^|[^a-z])day([^a-z]|$)/.test(t);
}
function weatherOk(it, w){
  w = w || S.weather;
  const t = (it.wx || '').toLowerCase();
  if(!t || t.includes('any')) return true;
  return t.includes(w.toLowerCase());
}
const nowOk = it => !!it.s && it.s[S.date.s] > 0 && timeMatch(it, S.time) && weatherOk(it);

/* ---------- museum list (browse) ---------- */
function museumItems(c){
  const s = S.date.s, isC = CRIT3.includes(c), q = (ui.q || '').toLowerCase();
  let arr = D[c].filter(it =>
    (!ui.missing || !S.done[c][it.id]) &&
    (!ui.season || !it.s || it.s[s] > 0) &&
    (!isC || ui.time === 'any' || timeMatch(it, ui.time)) &&
    (!isC || !ui.now || nowOk(it)) &&
    (!q || it.n.toLowerCase().includes(q)));
  if(ui.sort === 'az') arr = arr.slice().sort((a,b) => a.n.localeCompare(b.n));
  else if(isC) arr = arr.slice().sort((a,b) => a.o - b.o);
  return arr;
}

/* ---------- where to find something (for the route) ---------- */
const SEA_RE = '(?:Any season|Spring|Summer|Fall|Winter)';
function spotsOf(it){
  const s = S.date.s, d = S.date.d, out = [];
  const splitter = new RegExp('\\s*/\\s*|(?=' + SEA_RE + '(?:, ' + SEA_RE + ')*(?: \\d+-\\d+)?:)');
  const prefix = new RegExp('^(' + SEA_RE + '(?:, ' + SEA_RE + ')*)(?: (\\d+)-(\\d+))?:\\s*(.*)$');
  String(it.w || '').split(splitter).forEach(p => {
    p = p.trim(); if(!p || /:$/.test(p)) return;
    let body = p;
    const m = prefix.exec(p);
    if(m){
      const seas = m[1].split(', ');
      if(!(seas.includes('Any season') || seas.includes(SEAS[s]))) return;
      if(m[2] && (d < +m[2] || d > +m[3])) return;
      body = m[4];
    }
    body.split(/\s*•\s*/).forEach(pl => {
      pl = pl.replace(/^(Surface|Mine):\s*/, '').trim(); if(!pl) return;
      const mm = /^(.*?)\s*\(([^)]*)\)$/.exec(pl);
      if(mm && mm[2].includes(',')) mm[2].split(',').forEach(x => out.push(mm[1].trim() + ' (' + x.trim() + ')'));
      else out.push(pl);
    });
  });
  return [...new Set(out)];
}
function routeGroups(list){
  const spots = new Map();
  list.forEach(x => { x.spots = spotsOf(x.it); x.spots.forEach(sp => { if(!spots.has(sp)) spots.set(sp, []); spots.get(sp).push(x); }); });
  const left = new Set(list.filter(x => x.spots.length)), groups = [];
  while(left.size){
    let best = null, bestN = 0;
    spots.forEach((arr, sp) => { const n = arr.filter(x => left.has(x)).length; if(n > bestN){ best = sp; bestN = n; } });
    if(!best) break;
    const members = spots.get(best).filter(x => left.has(x));
    members.forEach(x => left.delete(x));
    groups.push({spot: best, items: members});
  }
  return {groups, nowhere: list.filter(x => !x.spots.length)};
}

/* ---------- gifts ---------- */
function whereIs(name){
  const n = name.toLowerCase(), s = S.date.s;
  for(const c of CRIT3){
    const x = D[c].find(i => i.n.toLowerCase() === n);
    if(x){ const now = x.s[s] > 0; return {kind: TYPE_LABEL[c], ok: now, text: now ? 'available now' : 'in ' + x.s.map((v,i) => v ? SEAS2[i] : '').filter(Boolean).join('/')}; }
  }
  let x = D.crops.find(i => i.n.toLowerCase() === n);
  if(x){ const now = x.s[s] > 0; return {kind:'Crop', ok: now, text: now ? 'grows now, ' + x.g.split(' / ')[0] : 'grows in ' + x.s.map((v,i) => v ? SEAS2[i] : '').filter(Boolean).join('/')}; }
  x = D.recipes.find(i => i.n.toLowerCase() === n);
  if(x) return {kind:'Recipe', ok:true, text: x.m + (x.src ? ' · from ' + x.src : '')};
  x = D.gems.find(i => i.n.toLowerCase() === n); if(x) return {kind:'Gem', ok:true, text:'geodes and mine nodes'};
  x = D.artifacts.find(i => i.n.toLowerCase() === n); if(x) return {kind:'Artifact', ok:true, text:'from ' + x.w.toLowerCase()};
  return null;
}
const heartCost = n => 250 + 50 * n;   // friendship points to go from n-1 to n hearts
function heartsGain(h, pts){
  let lvl = h, left = pts, gained = 0;
  while(left > 0 && lvl < 12){ const c = heartCost(lvl + 1); if(left >= c){ left -= c; lvl++; gained++; } else { gained += left / c; left = 0; } }
  return Math.round(gained * 10) / 10;
}
function giftCard(v, n){
  const hr = heartsOf(v), soon = n !== null && n <= 14;
  const li = g => { const w = whereIs(g); return `<li>${esc(g)}${w ? ` <span class="tag ${w.ok ? 'kelp' : ''}">${esc(w.kind)} · ${esc(w.text)}</span>` : ''}</li>`; };
  return `<li class="ppl gcard"><div class="ppl-h"><div style="flex:1;min-width:0"><div class="nm">${esc(v.n)} ${soon ? `<span class="tag sun">birthday ${n === 0 ? 'today' : 'in ' + plural(n,'day')}</span>` : ''}</div>
    <div class="small muted">♥ ${hr}${v.b ? ' · birthday ' + dateOf(v) : ''}</div></div>${heartBtn('people', v.id, v.n)}</div>
    ${soon ? `<div class="small">A Loved gift on the birthday is worth <b>700 points</b>, about ${heartsGain(hr,700)} hearts at your level (Osmium quality: 1,400, about ${heartsGain(hr,1400)}).</div>` : ''}
    <div class="gifts"><b>Loves</b><ul class="gl">${v.loved.map(li).join('') || '<li class="muted">—</li>'}</ul>
    ${v.liked && v.liked.length ? `<b>Likes</b> ${esc(v.liked.join(', '))}<br>` : ''}${v.hated.length ? `<b>Avoid</b> ${esc(v.hated.join(', '))}` : ''}</div></li>`;
}
function giftsView(){
  const up = D.villagers.filter(v => v.b).map(v => ({v, n: untilBirthday(v.b)})).filter(x => x.n <= 14).sort((a,b) => a.n - b.n);
  const sel = D.villagers.find(v => v.id === ui.gv);
  const uni = D.universal || {};
  let h = `<section><div class="h-row"><h2>Gift planner</h2></div><p class="lead">A Loved gift is 140 friendship points, a Liked one 70. On a birthday everything counts five times. Quality multiplies too: Bronze ×1.15, Silver ×1.3, Gold ×1.5, Osmium ×2.</p></section>`;
  h += `<section><div class="h-row"><h2>Next two weeks</h2><span class="aside">${plural(up.length,'birthday')}</span></div>` +
    (up.length ? `<ul class="list">${up.map(({v,n}) => giftCard(v,n)).join('')}</ul>` : `<div class="empty">No birthdays in the next 14 days.</div>`) + `</section>`;
  h += `<section><div class="h-row"><h2>Any villager</h2></div><select id="gvsel" aria-label="Choose a villager"><option value="">Choose a villager…</option>${D.villagers.slice().sort((a,b) => a.n.localeCompare(b.n)).map(v => `<option value="${v.id}" ${ui.gv === v.id ? 'selected' : ''}>${esc(v.n)}</option>`).join('')}</select>` +
    (sel ? `<ul class="list" style="margin-top:10px">${giftCard(sel, sel.b ? untilBirthday(sel.b) : null)}</ul>` : '') + `</section>`;
  h += `<section><div class="h-row"><h2>Good for everyone</h2></div><p class="lead">Loved by all: ${esc((uni.loved || []).join(', ') || '—')}. Liked by all: ${esc((uni.liked || []).join(', ') || '—')}.</p></section>`;
  return h;
}

/* ---------- best crop to plant ---------- */
function cropsView(){
  const cur = S.date.s, s = ui.cropS ?? cur, left = 28 - S.date.d, q = (ui.q || '').toLowerCase();
  const room = s === cur ? left : 27;        // days available between planting and the end of the season
  const startDay = s === cur ? S.date.d : 1;
  let crops = q ? D.crops.filter(c => c.n.toLowerCase().includes(q)) : D.crops.filter(c => c.s[s]);
  const info = c => { const g = growDays(c), rg = regrow(c); const n = g <= room ? 1 + (rg ? Math.floor((room - g) / rg) : 0) : 0; return {g, rg, n, ready: startDay + g}; };
  crops = crops.slice().sort((a,b) => (info(b).n > 0) - (info(a).n > 0) || b.ppd - a.ppd);
  let h = `<section><div class="h-row"><h2>Best crop to plant</h2><span class="aside">${s === cur ? plural(left,'day') + ' left in ' + SEAS[s] : 'planted on day 1'}</span></div>
    <p class="lead">Ranked by gold per day. Crops that cannot ripen before the season ends go to the bottom.</p></section>
    <div class="toolbar"><input type="search" id="q" placeholder="Search a crop" value="${esc(ui.q)}" aria-label="Search crops"><div class="tabs">${SEAS.map((n,i) => `<button class="chip" data-act="crops" data-s="${i}" aria-pressed="${i === s && !q}">${n}${i === cur ? '<small>now</small>' : ''}</button>`).join('')}</div></div>`;
  h += crops.length ? `<ul class="list">${crops.map((c, i) => {
    const f = info(c);
    return `<li class="row"><div class="body"><div class="ttl">${esc(c.n)} <span class="tag">${esc(c.t)}</span>${i < 3 && f.n > 0 && !q ? ' <span class="tag kelp">top pick</span>' : ''}${f.n === 0 ? ' <span class="tag coral">too late</span>' : ''}</div>
      <div class="sub">${esc(c.g)} · seed ${c.seed} · sells ${c.p} · <b>${c.ppd}</b> gold/day${f.n ? ` · ${plural(f.n,'harvest')}, first on ${fmt(fromAbs(absDay({y:S.date.y, s, d:1}) + f.ready - 1))}` : ''}</div></div>${heartBtn('crops', c.id, c.n)}</li>`;
  }).join('')}</ul>` : `<div class="empty">No crop matches.</div>`;
  return h;
}

/* ---------- today's route ---------- */
function routeView(){
  const d = S.date, s = d.s;
  let h = `<section><div class="h-row"><h2>Today’s route</h2><span class="aside">${fmt(d)}</span></div>
    <p class="lead">Built from your date, the time and the weather. Change them here or in the bar at the bottom.</p>
    <div class="tabs">${TIMES.map(t => `<button class="chip" data-act="settime" data-t="${t}" aria-pressed="${S.time === t}">${t}</button>`).join('')}</div>
    <div class="tabs" style="margin-top:8px">${WEATHERS.map(w => `<button class="chip" data-act="setwx" data-w="${w}" aria-pressed="${S.weather === w}">${WX_LABEL[w]}</button>`).join('')}</div></section>`;
  const fest = festOn(s, d.d), bd = bdayOn(s, d.d);
  let ev = '';
  fest.forEach(f => ev += `<li class="row"><div class="body"><div class="ttl">${esc(f.n)} <span class="tag coral">${esc(f.time)}</span></div><div class="sub">${esc(f.where)}. ${esc(f.note)}</div></div></li>`);
  bd.forEach(v => ev += `<li class="row"><div class="body"><div class="ttl">Give ${esc(v.n)} a gift <span class="tag sun">birthday</span></div><div class="sub">Loves: ${esc(v.loved.slice(0,5).join(', ') || '—')}</div></div></li>`);
  if(ev) h += `<section><div class="h-row"><h2>Fixed plans</h2></div><ul class="list">${ev}</ul></section>`;
  const M = missingSeason(s).filter(x => x.now && nowOk(x.it));
  const {groups, nowhere} = routeGroups(M);
  h += `<section><div class="h-row"><h2>Catch route</h2><span class="aside">${plural(M.length,'creature')} · ${S.time} · ${WX_LABEL[S.weather]}</span></div>`;
  if(!M.length) h += `<div class="empty">Nothing you are missing bites right now. Try another time or weather above.</div>`;
  else {
    h += groups.map((g, i) => `<div class="rt"><div class="rt-h"><span class="rt-n num">${i + 1}</span><b>${esc(g.spot)}</b><span class="muted small">${g.items.length + ' to catch'}</span></div>
      <ul class="list">${g.items.map(x => `<li class="row"><div class="body"><div class="ttl">${esc(x.it.n)} <span class="tag">${TYPE_LABEL[x.c]}</span>${x.leaving ? ' <span class="tag coral">last chance</span>' : ''}</div><div class="sub">${esc(x.it.t || '')}${x.it.r ? ' · ' + esc(x.it.r) : ''}</div></div></li>`).join('')}</ul></div>`).join('');
    if(nowhere.length) h += `<p class="small muted">Location unclear for: ${esc(nowhere.map(x => x.it.n).join(', '))}. Open them in the guide for details.</p>`;
  }
  h += `</section>`;
  return h;
}

/* ---------- favourites and recent (used on Today) ---------- */
function favoritesSection(){
  const keys = Object.keys(S.fav || {});
  let h = `<section><div class="h-row"><h2>My favourites</h2><span class="aside num">${keys.length}</span></div>`;
  if(!keys.length) return h + `<div class="empty">Tap ♡ on any creature, crop, recipe or villager to keep it here.</div></section>`;
  const s = S.date.s;
  const rows = keys.slice(0, 10).map(k => {
    const [c, id] = k.split(':'), it = lookup(c, id); if(!it) return '';
    let sub = '';
    if(c === 'people'){ const n = it.b ? untilBirthday(it.b) : null; sub = `♥ ${heartsOf(it)}${n !== null ? ' · birthday ' + (n === 0 ? 'today' : 'in ' + plural(n,'day')) : ''}`; }
    else if(CRIT3.includes(c)) sub = (S.done[c][id] ? 'Donated' : 'Not donated yet') + ' · ' + (it.s[s] > 0 ? 'available in ' + SEAS[s] : 'not in ' + SEAS[s]);
    else if(c === 'crops') sub = (it.s[s] > 0 ? 'Grows in ' + SEAS[s] : 'Not in ' + SEAS[s]) + ' · ' + it.g.split(' / ')[0];
    else if(c === 'recipes') sub = (S.done.recipes[id] ? 'Cooked' : 'Not cooked yet') + ' · ' + it.m;
    else sub = S.done[c] && S.done[c][id] ? 'Donated' : 'Not donated yet';
    return `<li class="row"><div class="body"><div class="ttl">${esc(it.n)} <span class="tag">${TYPE_LABEL[c] || c}</span></div><div class="sub">${esc(sub)}</div></div>${heartBtn(c, id, it.n)}</li>`;
  }).join('');
  return h + `<ul class="list">${rows}</ul></section>`;
}
function recentSection(){
  const r = (S.recent || []).slice(0, 6);
  let h = `<section><div class="h-row"><h2>Recently ticked</h2></div>`;
  if(!r.length) return h + `<div class="empty">Nothing yet. Tick a donation or a recipe and it shows up here.</div></section>`;
  return h + `<ul class="list">${r.map(x => { const it = lookup(x.c, x.id); if(!it) return ''; return `<li class="row"><div class="body"><div class="ttl">${esc(it.n)} <span class="tag kelp">${TYPE_LABEL[x.c] || x.c}</span></div><div class="sub">${fmt(fromAbs(x.d))}, Year ${fromAbs(x.d).y}</div></div></li>`; }).join('')}</ul></section>`;
}

/* ---------- planner (to-do, notes, calendar) ---------- */
function plannerView(){
  let h = `<section><div class="h-row"><h2>To-do list</h2><span class="aside num">${S.todos.filter(t => t.done).length}/${S.todos.length}</span></div><ul class="list">` +
    S.todos.map(t => `<li class="row ${t.done ? 'done' : ''}"><button class="chk" data-act="todo" data-id="${t.id}" aria-pressed="${!!t.done}" aria-label="${esc(t.t)}"></button><div class="body"><div class="ttl">${esc(t.t)}</div></div><button class="star" data-act="tododel" data-id="${t.id}" aria-label="Delete ${esc(t.t)}">×</button></li>`).join('') +
    `<li class="row todo-add"><input type="text" id="todo-in" placeholder="Add a task, e.g. craft 5 bait" aria-label="New task" maxlength="120"><button class="btn sm" data-act="todoadd">Add</button></li></ul>
    ${S.todos.some(t => t.done) ? '<div style="margin-top:8px"><button class="btn sm" data-act="todoclear">Remove ticked tasks</button></div>' : ''}</section>`;
  h += `<section><div class="h-row"><h2>Notes</h2></div><textarea id="notes" placeholder="Anything to remember" aria-label="Notes">${esc(S.notes)}</textarea></section>`;
  return h + calendarView();
}

/* ---------- progress with tabs ---------- */
function museumChecklist(){
  const total = museumTotal(), max = museumMax(), q = (ui.pq || '').toLowerCase();
  let h = `<section><div class="h-row"><h2>Museum</h2><span class="aside num">${total}/${max} donated</span></div>${bar(total, max)}</section>
    <input type="search" id="pq" placeholder="Search the museum" value="${esc(ui.pq || '')}" aria-label="Search the museum">`;
  CATS.forEach(([c, l]) => {
    let list = D[c].slice();
    if(CRIT3.includes(c)) list.sort((a,b) => a.o - b.o);
    if(q) list = list.filter(it => it.n.toLowerCase().includes(q));
    if(q && !list.length) return;
    const have = cnt(c), all = have === D[c].length, open = !!q || !!ui.pexp[c];
    h += `<section class="pc"><div class="pc-h"><button class="pc-t" data-act="pexp" data-c="${c}" aria-expanded="${open}"><b>${l}</b><span class="num muted">${have}/${D[c].length}</span><i class="caret" aria-hidden="true">${open ? '▾' : '▸'}</i></button><button class="btn sm" data-act="psel" data-c="${c}" data-m="${all ? 'off' : 'on'}">${all ? 'Clear all' : 'Select all'}</button></div>${bar(have, D[c].length, 'kelp')}` +
      (open ? `<ul class="list compact">${list.map(it => `<li class="it ${S.done[c][it.id] ? 'done' : ''}"><button class="chk" data-act="tog" data-c="${c}" data-id="${it.id}" aria-pressed="${!!S.done[c][it.id]}" aria-label="Donated: ${esc(it.n)}"></button><div class="it-main"><div class="it-t"><span class="nm">${esc(it.n)}</span></div></div></li>`).join('')}</ul>` : '') + `</section>`;
  });
  return h;
}
function progressHub(){
  const tabs = [['overview','Overview'],['museum','Museum'],['offerings','Offerings']];
  const body = ui.pt === 'museum' ? museumChecklist() : ui.pt === 'offerings' ? offeringsView() : progressView();
  return `<div class="tabs" role="tablist">${tabs.map(([k,l]) => `<button class="chip" role="tab" data-act="pt" data-k="${k}" aria-pressed="${ui.pt === k}">${l}</button>`).join('')}</div>` + body;
}

/* ---------- field guide hub and global search ---------- */
function guideSearch(q){
  const s = q.toLowerCase(), out = [];
  ['fish','insects','critters','fossils','artifacts','gems','crops','recipes'].forEach(c => D[c].forEach(it => { if(it.n.toLowerCase().includes(s)) out.push({t:c, n:it.n, id:it.id}); }));
  D.villagers.forEach(v => { if(v.n.toLowerCase().includes(s)) out.push({t:'people', n:v.n, id:v.id}); });
  D.quests.forEach(x => { if(x.n.toLowerCase().includes(s)) out.push({t:'quests', n:x.n, id:x.id}); });
  const gifts = new Map();
  D.villagers.forEach(v => v.loved.forEach(g => { if(g.toLowerCase().includes(s)){ if(!gifts.has(g)) gifts.set(g, []); gifts.get(g).push(v.n); } }));
  gifts.forEach((who, g) => out.push({t:'gift', n:g, sub:'Loved by ' + who.join(', ')}));
  return out.slice(0, 40);
}
function guideView(){
  const q = (ui.gq || '').trim();
  let h = `<section><div class="h-row"><h2>Field Guide</h2></div><input type="search" id="gq" placeholder="Search items, villagers, recipes, gifts" value="${esc(ui.gq || '')}" aria-label="Search the guide"></section>`;
  if(q.length >= 2){
    const res = guideSearch(q);
    return h + (res.length ? `<ul class="list">${res.map(r => `<li class="row"><button class="grow" data-act="gsel" data-t="${r.t}" data-n="${esc(r.n)}" data-id="${esc(r.id || '')}"><div class="body"><div class="ttl">${esc(r.n)} <span class="tag">${r.t === 'gift' ? 'Gift' : TYPE_LABEL[r.t]}</span></div>${r.sub ? `<div class="sub">${esc(r.sub)}</div>` : ''}</div><span class="chev" aria-hidden="true">›</span></button></li>`).join('')}</ul>` : `<div class="empty">Nothing found for “${esc(q)}”.</div>`);
  }
  const t = (icon, label, sub, go) => `<button class="tile" data-act="g" ${Object.entries(go).map(([k,v]) => `data-${k}="${v}"`).join(' ')}><span class="ti">${svg(icon)}</span><span class="tl"><b>${label}</b><small>${esc(sub)}</small></span></button>`;
  const cnt2 = c => `${cnt(c)}/${D[c].length}`;
  const groups = [
    ['Tools', [
      t('museum','Catchable right now', `${SEAS[S.date.s]} · ${S.time} · ${WX_LABEL[S.weather]}`, {r:'museum', c:'fish', f:'now'}),
      t('route','Today’s route', 'Where to go, in order', {r:'route'}),
      t('farm','Best crop to plant', 'Ranked by gold per day', {r:'crops'}),
      t('gift','Gift planner', 'Birthdays and loved gifts', {r:'gifts'})
    ]],
    ['Villagers', [t('people','Townsfolk & friends', plural(D.villagers.length,'villager'), {r:'people'})]],
    ['Catchables', [t('museum','Fish', cnt2('fish') + ' donated', {r:'museum', c:'fish'}), t('bug','Insects', cnt2('insects') + ' donated', {r:'museum', c:'insects'}), t('museum','Ocean critters', cnt2('critters') + ' donated', {r:'museum', c:'critters'})]],
    ['Minerals & finds', [t('gem','Gems', cnt2('gems') + ' donated', {r:'museum', c:'gems'}), t('bone','Fossils', cnt2('fossils') + ' donated', {r:'museum', c:'fossils'}), t('scroll','Artifacts', cnt2('artifacts') + ' donated', {r:'museum', c:'artifacts'})]],
    ['Farm & town', [t('recipes','Recipes', plural(D.recipes.length,'recipe'), {r:'recipes'}), t('offerings','Offerings', 'Lake Temple altars', {r:'offerings'}), t('quests','Quests', plural(D.quests.length,'quest'), {r:'quests'}), t('farm','Tools & skills', 'Upgrades, masteries, town rank', {r:'farm'}), t('tips','Tips', plural(TIPS.length,'tip'), {r:'tips'})]]
  ];
  return h + groups.map(([g, tiles]) => `<section><div class="h-row"><h2>${g}</h2></div><div class="tiles">${tiles.join('')}</div></section>`).join('');
}

/* ---------- context bar (date, time, weather) ---------- */
function ctxHtml(){
  const d = S.date;
  return `<span class="dot s${d.s}"></span><b>${SEAS[d.s]} ${d.d}</b><span class="dw">, ${DOW[dowOf(d.d)]}</span><span class="sep">·</span>${S.time}<span class="sep">·</span><span class="dot wx-${S.weather}"></span>${WX_LABEL[S.weather]}<span class="chg">Change</span>`;
}
