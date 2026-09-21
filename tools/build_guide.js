// Batch 1 of the Field Guide: crops and plants, seeds, foraged items, animal goods, artisan goods, dish stats.
// Reads tools/data.json (from build_data.js) and adds to it. Run: node tools/build_data.js && node tools/build_guide.js && node tools/make_data_js.js
const fs = require('fs');
const path = require('path');
const { get, tables, txt } = require('./wiki.js');

const FILE = path.join(__dirname, 'data.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const warn = [];

const slug = s => s.toLowerCase().replace(/&#39;|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = s => { const m = String(s || '').match(/[\d,]+(?:\.\d+)?/); return m ? +m[0].replace(/,/g, '') : 0; };
const clean = s => String(s || '').replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();
const nums = s => (String(s || '').match(/\d+/g) || []).map(Number);
const SEAS = ['Spring', 'Summer', 'Fall', 'Winter'];
const seasons = str => {
  const t = String(str || '');
  if (!t.trim() || /any/i.test(t)) return { s: [1, 1, 1, 1], any: true };
  const s = SEAS.map(n => (new RegExp(n, 'i').test(t) ? 1 : 0));
  return s.some(Boolean) ? { s, any: false } : { s: [1, 1, 1, 1], any: true };
};
const stripQty = s => clean(String(s).replace(/\s*×\s*[\d,]+\s*$/, ''));
// Rows whose first cell (a rowspan) is missing have one cell fewer than the header.
function withCarry(rows, width, keyCol = 0) {
  let last = '';
  return rows.map(r => {
    if (r.length === width) { last = r[keyCol]; return r; }
    if (r.length === width - 1) { const c = r.slice(); c.splice(keyCol, 0, last); return c; }
    return r;
  });
}

(async () => {
  /* ---------- CROPS: keep the annual crops, add fruit plants, fruit trees and ocean crops ---------- */
  D.crops.forEach(c => { c.k = 'Crop'; });
  const fpT = tables(await get('Fruit plant'));
  const ftT = tables(await get('Fruit tree'));
  const ocT = tables(await get('Ocean crops'));
  const cropT = tables(await get('Crop'));

  const shopSeasons = {};
  [...withCarry(fpT[0].slice(1), 6), ...withCarry(ftT[0].slice(1), 5)].forEach(r => {
    const name = r[1].replace(/\s+(seedling|sapling)$/i, '');
    if (r[3] !== undefined && /spring|summer|fall|winter|any/i.test(r[3])) shopSeasons[name.toLowerCase()] = r[3];
  });
  const addPlant = (rows, kind) => rows.slice(1).forEach(c => {
    if (!c[0]) return;
    const sea = seasons(shopSeasons[c[0].toLowerCase()]);
    D.crops.push({ id: slug(c[0]) + '-' + slug(kind), n: c[0], t: c[1], s: shopSeasons[c[0].toLowerCase()] ? sea.s : [0, 0, 0, 0], g: clean(c[3]), seed: num(c[4]), p: num(c[5]), max: 0, ppd: 0, k: kind, rank: c[2] });
  });
  addPlant(fpT[2], 'Fruit plant');
  addPlant(ftT[3], 'Fruit tree');
  // ocean crops: season comes from the seed-mixing table
  const ocSeason = {};
  ocT[0].slice(1).forEach(c => { ocSeason[(c[1] || '').replace(/\s+seeds$/i, '').toLowerCase()] = c[4]; });
  ocT[3].slice(1).forEach(c => {
    const n = c[1]; if (!n) return;
    const sea = seasons(ocSeason[n.toLowerCase()]);
    D.crops.push({ id: slug(n) + '-ocean', n, t: c[2], s: ocSeason[n.toLowerCase()] ? sea.s : [1, 1, 1, 1], g: clean(c[4]), seed: num(c[5]), p: num(c[6]), max: num(c[7]), ppd: parseFloat((c[8] || '').replace(/Base:/, '').match(/[\d.]+/) || [0])[0], k: 'Ocean crop', rank: c[3] });
  });
  D.crops.filter(c => !c.rank).forEach(c => { c.rank = ''; });

  /* ---------- SEEDS, SEEDLINGS AND SAPLINGS (where to buy) ---------- */
  D.seeds = [];
  const seedRow = (c, kind, cols) => {
    const n = c[cols.item]; if (!n) return;
    D.seeds.push({ id: slug(n), n, k: kind, w: c[0], p: num(c[cols.price]), pr: cols.range ? clean(c[cols.range]).replace(/^×\s*/, '') : '', ...seasons(c[cols.season]), rank: clean(c[cols.rank]), lim: cols.limit ? clean(c[cols.limit]) : '' });
  };
  withCarry(cropT[0].slice(1), 7).forEach(c => seedRow(c, 'Seed', { item: 1, price: 2, range: 3, season: 4, rank: 5, limit: 6 }));
  withCarry(fpT[0].slice(1), 6).forEach(c => seedRow(c, 'Seedling', { item: 1, price: 2, season: 3, rank: 4, limit: 5 }));
  withCarry(ftT[0].slice(1), 5).forEach(c => seedRow(c, 'Sapling', { item: 1, price: 2, season: 3, rank: 4 }));
  // the same seed can be sold in several shops: keep every row, make ids unique
  const seen = {};
  D.seeds.forEach(x => { seen[x.id] = (seen[x.id] || 0) + 1; if (seen[x.id] > 1) x.id += '-' + seen[x.id]; });

  /* ---------- FORAGED ITEMS ---------- */
  D.foraged = [];
  const fT = tables(await get('Foraging'));
  [[5, 'All-season'], [6, 'Beach'], [7, 'Ocean'], [8, 'Seasonal']].forEach(([ti, sec]) => {
    fT[ti].slice(1).forEach(c => {
      const n = c[1]; if (!n) return;
      const [e, h] = nums(c[5]);
      D.foraged.push({ id: slug(n) + '-' + slug(sec), n, g: clean(c[2]).replace(/\s*scavengeable\s*/i, ' ').replace(/\s+/g, ' ').trim(), sec, ...seasons(c[3]), p: num(c[4]), e: e || 0, h: h || 0 });
    });
  });

  /* ---------- ANIMAL GOODS ---------- */
  const animalsT = tables(await get('Farm animals'))[2];
  const madeBy = {};
  animalsT.slice(1).forEach(c => {
    const animal = c[1]; if (!animal) return;
    String(c[7] || '').split('/').map(x => x.trim()).filter(Boolean).forEach(p => { madeBy[p.toLowerCase()] = { animal, days: c[6] }; });
  });
  const J = async u => (await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
  const cat = await J('https://coralisland.fandom.com/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent('Category:Animal products') + '&cmlimit=500&format=json');
  D.animalGoods = [];
  for (const m of cat.query.categorymembers) {
    let html; try { html = await get(m.title); } catch (e) { warn.push('animal page ' + m.title); continue; }
    const T = tables(html);
    const base = T[0] && T[0][1] ? num(T[0][1][0]) : 0;
    const restores = T[2] && T[2][1] ? nums(T[2][1][0]) : [];
    const text = txt(html);
    const src = (/Sources\s+(.*?)\s+Sell prices/.exec(text) || [])[1] || '';
    const known = madeBy[m.title.toLowerCase()];
    D.animalGoods.push({
      id: slug(m.title), n: m.title, p: base, e: restores[0] || 0, h: restores[1] || 0,
      a: known ? known.animal : clean(src.replace(/^Other\s+/i, '').replace(/\//g, ' ')).split(' ').slice(0, 3).join(' ') || 'Unknown',
      d: known ? known.days : '', big: /^Large /i.test(m.title)
    });
  }
  D.animalGoods.sort((a, b) => a.a.localeCompare(b.a) || a.p - b.p);

  /* ---------- ARTISAN GOODS ---------- */
  const aT = tables(await get('Artisan equipment'));
  const machines = ['Aging barrel', 'Bee house', 'Cheese press', 'Dehydrator', 'Keg', 'Loom', 'Mason jar', 'Mayonnaise machine', 'Mill', 'Oil press', 'Tap'];
  D.machines = aT[0].slice(1).map(c => ({ id: slug(stripQty(c[0])), n: stripQty(c[0]), i: clean(c[1]), u: clean(c[2]) })).filter(x => x.n);
  D.artisan = [];
  machines.forEach((mach, i) => {
    const t = aT[2 + i];
    if (!t) { warn.push('no table for ' + mach); return; }
    const head = t[0].join(' ');
    const isLoom = /^Item/.test(head);
    t.slice(1).forEach(c => {
      const n = stripQty(c[0]); if (!n) return;
      const [e, h] = nums(c[4]);
      D.artisan.push({ id: slug(mach) + '-' + slug(n) + (D.artisan.some(x => x.id === slug(mach) + '-' + slug(n)) ? '-' + D.artisan.length : ''), n, m: mach, i: clean(c[1]), t: clean(c[2]).replace(/\bhours?\b/, 'h'), p: isLoom ? num(c[3]) : num(c[3]), e: e || 0, h: h || 0 });
    });
  });

  /* ---------- COOKED DISHES: restores and buff ---------- */
  const cookT = tables(await get('Cooking'))[0];
  const byId = Object.fromEntries(D.recipes.map(r => [r.id, r]));
  cookT.slice(1).forEach(c => {
    const id = slug(c[0].replace(/×\s*\d+.*/, ''));
    const r = byId[id]; if (!r) return;
    const m = /^(\d+)\s+(\d+)(?:\s*\/\s*(.+))?$/.exec(clean(c[3]));
    if (m) { r.e = +m[1]; r.h = +m[2]; r.b = m[3] ? clean(m[3]) : ''; }
    const yields = /×\s*(\d+)/.exec(c[0]); r.y = yields ? +yields[1] : 1;
  });

  fs.writeFileSync(FILE, JSON.stringify(D));
  const counts = { crops: D.crops.length, seeds: D.seeds.length, foraged: D.foraged.length, animalGoods: D.animalGoods.length, artisan: D.artisan.length, machines: D.machines.length, recipesWithStats: D.recipes.filter(r => r.e !== undefined).length };
  console.log(JSON.stringify(counts));
  console.log('warnings:', warn.length ? warn.join('; ') : 'none');
  console.log('size', fs.statSync(FILE).size);
})().catch(e => { console.log('ERR', e.stack); process.exit(1); });
