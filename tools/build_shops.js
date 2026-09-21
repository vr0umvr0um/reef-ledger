// Batch 3 of the Field Guide: shops (hours + stock), upgrades with materials, farm animals.
// Reads tools/data.json and adds to it. Run after build_data.js and build_guide.js:
//   node tools/build_data.js && node tools/build_guide.js && node tools/build_shops.js && node tools/make_data_js.js
const fs = require('fs');
const path = require('path');
const { get, tables, txt } = require('./wiki.js');

const FILE = path.join(__dirname, 'data.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const warn = [];

const slug = s => s.toLowerCase().replace(/&#39;|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = s => { const m = String(s || '').match(/[\d,]+(?:\.\d+)?/); return m ? +m[0].replace(/,/g, '') : 0; };
const clean = s => String(s || '').replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();
const oneLine = s => String(s || '').split('/').map(p => clean(p).replace(/\.$/, '')).filter(Boolean).join('. ');

// "Wood × 100 Stone × 50 × 2,000" or "× 1,500 Axe × 1 Bronze bar × 5": items are "Name × n", a nameless "× n" is the price
function costAndMats(str) {
  const tokens = [...String(str || '').matchAll(/([^×]*)×\s*([\d,]+)/g)].map(m => ({ n: clean(m[1]).replace(/^\/\s*/, ''), q: num(m[2]) }));
  let cost = 0; const mats = [];
  tokens.forEach(t => { if (!t.n) cost = t.q; else mats.push(t); });
  return { cost, mats };
}
// Rows that lost a rowspan cell have one cell fewer than the header: put the previous value back.
function carryCol(rows, width, col) {
  let last = '';
  return rows.map(r => {
    if (r.length === width) { last = r[col]; return r; }
    if (r.length === width - 1) { const c = r.slice(); c.splice(col, 0, last); return c; }
    return r;
  });
}

(async () => {
  /* ---------- SHOPS: hours ---------- */
  const shopRows = tables(await get('Shops'))[0].slice(1);
  D.shops = shopRows.map(c => ({ id: slug(c[0]), n: c[0], loc: clean(c[1]), hrs: clean(c[2]), open: clean(c[3]), closed: clean(c[4]), own: clean(c[5]), stock: [] })).filter(s => s.n);
  const byName = n => D.shops.find(s => s.n.toLowerCase() === n.toLowerCase());
  const alias = { 'Ramen Shop': 'Mrs. Ramen' };

  /* ---------- SHOPS: stock ---------- */
  const STOCK = [
    ["Sam's General Store", 0, 'General', { n: 0, p: 1, r: 2, s: 3 }],
    ["Sam's General Store", 1, 'Seeds & plants', { n: 0, p: 1, r: 2, s: 3 }],
    ['Caravan', 1, 'Stock', { n: 0, p: 1, pr: 2, r: 6, s: 7 }],
    ['Black Market', 0, 'Stock', { n: 0, p: 1, x: 2, lim: 3 }, 2, 4],
    ['Beach Shack', 0, 'Bait & scents', { n: 0, p: 1, x: 2, s: 4, req: 5 }],
    ['Sanchez Brothers Blacksmith', 0, 'Supplies', { n: 0, p: 1, r: 2, req: 3 }],
    ['Carpenter', 0, 'Supplies', { n: 0, p: 1, r: 2 }],
    ['Laboratory', 0, 'Supplies', { n: 0, p: 1, r: 2 }],
    ['Ranch', 0, 'Supplies', { n: 0, p: 1, r: 2, req: 3 }],
    ['Pet shelter', 0, 'Supplies', { n: 0, p: 1 }],
    ["Ratih's Float Market", 0, 'Artisan goods', { n: 0, p: 1, x: 2 }, 2, 3],
    ["Ratih's Float Market", 1, 'Produce', { n: 0, p: 1, x: 2 }],
    ["Ratih's Float Market", 2, 'Seeds', { n: 0, p: 1, s: 2, r: 3 }],
    ['Merfolk General Store', 0, 'Stock', { n: 0, p: 1, r: 2, s: 3 }],
    ['Ramen Shop', 0, 'Menu', { n: 0, p: 1 }],
    ["Cho Oyu's Tail Shop", 0, 'Tails', { n: 0, p: 1, req: 2 }]
  ];
  for (const [page, ti, group, cols, carry, width] of STOCK) {
    const shop = byName(alias[page] || page);
    if (!shop) { warn.push('no shop ' + page); continue; }
    let rows = tables(await get(page))[ti];
    if (!rows) { warn.push('no table ' + page + ' #' + ti); continue; }
    rows = rows.slice(1);
    if (carry !== undefined) rows = carryCol(rows, width, carry);
    rows.forEach(c => {
      const n = c[cols.n]; if (!n || /^\/?\s*$/.test(n)) return;
      const it = { n: clean(n), g: group, p: num(c[cols.p]) };
      if (cols.pr !== undefined && c[cols.pr]) it.pr = clean(c[cols.pr]).replace(/^×\s*/, '');
      if (cols.r !== undefined && c[cols.r]) it.r = clean(c[cols.r]);
      if (cols.s !== undefined && c[cols.s]) it.s = clean(c[cols.s]);
      if (cols.x !== undefined && c[cols.x]) it.x = clean(c[cols.x]);
      if (cols.lim !== undefined && c[cols.lim]) it.lim = clean(c[cols.lim]);
      if (cols.req !== undefined && c[cols.req]) it.req = clean(c[cols.req]);
      shop.stock.push(it);
    });
  }
  // Library: books to read (no price)
  {
    const lib = tables(await get('Library'))[0].slice(1);
    D.shops.push({ id: 'library', n: 'Library', loc: 'Town', hrs: '', open: '', closed: '', own: '', stock: lib.map(c => ({ n: clean(c[1]), g: 'Books', p: 0, r: clean(c[3]), x: 'Section ' + clean(c[2]) + (clean(c[4]) ? ' · ' + clean(c[4]) : '') })).filter(x => x.n) });
  }

  /* ---------- UPGRADES ---------- */
  D.upgrades = [];
  const TIERS = ['Bronze', 'Silver', 'Gold', 'Osmium'];
  const add = u => { u.id = slug(u.g) + '-' + slug(u.n); if (D.upgrades.some(x => x.id === u.id)) u.id += '-' + D.upgrades.length; D.upgrades.push(u); };
  const toolOf = name => name.replace(/^(Bronze|Silver|Gold|Osmium)\s+/i, '').replace(/^./, ch => ch.toUpperCase());

  // tools: blacksmith + beach shack
  for (const page of ['Sanchez Brothers Blacksmith', 'Beach Shack']) {
    const ti = 1;
    tables(await get(page))[ti].slice(1).forEach(c => {
      const { cost, mats } = costAndMats(c[1]);
      if (!c[0]) return;
      add({ g: 'Tools', sub: toolOf(c[0]), n: c[0], cost, mats, t: clean(c[2]), note: '', where: page === 'Beach Shack' ? 'Beach Shack' : 'Blacksmith' });
    });
  }
  // bag
  tables(await get("Sam's General Store"))[2].slice(1).forEach(c => {
    add({ g: 'Bag', sub: 'Backpack', n: 'Bag ' + c[0].replace(/^Upgrade/, 'upgrade'), cost: num(c[1]), mats: [], t: '', note: 'Carries ' + num(c[2]) + ' items' + (clean(c[3]) ? '. ' + clean(c[3]) : ''), where: "Sam's General Store" });
  });
  // buildings and house: carpenter
  tables(await get('Carpenter'))[1].slice(1).forEach(c => {
    if (!c[0]) return;
    const { cost, mats } = costAndMats(c[1]);
    const sub = /^House stage/i.test(c[0]) ? 'House' : /level/i.test(c[0]) ? 'Animal house upgrades' : 'Farm buildings';
    add({ g: 'Buildings', sub, n: c[0], cost, mats, t: clean(c[3]), note: oneLine(c[2]), where: 'Carpenter' });
  });
  // laboratory: equipment
  tables(await get('Laboratory'))[3].slice(1).forEach(c => {
    if (!c[0]) return;
    const { cost, mats } = costAndMats(c[1]);
    add({ g: 'Lab', sub: 'Equipment', n: c[0], cost, mats, t: '', note: oneLine(c[2]), rank: clean(c[3]), where: 'Laboratory' });
  });
  // laboratory: produce quality upgrades (seeds, seedlings, saplings, hay)
  {
    const t = tables(await get('Laboratory'))[1];
    const price = (t.find(r => /^Price/i.test(r[0])) || []).slice(1).map(num);
    const days = (t.find(r => /^Days/i.test(r[0])) || []).slice(1).map(num);
    t.filter(r => /Essence cost/i.test(r[0])).forEach(r => {
      const what = r[0].replace(/\s*Essence cost.*/i, '');
      const label = { Seeds: 'seeds', Seedling: 'seedlings', Sapling: 'saplings', Hay: 'hay (animal products)' }[what] || what.toLowerCase();
      TIERS.forEach((tier, i) => {
        add({ g: 'Lab', sub: 'Quality upgrades', n: tier + ' ' + label, cost: price[i] || 0, mats: [{ n: tier + ' kelp essence', q: num(r[i + 1]) }], t: (days[i] || 2) + ' days', note: 'Raises the quality of ' + label + ' you grow or collect', where: 'Laboratory' });
      });
    });
  }

  /* ---------- FARM ANIMALS ---------- */
  const ranch = {};
  tables(await get('Ranch'))[1].slice(1).forEach(c => { ranch[c[0].toLowerCase()] = { desc: oneLine(c[2]), rank: clean(c[3]), house: clean(c[4]) }; });
  D.animals = [];
  tables(await get('Farm animals'))[2].slice(1).forEach(c => {
    const n = c[1]; if (!n) return;
    const r = ranch[n.toLowerCase()] || {};
    D.animals.push({ id: slug(n), n, h: clean(c[2]), p: num(c[4]), sell: num(c[5]), d: clean(c[6]), prod: clean(c[7]).replace(/\s*\/\s*/g, ', '), tool: clean(c[8]), rank: r.rank || '', desc: r.desc || '' });
  });

  fs.writeFileSync(FILE, JSON.stringify(D));
  const withStock = D.shops.filter(s => s.stock.length);
  console.log(JSON.stringify({ shops: D.shops.length, shopsWithStock: withStock.length, stockItems: D.shops.reduce((a, s) => a + s.stock.length, 0), upgrades: D.upgrades.length, animals: D.animals.length }));
  console.log('by group:', JSON.stringify(D.upgrades.reduce((a, u) => (a[u.g] = (a[u.g] || 0) + 1, a), {})));
  console.log('stock:', withStock.map(s => s.n + '=' + s.stock.length).join(', '));
  console.log('warnings:', warn.length ? warn.join('; ') : 'none', '| size', fs.statSync(FILE).size);
})().catch(e => { console.log('ERR', e.stack); process.exit(1); });
