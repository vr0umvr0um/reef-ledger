// Quick sanity check: runs the app scripts against a stub DOM and renders every view for several dates.
// Usage: node tools/smoke.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = ['data.js', 'people.js', 'tips.js', 'features.js', 'app.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');

const els = {};
const mk = id => els[id] || (els[id] = { id, innerHTML: '', hidden: false, className: '', title: '', textContent: '', addEventListener() {}, querySelector() { return null; }, matches() { return false; }, focus() {}, value: '' });
const store = {};
global.window = { scrollTo() {}, addEventListener() {} };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } };
global.document = { querySelector: s => mk(s), getElementById: s => mk(s), activeElement: null, addEventListener() {}, documentElement: { removeAttribute() {}, setAttribute() {} } };
global.navigator = { userAgent: 'node' };
global.matchMedia = () => ({ matches: false });
global.location = { search: '', protocol: 'file:' };

(0, eval)(src + '\n;globalThis.__T={SHIP_CATS,shipTotal,shipMax,CATALOG,VIEWS,ui,get S(){return S},D,TIPS,dailyTips,contextTips,addDays,absDay,todayView};');
const T = globalThis.__T;
let bad = 0;
const check = (name, h) => { if (typeof h !== 'string' || /undefined|NaN|\[object/.test(h)) { bad++; console.log('SUSPECT', name, (String(h).match(/.{0,60}(undefined|NaN|\[object).{0,60}/) || [])[0]); } };

const dates = [{ y: 1, s: 3, d: 28 }, { y: 1, s: 3, d: 20 }, { y: 2, s: 0, d: 1 }, { y: 2, s: 0, d: 21 }, { y: 1, s: 1, d: 12 }, { y: 1, s: 2, d: 28 }];
for (const dt of dates) {
  T.S.date = dt;
  for (const k of Object.keys(T.VIEWS)) check(k + ' ' + JSON.stringify(dt), T.VIEWS[k]());
}
T.S.date = { y: 1, s: 3, d: 28 };
for (const c of ['fish', 'insects', 'critters', 'fossils', 'artifacts', 'gems']) { T.ui.cat = c; check('museum ' + c, T.VIEWS.museum()); }
T.ui.cat = 'fish';
for (const c of Object.keys(T.CATALOG)) {
  T.ui.gc = c; T.ui.gf = 'All'; T.ui.gs = false;
for (const r of ['shops','upgrades']) { T.ui.route = r; T.ui.q = ''; check(r, T.VIEWS[r]()); }
T.ui.q = 'sprinkler'; check('shops search', T.VIEWS.shops()); T.ui.q = ''; T.ui.ugNeed = true; for (const g of ['All','Tools','Bag','Buildings','Lab']) { T.ui.ug = g; check('upgrades ' + g, T.VIEWS.upgrades()); } T.ui.ug = 'All';
for (const v of T.D.villagers) { T.ui.open['pd:' + v.id] = true; } T.ui.route = 'people'; T.ui.q = ''; T.ui.pf = 'all'; check('people details', T.VIEWS.people()); for (const w of ['Sunny','Rain']) { T.S.weather = w; check('people details ' + w, T.VIEWS.people()); } T.S.weather = 'Sunny'; T.ui.open = {};
T.ui.route = 'progress'; T.ui.pt = 'shipped'; T.ui.sq = ''; T.ui.shipMiss = false;
check('shipped', T.VIEWS.progress()); T.ui.shipExp = {fish:true,artisan:true}; check('shipped open', T.VIEWS.progress()); T.ui.sq = 'juice'; check('shipped search', T.VIEWS.progress()); T.ui.sq = '';
console.log('shippable items:', T.shipMax(), 'in', T.SHIP_CATS.length, 'categories'); T.ui.gmore = true;
  const h = T.VIEWS.catalog(); check('catalog ' + c, h);
  const groups = T.CATALOG[c].groups || [...new Set(T.CATALOG[c].items().map(T.CATALOG[c].groupOf))];
  T.ui.gf = groups[0]; check('catalog ' + c + ' group', T.VIEWS.catalog()); T.ui.gs = true; check('catalog ' + c + ' season', T.VIEWS.catalog());
  console.log(c, T.CATALOG[c].items().length, 'items,', (h.match(/class="it"/g) || []).length, 'rows,', groups.length, 'groups');
}
T.ui.gf = 'All'; T.ui.gs = false;
for (const t of ['Morning', 'Afternoon', 'Evening', 'Night']) { T.ui.time = t; const h = T.VIEWS.museum(); check('time ' + t, h); console.log(t, (h.match(/class="it /g) || []).length, 'fish shown'); }
T.ui.time = 'any';
T.ui.q = 'hummus'; T.ui.route = 'people'; const ph = T.VIEWS.people(); console.log('people who love hummus:', (ph.match(/class="ppl"/g) || []).length); T.ui.q = '';
for (let sh = 0; sh < 3; sh++) { T.ui.tipShift = sh; console.log('tips shift', sh, T.dailyTips({ s: 3, d: 28, y: 1, left: 0, date: T.S.date, abs: T.absDay(T.S.date) }, sh).map(t => t.id).join(',')); }
console.log('context tips today:', T.contextTips({ s: 3, d: 28, y: 1, left: 0, date: T.S.date, abs: T.absDay(T.S.date) }).map(t => t.id).join(','));
console.log('total tips:', T.TIPS.length, '| unique ids:', new Set(T.TIPS.map(t => t.id)).size);
console.log(bad ? 'PROBLEMS: ' + bad : 'OK');
