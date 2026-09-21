// Sell prices by quality (Basic, Bronze, Silver, Gold, Osmium).
// The general rule is base x 1 / 1.15 / 1.3 / 1.5 / 2, rounded to the nearest whole number (it matches the wiki for every fish
// and insect). Some items follow their own numbers, so for crops, foraged items, animal goods and artisan goods we read the
// item pages and store only the tiers that differ from the rule (D.qtiers), and the items with a single price (D.noq).
// Run after the other build_*.js scripts:  node tools/build_quality.js && node tools/make_data_js.js
const fs = require('fs');
const path = require('path');
const { get, tables } = require('./wiki.js');

const FILE = path.join(__dirname, 'data.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const MULT = [1, 1.15, 1.3, 1.5, 2];
const rule = p => MULT.map(m => Math.round(p * m + 1e-9));
const ints = s => (String(s || '').match(/\d[\d,]*/g) || []).map(x => +x.replace(/,/g, ''));
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

(async () => {
  D.qtiers = {};
  D.noq = [];
  const report = {};
  // critters: check the rule against the wiki table too
  {
    const T = tables(await get('Critter'))[0].slice(1); let ok = 0, bad = 0;
    T.forEach(c => { const n = ints(String(c[2]).replace('Base:', '')); if (n.length >= 5) { if (same(rule(n[0]), n.slice(0, 5))) ok++; else { bad++; D.qtiers['critters:' + c[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')] = n.slice(0, 5); } } });
    report.critters = { ok, differ: bad };
  }
  for (const cat of ['crops', 'foraged', 'animalGoods', 'artisan']) {
    let ok = 0, differ = 0, single = 0, missing = 0;
    const done = {};
    for (const it of D[cat]) {
      const key = cat + ':' + it.id;
      if (done[it.n]) { const r = done[it.n]; if (r === 'noq') D.noq.push(key); else if (r) D.qtiers[key] = r; continue; }
      let tiers = null;
      try {
        const t = tables(await get(it.n))[0];
        const row = t && t[1] ? ints(t[1].join(' ')) : [];
        if (row.length >= 5) tiers = row.slice(0, 5);
        else if (row.length >= 1) tiers = 'noq';
      } catch (e) { missing++; done[it.n] = null; continue; }
      if (tiers === 'noq') { D.noq.push(key); single++; done[it.n] = 'noq'; continue; }
      // artisan goods follow their own numbers, so every one of them is stored (or hidden when the wiki has none)
      const own = cat === 'artisan';
      if (!tiers || tiers[0] !== it.p) { missing++; done[it.n] = own ? 'noq' : null; if (own) D.noq.push(key); continue; }
      if (same(rule(it.p), tiers)) ok++; else differ++;
      // the other categories follow the rule; the few odd values in the wiki look like typos (e.g. a Silver price above Gold's neighbour)
      if (own) { D.qtiers[key] = tiers; done[it.n] = tiers; } else done[it.n] = null;
    }
    report[cat] = { total: D[cat].length, matchRule: ok, ownNumbers: differ, singlePrice: single, unknown: missing };
  }
  fs.writeFileSync(FILE, JSON.stringify(D));
  console.log(JSON.stringify(report, null, 1));
  console.log('overrides:', Object.keys(D.qtiers).length, '| single-price items:', D.noq.length, '| size', fs.statSync(FILE).size);
})().catch(e => { console.log('ERR', e.stack); process.exit(1); });
