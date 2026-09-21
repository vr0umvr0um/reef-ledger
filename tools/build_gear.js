// Gear: weapons, rings and clothing (Field Guide "Gear & home", part 1). Adds to tools/data.json.
// Run after build_data.js, build_guide.js, build_shops.js and build_world.js:
//   node tools/build_gear.js && node tools/make_data_js.js
const fs = require('fs');
const path = require('path');
const { get, tables, txt } = require('./wiki.js');

const FILE = path.join(__dirname, 'data.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const warn = [];

const slug = s => s.toLowerCase().replace(/&#39;|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = s => { const m = String(s || '').match(/[\d,]+(?:\.\d+)?/); return m ? +m[0].replace(/,/g, '') : 0; };
const clean = s => String(s || '').replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();
const J = async u => (await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
const members = async cat => ((await J('https://coralisland.fandom.com/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent('Category:' + cat) + '&cmlimit=500&format=json')).query.categorymembers || []).map(x => x.title);
// "Band of Smiles (1200 × 1,200)" -> shop "Band of Smiles", price 1200
const shopPrice = s => { const m = /^(.*?)\s*\(\s*([\d,]+)\s*×\s*[\d,]+\s*\)\s*$/.exec(clean(s)); return m ? { where: m[1], p: num(m[2]) } : { where: clean(s), p: 0 }; };

(async () => {
  /* ---------- WEAPONS ---------- */
  D.weapons = [];
  const wT = tables(await get('Weapon'));
  const kinds = { 1: 'Sword', 2: 'Shield', 3: 'Spear', 4: 'Hammer', 5: 'Other' };
  for (const ti of [1, 2, 3, 4, 5]) {
    const t = wT[ti]; if (!t || !/Damage/.test((t[0] || []).join(' '))) { warn.push('weapon table ' + ti); continue; }
    const head = t[0].map(h => clean(h).toLowerCase());
    const col = re => head.findIndex(h => re.test(h));
    const ix = { n: col(/^item/), dmg: col(/^damage/), def: col(/^defense/), cd: col(/crit\. damage/), cc: col(/crit\. chance/), ch: col(/charge|hits/), desc: col(/^description/), src: col(/^source/) };
    t.slice(1).forEach(c => {
      const n = clean(c[ix.n]); if (!n) return;
      const s = shopPrice(c[ix.src]);
      D.weapons.push({ id: slug(n), n, k: kinds[ti] === 'Other' ? 'Other' : kinds[ti], dmg: num(c[ix.dmg]), def: num(c[ix.def]), cd: clean(c[ix.cd]), cc: clean(c[ix.cc]), ch: ix.ch >= 0 ? clean(c[ix.ch]) : '', desc: clean(c[ix.desc]), src: s.where, p: s.p });
    });
  }

  /* ---------- RINGS (no category on the wiki: find item pages whose type is Ring) ---------- */
  D.rings = [];
  const candidates = fs.readFileSync(path.join(__dirname, 'allpages.txt'), 'utf8').split('\n').filter(t => /ring$/i.test(t) && !/(flooring|spring|earring|offering|string)$/i.test(t));
  for (const title of candidates) {
    let html; try { html = await get(title); } catch (e) { continue; }
    const text = txt(html);
    if (!/Type\s+Ring\b/.test(text)) continue;
    const T = tables(html);
    const desc = clean((new RegExp('^[\\s/]*' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s+(.*?)\\s+Information', 'i').exec(text) || [])[1] || '');
    const shopT = T.find(t => /^Location\|Price/i.test((t[0] || []).join('|')));
    const actT = T.find(t => /^Activity\|Requirement/i.test((t[0] || []).join('|')));
    const how = [];
    if (shopT) shopT.slice(1).forEach(r => how.push('Buy at ' + clean(r[0]) + ' for ' + num(r[1]).toLocaleString('en-US') + (clean(r[2]) && !/^none$/i.test(clean(r[2])) ? ' (' + clean(r[2]) + ')' : '')));
    if (actT) actT.slice(1).forEach(r => how.push(clean(r[0]) + ': ' + clean(r[1])));
    D.rings.push({ id: slug(title), n: title, e: desc, p: T[0] && T[0][1] ? num(T[0][1].join(' ')) : 0, how });
  }
  D.rings.sort((a, b) => a.n.localeCompare(b.n));

  /* ---------- CLOTHING ---------- */
  D.clothing = [];
  const add = (n, k, w, p, r) => { if (!n) return; D.clothing.push({ id: slug(k) + '-' + slug(n), n, k, w, p, r: r || '' }); };
  const wf = tables(await get('White Flamingo'));
  [[0, 'Outfit'], [1, 'Top'], [2, 'Bottom'], [3, 'Footwear'], [4, 'Glasses'], [5, 'Hat'], [6, 'Backpack']].forEach(([ti, k]) => {
    if (!wf[ti]) { warn.push('flamingo ' + ti); return; }
    wf[ti].slice(1).forEach(c => add(clean(c[0]), k, 'White Flamingo', num(c[1]), clean(c[2])));
  });
  const pf = tables(await get('Pufferfish Shop'));
  if (pf[0]) pf[0].slice(1).forEach(c => add(clean(c[0]), 'Outfit', 'Pufferfish Shop (online)', num(c[1]), ''));
  const tailShop = D.shops.find(s => s.n === "Cho Oyu's Tail Shop");
  if (tailShop) tailShop.stock.forEach(it => add(it.n, 'Tail', "Cho Oyu's Tail Shop", it.p, ''));
  // everything else in the wiki's clothing category: known by name only
  const have = new Set(D.clothing.map(x => x.n.toLowerCase()));
  const footwear = new Set((await members('Footwear')).map(x => x.toLowerCase()));
  const glasses = new Set((await members('Glasses')).map(x => x.toLowerCase()));
  const tails = new Set((await members('Tail')).map(x => x.toLowerCase()));
  (await members('Clothing')).forEach(n => {
    if (have.has(n.toLowerCase())) return;
    const k = tails.has(n.toLowerCase()) ? 'Tail' : footwear.has(n.toLowerCase()) ? 'Footwear' : glasses.has(n.toLowerCase()) ? 'Glasses' : /backpack$/i.test(n) ? 'Backpack' : /wing$/i.test(n) ? 'Backpack' : /(hat|cap|beanie|crown|helmet|headband|bonnet|beret)$/i.test(n) ? 'Hat' : /(shirt|top|sweater|hoodie|jacket|blouse|tee|sweatshirt|cardigan|vest|coat)$/i.test(n) ? 'Top' : /(pants|trouser|skirt|shorts|jeans|skorts|leggings)$/i.test(n) ? 'Bottom' : /outfit|suit|yukata|costume|dress|kimono|uniform/i.test(n) ? 'Outfit' : 'Other';
    add(n, k, 'Other sources', 0, '');
  });
  const seen = {}; D.clothing.forEach(x => { seen[x.id] = (seen[x.id] || 0) + 1; if (seen[x.id] > 1) x.id += '-' + seen[x.id]; });

  /* ---------- FURNITURE AND DECOR (Furniture Store: indoor and outdoor, Pufferfish Shop) ---------- */
  D.furniture = [];
  {
    const T = tables(await get('Furniture Store'));
    T[0].slice(1).forEach(c => { if (c[0]) D.furniture.push({ n: clean(c[0]), p: num(c[1]), sz: clean(c[2]), t: clean(c[3]).replace(/^Decorations$/, 'Decoration'), st: clean(c[4]), r: clean(c[5]), w: 'Furniture Store', o: 'Indoor' }); });
    T[1].slice(1).forEach(c => { if (c[0]) D.furniture.push({ n: clean(c[0]), p: num(c[1]), sz: clean(c[2]), t: clean(c[3]), st: clean(c[4]), r: '', w: 'Furniture Store', o: 'Outdoor' }); });
    const pf2 = tables(await get('Pufferfish Shop'))[1];
    if (pf2) pf2.slice(1).forEach(c => { if (c[0]) D.furniture.push({ n: clean(c[0]), p: num(c[1]), sz: '', t: 'Decoration', st: 'Pufferfish', r: '', w: 'Pufferfish Shop (online)', o: 'Outdoor' }); });
    // the wiki spells a few labels two ways
    D.furniture.forEach(x => { if (x.st === 'Gaming') x.st = 'Gaming Room'; if (/^outdoor furniture$/i.test(x.t)) x.t = 'Outdoor furniture'; });
    const seen = {};
    D.furniture.forEach(x => { x.id = slug(x.n) + '-' + slug(x.o); seen[x.id] = (seen[x.id] || 0) + 1; if (seen[x.id] > 1) x.id += '-' + seen[x.id]; });
  }

  fs.writeFileSync(FILE, JSON.stringify(D));
  console.log(JSON.stringify({ weapons: D.weapons.length, rings: D.rings.length, clothing: D.clothing.length, furniture: D.furniture.length }));
  console.log('furniture styles:', JSON.stringify(D.furniture.reduce((a, w) => (a[w.st] = (a[w.st] || 0) + 1, a), {})));
  console.log('furniture types:', JSON.stringify(D.furniture.reduce((a, w) => (a[w.t] = (a[w.t] || 0) + 1, a), {})));
  console.log('weapons by kind:', JSON.stringify(D.weapons.reduce((a, w) => (a[w.k] = (a[w.k] || 0) + 1, a), {})));
  console.log('clothing by kind:', JSON.stringify(D.clothing.reduce((a, w) => (a[w.k] = (a[w.k] || 0) + 1, a), {})));
  console.log('clothing by shop:', JSON.stringify(D.clothing.reduce((a, w) => (a[w.w] = (a[w.w] || 0) + 1, a), {})));
  console.log('warnings:', warn.length ? warn.join('; ') : 'none', '| size', fs.statSync(FILE).size);
})().catch(e => { console.log('ERR', e.stack); process.exit(1); });
