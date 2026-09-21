/* Field Guide hub, planner, gift planner, best crops, route, favourites and other views.
   Loaded before app.js: only function/const declarations here; they run later, once app.js has defined S, D and ui. */

const WEATHERS = ['Sunny','Windy','Rain','Storm','Snow','Blizzard'];
const WX_LABEL = {Sunny:'Sunny', Windy:'Windy', Rain:'Rainy', Storm:'Stormy', Snow:'Snowy', Blizzard:'Blizzard'};
const TYPE_LABEL = {fish:'Fish', insects:'Insect', critters:'Critter', fossils:'Fossil', artifacts:'Artifact', gems:'Gem', crops:'Crop', recipes:'Recipe', people:'Villager', quests:'Quest', seeds:'Seed', foraged:'Foraged', animalGoods:'Animal good', artisan:'Artisan good', animals:'Farm animal', upgrades:'Upgrade', shops:'Shop', stock:'For sale'};

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
  const annual = D.crops.filter(c => c.k === 'Crop');
  let crops = q ? annual.filter(c => c.n.toLowerCase().includes(q)) : annual.filter(c => c.s[s]);
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
    else if(CATALOG[c]) sub = CATALOG[c].sub(it);
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
  const tabs = [['overview','Overview'],['museum','Museum'],['shipped','Shipped'],['offerings','Offerings']];
  const body = ui.pt === 'museum' ? museumChecklist() : ui.pt === 'shipped' ? shippedView() : ui.pt === 'offerings' ? offeringsView() : progressView();
  return `<div class="tabs" role="tablist">${tabs.map(([k,l]) => `<button class="chip" role="tab" data-act="pt" data-k="${k}" aria-pressed="${ui.pt === k}">${l}</button>`).join('')}</div>` + body;
}

/* ---------- field guide hub and global search ---------- */
function guideSearch(q){
  const s = q.toLowerCase(), out = [];
  ['fish','insects','critters','fossils','artifacts','gems','crops','seeds','foraged','animalGoods','artisan','recipes'].forEach(c => D[c].forEach(it => { if(it.n.toLowerCase().includes(s)) out.push({t:c, n:it.n, id:it.id}); }));
  D.villagers.forEach(v => { if(v.n.toLowerCase().includes(s)) out.push({t:'people', n:v.n, id:v.id}); });
  D.quests.forEach(x => { if(x.n.toLowerCase().includes(s)) out.push({t:'quests', n:x.n, id:x.id}); });
  D.animals.forEach(x => { if(x.n.toLowerCase().includes(s)) out.push({t:'animals', n:x.n, id:x.id}); });
  D.upgrades.forEach(x => { if(x.n.toLowerCase().includes(s)) out.push({t:'upgrades', n:x.n, id:x.id, sub:x.where + ' · ' + (x.cost ? fmtNum(x.cost) + ' coins' : 'free')}); });
  D.shops.forEach(x => { if(x.n.toLowerCase().includes(s)) out.push({t:'shops', n:x.n, id:x.id}); });
  const sold = new Map();
  D.shops.forEach(sh => sh.stock.forEach(it => { if(it.n.toLowerCase().includes(s)){ if(!sold.has(it.n)) sold.set(it.n, []); sold.get(it.n).push(sh.n + (it.p ? ' (' + fmtNum(it.p) + ')' : '')); } }));
  sold.forEach((where, n) => out.push({t:'stock', n, sub:'Sold at ' + where.slice(0, 4).join(', ') + (where.length > 4 ? '…' : '')}));
  const gifts = new Map();
  D.villagers.forEach(v => v.loved.forEach(g => { if(g.toLowerCase().includes(s)){ if(!gifts.has(g)) gifts.set(g, []); gifts.get(g).push(v.n); } }));
  gifts.forEach((who, g) => out.push({t:'gift', n:g, sub:'Loved by ' + who.join(', ')}));
  return out.slice(0, 50);
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
    ['Farm & forage', [t('farm','Crops & plants', plural(D.crops.length,'plant'), {r:'catalog', gc:'crops'}), t('farm','Seeds & saplings', plural(D.seeds.length,'listing'), {r:'catalog', gc:'seeds'}), t('recipes','Foraged items', plural(D.foraged.length,'item'), {r:'catalog', gc:'foraged'})]],
    ['Goods', [t('offerings','Animal goods', plural(D.animalGoods.length,'product'), {r:'catalog', gc:'animalGoods'}), t('recipes','Artisan goods', plural(D.artisan.length,'product'), {r:'catalog', gc:'artisan'}), t('recipes','Cooked dishes', plural(D.recipes.length,'recipe'), {r:'recipes'})]],
    ['Shops & upgrades', [t('recipes','Shops', plural(D.shops.length,'shop') + ' · hours and stock', {r:'shops'}), t('farm','Upgrades & buildings', upgBuilt() + '/' + D.upgrades.length + ' built', {r:'upgrades', ug:'All'}), t('offerings','Farm animals', plural(D.animals.length,'animal'), {r:'catalog', gc:'animals'})]],
    ['Town & progress', [t('offerings','Offerings', 'Lake Temple altars', {r:'offerings'}), t('scroll','Shipping log', shipTotal() + '/' + shipMax() + ' shipped', {r:'progress', pt:'shipped'}), t('quests','Quests', plural(D.quests.length,'quest'), {r:'quests'}), t('farm','Tools & skills', 'Upgrades, masteries, town rank', {r:'farm'}), t('tips','Tips', plural(TIPS.length,'tip'), {r:'tips'})]]
  ];
  return h + groups.map(([g, tiles]) => `<section><div class="h-row"><h2>${g}</h2></div><div class="tiles">${tiles.join('')}</div></section>`).join('');
}

