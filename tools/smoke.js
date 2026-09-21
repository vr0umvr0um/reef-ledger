// Quick sanity check: runs the app scripts against a stub DOM and renders every view for several dates.
// Usage: node tools/smoke.js
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const src = ['data.js', 'tips.js', 'app.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n;\n');

const els = {};
const mk = id => els[id] || (els[id] = { id, innerHTML: '', hidden: false, className: '', title: '', textContent: '', addEventListener() {}, querySelector() { return null; }, matches() { return false; }, focus() {}, value: '' });
const store = {};
global.window = { scrollTo() {}, addEventListener() {} };
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = v; } };
global.document = { querySelector: s => mk(s), getElementById: s => mk(s), activeElement: null, addEventListener() {}, documentElement: { removeAttribute() {}, setAttribute() {} } };
global.navigator = { userAgent: 'node' };
global.matchMedia = () => ({ matches: false });
global.location = { search: '', protocol: 'file:' };

(0, eval)(src + '\n;globalThis.__T={VIEWS,ui,get S(){return S},D,TIPS,dailyTips,contextTips,addDays,absDay,todayView};');
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
for (const t of ['Morning', 'Afternoon', 'Evening', 'Night']) { T.ui.time = t; const h = T.VIEWS.museum(); check('time ' + t, h); console.log(t, (h.match(/class="it /g) || []).length, 'fish shown'); }
T.ui.time = 'any';
T.ui.q = 'hummus'; T.ui.route = 'people'; const ph = T.VIEWS.people(); console.log('people who love hummus:', (ph.match(/class="ppl"/g) || []).length); T.ui.q = '';
for (let sh = 0; sh < 3; sh++) { T.ui.tipShift = sh; console.log('tips shift', sh, T.dailyTips({ s: 3, d: 28, y: 1, left: 0, date: T.S.date, abs: T.absDay(T.S.date) }, sh).map(t => t.id).join(',')); }
console.log('context tips today:', T.contextTips({ s: 3, d: 28, y: 1, left: 0, date: T.S.date, abs: T.absDay(T.S.date) }).map(t => t.id).join(','));
console.log('total tips:', T.TIPS.length, '| unique ids:', new Set(T.TIPS.map(t => t.id)).size);
console.log(bad ? 'PROBLEMS: ' + bad : 'OK');