/* ---------- context bar (date, time, weather) ---------- */
function ctxHtml(){
  const d = S.date;
  return `<span class="dot s${d.s}"></span><b>${SEAS[d.s]} ${d.d}</b><span class="dw">, ${DOW[dowOf(d.d)]}</span><span class="sep">·</span>${S.time}<span class="sep">·</span><span class="dot wx-${S.weather}"></span>${WX_LABEL[S.weather]}<span class="chg">Change</span>`;
}

/* ---------- catalogues (batch 1): crops, seeds, foraged, animal goods, artisan goods ---------- */
const byName = (a, b) => a.n.localeCompare(b.n);
const uniqSorted = arr => [...new Set(arr)];
const CATALOG = {
  crops: {
    label: 'Crops & plants', seasonal: true, note: 'Vegetables, fruit plants, fruit trees and ocean crops. Use the Best crop tool to rank vegetables by gold per day.',
    items: () => D.crops, groupOf: it => it.k, groups: ['Crop','Fruit plant','Fruit tree','Ocean crop'],
    sub: it => [it.g, 'seed ' + it.seed, 'sells ' + it.p].join(' · '),
    detail: it => [['Type', it.t], ['Kind', it.k], ['Town rank', it.rank || '—'], ['Growth', it.g], ['Seed price', it.seed], ['Sell price', it.p], it.max ? ['Max harvest', it.max] : null, it.ppd ? ['Gold per day', it.ppd] : null, it.s.some(Boolean) ? null : ['Season', 'not listed by the wiki']]
  },
  seeds: {
    label: 'Seeds & saplings', seasonal: true, note: 'Where each seed, seedling and sapling is sold. Some shops only open on festival days.',
    items: () => D.seeds, groupOf: it => it.w, groups: null,
    sub: it => [it.w, 'costs ' + it.p + (it.pr ? ' (range ' + it.pr + ')' : ''), it.lim ? 'limit ' + it.lim : ''].filter(Boolean).join(' · '),
    detail: it => [['Kind', it.k], ['Sold at', it.w], ['Price', it.p], it.pr ? ['Price range', it.pr] : null, ['Town rank', it.rank || '—'], it.lim ? ['Purchase limit', it.lim] : null]
  },
  foraged: {
    label: 'Foraged items', seasonal: true, note: 'Wild plants, shells and other finds. Ocean items are gathered while diving.',
    items: () => D.foraged, groupOf: it => it.sec, groups: ['All-season','Beach','Ocean','Seasonal'],
    sub: it => [it.g, 'sells ' + it.p, 'restores ' + it.e + ' energy / ' + it.h + ' health'].join(' · '),
    detail: it => [['Group', it.g], ['Where', it.sec], ['Sell price', it.p], ['Energy', it.e], ['Health', it.h]]
  },
  animalGoods: {
    label: 'Animal goods', seasonal: false, note: 'What each farm animal produces. Large versions come from well-cared-for animals.',
    items: () => D.animalGoods, groupOf: it => it.a, groups: null,
    sub: it => [it.a, 'sells ' + it.p, it.d ? 'every ' + it.d + ' day' + (it.d === '1' ? '' : 's') : ''].filter(Boolean).join(' · '),
    detail: it => [['Animal', it.a], ['Sell price', it.p], it.d ? ['Produced every', it.d + ' day(s)'] : null, ['Size', it.big ? 'Large' : 'Regular']]
  },
  animals: {
    label: 'Farm animals', seasonal: false, note: 'Every animal you can keep, where it lives, what it produces and what it costs at the Ranch.',
    items: () => D.animals, groupOf: it => it.h, groups: null,
    sub: it => [it.h, 'buy ' + fmtNum(it.p), 'sells ' + fmtNum(it.sell), it.prod ? 'gives ' + it.prod.split(', ').slice(0, 2).join(', ') : ''].filter(Boolean).join(' · '),
    detail: it => [['Lives in', it.h], ['Buy price', fmtNum(it.p)], ['Sell price', fmtNum(it.sell)], it.rank ? ['Town rank', it.rank] : null, it.d ? ['Produces every', it.d + ' day(s)'] : null, it.prod ? ['Products', it.prod] : null, it.tool ? ['Collected with', it.tool] : null, it.desc ? ['About', it.desc] : null]
  },
  artisan: {
    label: 'Artisan goods', seasonal: false, note: 'Everything your machines can make, with ingredients, time and sell price.',
    items: () => D.artisan, groupOf: it => it.m, groups: null,
    sub: it => [it.i, it.t, it.p ? 'sells ' + it.p : ''].filter(Boolean).join(' · '),
    detail: it => [['Machine', it.m], ['Ingredients', it.i], ['Time', it.t], it.p ? ['Sell price', it.p] : null, it.e || it.h ? ['Restores', it.e + ' energy / ' + it.h + ' health'] : null]
  }
};
function catalogView(){
  const c = CATALOG[ui.gc] ? ui.gc : 'crops', cfg = CATALOG[c];
  const s = S.date.s, q = (ui.q || '').toLowerCase();
  const all = cfg.items();
  const groups = cfg.groups || uniqSorted(all.map(cfg.groupOf));
  let arr = all.filter(it => (ui.gf === 'All' || cfg.groupOf(it) === ui.gf) && (!ui.gs || !cfg.seasonal || it.s[s]) && (!q || it.n.toLowerCase().includes(q)));
  arr = arr.slice().sort(byName);
  const cap = ui.gmore ? 5000 : 120, shown = arr.slice(0, cap);
  let h = `<section><div class="h-row"><h2>${esc(cfg.label)}</h2><span class="aside num">${all.length}</span></div><p class="lead">${esc(cfg.note)}</p></section>`;
  h += `<div class="tabs" role="tablist"><button class="chip" data-act="gf" data-g="All" aria-pressed="${ui.gf === 'All'}">All<small class="num">${all.length}</small></button>${groups.map(g => `<button class="chip" data-act="gf" data-g="${esc(g)}" aria-pressed="${ui.gf === g}">${esc(g)}<small class="num">${all.filter(it => cfg.groupOf(it) === g).length}</small></button>`).join('')}</div>`;
  h += `<div class="toolbar"><input type="search" id="q" placeholder="Search ${esc(cfg.label.toLowerCase())}" value="${esc(ui.q)}" aria-label="Search">${cfg.seasonal ? `<div class="r"><button class="chip" data-act="gs" aria-pressed="${ui.gs}">In season now (${SEAS[s]})</button></div>` : ''}</div>`;
  h += `<p class="small muted">${arr.length} shown</p>`;
  h += shown.length ? `<ul class="list">${shown.map(it => {
    const open = !!ui.open[c + ':' + it.id];
    const det = open ? `<dl class="det">${cfg.detail(it).filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : '';
    return `<li class="it"><div class="it-main" role="button" tabindex="0" aria-expanded="${open}" data-act="open" data-k="${c}:${it.id}"><div class="it-t"><span class="nm">${esc(it.n)}</span>${cfg.seasonal ? seasonChips(it) : ''}<em class="tag">${esc(cfg.groupOf(it))}</em>${isShipped(c, it.id) ? '<em class="tag kelp">Shipped</em>' : ''}</div><div class="it-s">${esc(cfg.sub(it))}</div>${det}</div>${heartBtn(c, it.id, it.n)}</li>`;
  }).join('')}</ul>${arr.length > cap ? `<div style="margin-top:10px"><button class="btn" data-act="gmore">Show all ${arr.length}</button></div>` : ''}` : `<div class="empty">Nothing matches these filters.</div>`;
  return h;
}

/* ---------- shipping log: what you have sold at least once ---------- */
const SHIP_CATS = [['fish','Fish'],['insects','Insects'],['critters','Ocean critters'],['gems','Gems'],['crops','Crops & plants'],['foraged','Foraged items'],['animalGoods','Animal goods'],['artisan','Artisan goods']];
const shipKey = (c, id) => c + ':' + id;
const isShipped = (c, id) => !!(S.ship && S.ship[shipKey(c, id)]);
const shipCount = c => D[c].filter(it => isShipped(c, it.id)).length;
const shipTotal = () => SHIP_CATS.reduce((a, [c]) => a + shipCount(c), 0);
const shipMax = () => SHIP_CATS.reduce((a, [c]) => a + D[c].length, 0);
function shipList(c){
  const q = (ui.sq || '').toLowerCase();
  let list = D[c].slice();
  if(CRIT3.includes(c)) list.sort((a, b) => a.o - b.o); else list.sort(byName);
  if(q) list = list.filter(it => it.n.toLowerCase().includes(q));
  if(ui.shipMiss) list = list.filter(it => !isShipped(c, it.id));
  return list;
}
const shipSub = (c, it) => CATALOG[c] ? CATALOG[c].groupOf(it) : 'sells ' + it.p;
function shippedView(){
  const total = shipTotal(), max = shipMax(), q = (ui.sq || '').trim();
  let h = `<section><div class="h-row"><h2>Shipping log</h2><span class="aside num">${total}/${max} shipped</span></div>${bar(total, max, 'kelp')}<p class="lead">Tick what you have sold at least once. Open a category to see its items.</p></section>
    <div class="toolbar"><input type="search" id="sq" placeholder="Search everything you can ship" value="${esc(ui.sq)}" aria-label="Search shippable items"><div class="r"><button class="chip" data-act="shpmiss" aria-pressed="${ui.shipMiss}">Not shipped yet</button></div></div>`;
  SHIP_CATS.forEach(([c, l]) => {
    const list = shipList(c);
    if((q || ui.shipMiss) && !list.length) return;
    const have = shipCount(c), n = D[c].length, open = !!q || !!ui.shipExp[c], filtered = !!q || ui.shipMiss;
    const allShown = list.length > 0 && list.every(it => isShipped(c, it.id));
    const cap = ui.shipAll[c] ? 5000 : 150;
    h += `<section class="pc"><div class="pc-h"><button class="pc-t" data-act="shpexp" data-c="${c}" aria-expanded="${open}"><b>${l}</b><span class="num muted">${have}/${n}</span><i class="caret" aria-hidden="true">${open ? '▾' : '▸'}</i></button><button class="btn sm" data-act="shpsel" data-c="${c}" data-m="${allShown ? 'off' : 'on'}">${allShown ? 'Clear' : 'Select'} ${filtered ? 'shown' : 'all'}</button></div>${bar(have, n, 'kelp')}` +
      (open ? `<ul class="list compact">${list.slice(0, cap).map(it => `<li class="it ${isShipped(c, it.id) ? 'done' : ''}"><button class="chk" data-act="shp" data-c="${c}" data-id="${it.id}" aria-pressed="${isShipped(c, it.id)}" aria-label="Shipped: ${esc(it.n)}"></button><div class="it-main"><div class="it-t"><span class="nm">${esc(it.n)}</span><em class="tag">${esc(shipSub(c, it))}</em></div></div></li>`).join('')}</ul>${list.length > cap ? `<button class="btn sm" data-act="shpall" data-c="${c}">Show all ${list.length}</button>` : ''}` : '') + `</section>`;
  });
  return h;
}

/* ---------- shops: hours, opening days and stock ---------- */
const fmtNum = n => Number(n).toLocaleString('en-US');
function shopStatus(sh){
  const day = DOWL[dowOf(S.date.d)], closed = sh.closed || '', open = sh.open || '';
  if(!sh.hrs && !closed && !open) return {k:'unknown', t:''};
  const re = new RegExp(day, 'i');
  if(re.test(closed)) return {k:'closed', t:'Closed today'};
  if(/rain|storm/i.test(closed) && (S.weather === 'Rain' || S.weather === 'Storm')) return {k:'closed', t:'Closed in this weather'};
  if(open && !re.test(open)) return {k:'closed', t:'Closed today'};
  return {k:'open', t:'Open today'};
}
function shopsView(){
  const q = (ui.q || '').toLowerCase();
  const hit = (sh, it) => it.n.toLowerCase().includes(q);
  const match = sh => !q || sh.n.toLowerCase().includes(q) || sh.own.toLowerCase().includes(q) || sh.loc.toLowerCase().includes(q) || sh.stock.some(it => hit(sh, it));
  const list = D.shops.slice().sort(byName).filter(sh => match(sh) && (ui.sf !== 'stock' || sh.stock.length) && (ui.sf !== 'open' || shopStatus(sh).k === 'open'));
  let h = `<section><div class="h-row"><h2>Shops</h2><span class="aside">${DOWL[dowOf(S.date.d)]}</span></div><p class="lead">Hours, opening days and stock. Search for an item to see where it is sold. Clothing and furniture stock is not listed.</p></section>
    <div class="toolbar"><input type="search" id="q" placeholder="Search a shop, an owner or an item for sale" value="${esc(ui.q)}" aria-label="Search shops"><div class="tabs">${[['all','All shops'],['open','Open today'],['stock','With stock listed']].map(([k, l]) => `<button class="chip" data-act="sf" data-k="${k}" aria-pressed="${ui.sf === k}">${l}</button>`).join('')}</div></div>`;
  if(!list.length) return h + `<div class="empty">No shop matches.</div>`;
  h += `<ul class="list">` + list.map(sh => {
    const st = shopStatus(sh), searching = !!q && sh.stock.some(it => hit(sh, it)), open = searching || !!ui.open['shop:' + sh.id];
    let panel = '';
    if(open && sh.stock.length){
      let items = sh.stock;
      if(searching && !(sh.n.toLowerCase().includes(q))) items = items.filter(it => hit(sh, it));
      const cap = ui.open['shopall:' + sh.id] || searching ? 5000 : 60;
      const groups = [...new Set(items.map(it => it.g))];
      panel = `<div class="stock">` + groups.map(g => `${groups.length > 1 ? `<div class="grp">${esc(g)}</div>` : ''}<ul class="sl">${items.filter(it => it.g === g).slice(0, cap).map(it => `<li><span class="sn">${esc(it.n)}</span><span class="sp num">${it.p ? fmtNum(it.p) : ''}</span><span class="sx">${[it.pr ? 'range ' + it.pr : '', it.r ? 'rank ' + it.r : '', it.s && !/^any$/i.test(it.s) ? it.s : '', it.lim ? 'limit ' + it.lim : '', it.req || '', it.x && it.x !== it.n ? it.x : ''].filter(Boolean).map(esc).join(' · ')}</span></li>`).join('')}</ul>`).join('') +
        (items.length > cap ? `<button class="btn sm" data-act="shopall" data-id="${sh.id}">Show all ${items.length}</button>` : '') + `</div>`;
    }
    return `<li class="shop"><div class="it"><div class="it-main" role="button" tabindex="0" aria-expanded="${open}" data-act="${sh.stock.length ? 'open' : 'none'}" data-k="shop:${sh.id}"><div class="it-t"><span class="nm">${esc(sh.n)}</span>${st.k !== 'unknown' ? `<em class="tag ${st.k === 'open' ? 'kelp' : 'coral'}">${st.t}</em>` : ''}${sh.stock.length ? `<em class="tag">${sh.stock.length} items</em>` : ''}</div>
      <div class="it-s">${[sh.loc, sh.hrs, sh.own ? 'run by ' + sh.own : '', sh.open ? 'open ' + sh.open : '', sh.closed ? 'closed ' + sh.closed : ''].filter(Boolean).map(esc).join(' · ')}</div></div></div>${panel}</li>`;
  }).join('') + `</ul>`;
  return h;
}

/* ---------- upgrades and buildings, with materials to tick ---------- */
const TIER_NAMES = ['Bronze', 'Silver', 'Gold', 'Osmium'];
const BASE_TOOLS = new Set(['axe', 'hoe', 'pickaxe', 'scythe', 'watering can', 'fishing pole', 'bug net']);
const UPG_GROUPS = ['Tools', 'Bag', 'Buildings', 'Lab'];
const upgBuilt = () => D.upgrades.filter(u => S.upg[u.id]).length;
// 'base' = a starting tool, 'built' = an earlier upgrade you already built, 'ticked' = gathered, false = still needed
function matHave(u, i){
  const n = u.mats[i].n.toLowerCase();
  if(BASE_TOOLS.has(n)) return 'base';
  const prev = D.upgrades.find(x => x.n.toLowerCase() === n);
  if(prev && S.upg[prev.id]) return 'built';
  return (S.mat[u.id] && S.mat[u.id][i]) ? 'ticked' : false;
}
function upgNeeds(list){
  let gold = 0, left = 0; const mats = {};
  list.filter(u => !S.upg[u.id]).forEach(u => { left++; gold += u.cost; u.mats.forEach((m, i) => { if(!matHave(u, i)) mats[m.n] = (mats[m.n] || 0) + m.q; }); });
  return {gold, left, mats: Object.entries(mats).sort((a, b) => b[1] - a[1])};
}
function tierOf(u){ return TIER_NAMES.findIndex(n => u.n.startsWith(n)) + 1; }
function syncToolsFromUpgrades(){
  TOOLS.forEach(t => {
    const ups = D.upgrades.filter(u => u.g === 'Tools' && u.sub.toLowerCase() === t.toLowerCase());
    if(!ups.length) return;
    S.tools[t] = Math.max(0, ...ups.filter(u => S.upg[u.id]).map(tierOf));
  });
}
function syncUpgradesFromTool(t){
  const tier = S.tools[t] || 0;
  D.upgrades.filter(u => u.g === 'Tools' && u.sub.toLowerCase() === t.toLowerCase()).forEach(u => { if(tierOf(u) <= tier) S.upg[u.id] = 1; else delete S.upg[u.id]; });
}
function upgradesView(){
  const g = ui.ug, list = D.upgrades.filter(u => g === 'All' || u.g === g);
  const built = list.filter(u => S.upg[u.id]).length, need = upgNeeds(list);
  let h = `<section><div class="h-row"><h2>Upgrades & buildings</h2><span class="aside num">${upgBuilt()}/${D.upgrades.length} built</span></div>
    <p class="lead">Tick an upgrade once it is built, and tick each material as you gather it. Earlier tiers and your starting tools count automatically.</p></section>
    <div class="tabs">${['All', ...UPG_GROUPS].map(k => { const l = D.upgrades.filter(u => k === 'All' || u.g === k); return `<button class="chip" data-act="ug" data-g="${k}" aria-pressed="${g === k}">${k === 'Lab' ? 'Laboratory' : k}<small class="num">${l.filter(u => S.upg[u.id]).length}/${l.length}</small></button>`; }).join('')}</div>
    <section><div class="progress-head"><b class="num">${built}<span class="muted" style="font:600 16px var(--body)"> / ${list.length}</span></b><span class="muted small">${need.left ? fmtNum(need.gold) + ' coins left to spend' : 'everything built'}</span></div>${bar(built, list.length, 'kelp')}
    ${need.left ? `<div style="margin-top:10px"><button class="chip" data-act="ugneed" aria-pressed="${ui.ugNeed}">Shopping list: materials still needed</button></div>` : ''}
    ${ui.ugNeed && need.left ? `<div class="need">${need.mats.length ? need.mats.map(([n, q]) => `<span class="chip on">${esc(n)} <small>×${fmtNum(q)}</small></span>`).join('') : '<span class="muted small">All materials are ticked.</span>'}</div>` : ''}</section>`;
  let prev = '';
  h += `<ul class="list">` + list.map(u => {
    const isBuilt = !!S.upg[u.id];
    const head = (u.g + '|' + u.sub) !== prev ? `<li class="grp">${g === 'All' ? esc(u.g === 'Lab' ? 'Laboratory' : u.g) + ' · ' : ''}${esc(u.sub)}</li>` : '';
    prev = u.g + '|' + u.sub;
    return head + `<li class="it ${isBuilt ? 'done' : ''}"><button class="chk" data-act="ugb" data-id="${u.id}" aria-pressed="${isBuilt}" aria-label="Built: ${esc(u.n)}"></button><div class="it-main"><div class="it-t"><span class="nm">${esc(u.n)}</span></div>
      <div class="it-s">${[u.where, u.cost ? fmtNum(u.cost) + ' coins' : 'no coins', u.t, u.rank ? 'rank ' + u.rank : ''].filter(Boolean).map(esc).join(' · ')}</div>${u.note ? `<div class="it-s">${esc(u.note)}</div>` : ''}
      ${u.mats.length ? `<div class="chips mats">${u.mats.map((m, i) => { const st = matHave(u, i); return `<button class="chip ${st ? 'on' : ''}" data-act="ugm" data-id="${u.id}" data-i="${i}" aria-pressed="${!!st}" ${st === 'base' || st === 'built' ? 'disabled' : ''}>${esc(m.n)}<small>×${fmtNum(m.q)}${st === 'base' ? ' · you have it' : st === 'built' ? ' · built' : ''}</small></button>`; }).join('')}</div>` : ''}</div></li>`;
  }).join('') + `</ul>`;
  return h;
}
