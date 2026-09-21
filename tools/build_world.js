// Batch 4 of the Field Guide: monsters and drops, geodes, resources, ocean seed mixing, extras, crafting recipes,
// and villager details (heart events, schedules). Adds to tools/data.json and writes tools/people.json.
// Run after build_data.js, build_guide.js and build_shops.js.
const fs = require('fs');
const path = require('path');
const { get, tables, txt, dec } = require('./wiki.js');

const FILE = path.join(__dirname, 'data.json');
const D = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const warn = [];

const slug = s => s.toLowerCase().replace(/&#39;|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = s => { const m = String(s || '').match(/[\d,]+(?:\.\d+)?/); return m ? +m[0].replace(/,/g, '') : 0; };
const clean = s => String(s || '').replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();
const oneLine = s => String(s || '').split('/').map(p => clean(p).replace(/\.$/, '')).filter(Boolean).join('. ');
const stripQty = s => clean(String(s).replace(/\s*×\s*[\d,]+\s*$/, ''));
const J = async u => (await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } })).json();
const members = async cat => ((await J('https://coralisland.fandom.com/api.php?action=query&list=categorymembers&cmtitle=' + encodeURIComponent('Category:' + cat) + '&cmlimit=500&format=json')).query.categorymembers || []).map(x => x.title);
const rawTables = html => [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0]);
const rawRows = tb => [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(r => [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => c[1]));
const links = h => [...new Set([...h.matchAll(/<a [^>]*title="([^"]*)"/gi)].map(x => dec(x[1])))];
const hearts = cellHtml => (cellHtml.match(/data-image-name="Heart[^"]*"/g) || []).length || num(txt(cellHtml));

(async () => {
  /* ---------- MONSTERS ---------- */
  const mt = tables(await get('Monsters'))[0].slice(1);
  D.monsters = [];
  for (const c of mt) {
    const n = c[1]; if (!n) continue;
    const info = { id: slug(n), n, k: clean(c[2]), v: clean(c[3]), loc: clean(c[4]).replace(/\s*\/\s*/g, ' · '), hp: 0, exp: 0, atk: 0, def: 0, loot: [] };
    try {
      const T = tables(await get(n));
      T.forEach(t => {
        const head = (t[0] || []).join('|');
        if (/^Base Health\|EXP/i.test(head)) { info.hp = num(t[1][0]); info.exp = num(t[1][1]); }
        else if (/^Base Attack\|Base Defense/i.test(head)) { info.atk = num(t[1][0]); info.def = num(t[1][1]); }
        else if (/^Item\|Chance/i.test(head)) t.slice(1).forEach(r => { if (r[0] && !info.loot.some(l => l.n === clean(r[0]))) info.loot.push({ n: clean(r[0]), c: clean(r[1]) }); });
      });
    } catch (e) { warn.push('monster page ' + n); }
    D.monsters.push(info);
  }
  // drops: every item that a monster can drop, with its sources
  const drops = {};
  D.monsters.forEach(m => m.loot.forEach(l => { (drops[l.n] = drops[l.n] || []).push({ m: m.n, c: l.c }); }));
  D.drops = Object.entries(drops).map(([n, from]) => ({ id: slug(n), n, from })).sort((a, b) => a.n.localeCompare(b.n));

  /* ---------- GEODES ---------- */
  {
    const html = await get('Gem');
    const rows = rawRows(rawTables(html)[0]).slice(1);
    D.geodes = rows.map(r => ({ id: slug(txt(r[1])), n: txt(r[1]), src: clean(txt(r[2])).replace(/\s*\/\s*/g, ' · '), drops: links(r[3]).filter(x => !/^(Stone|Coal|Bronze ore|Silver ore|Gold ore|Osmium ore)$/.test(x) && !/\(group\)/.test(x)), gems: (links(r[3]).find(x => /^(Earth|Fire|Water|Wind) gem \(group\)$/.test(x)) || '').replace(/ gem \(group\)/, ''), other: links(r[3]).filter(x => /^(Stone|Coal|Bronze ore|Silver ore|Gold ore|Osmium ore)$/.test(x)) })).filter(g => g.n);
  }

  /* ---------- RESOURCES ---------- */
  D.resources = [];
  for (const title of await members('Resources')) {
    if (/ tree$/i.test(title)) continue;
    let html; try { html = await get(title); } catch (e) { warn.push('resource ' + title); continue; }
    const raw = rawTables(html).map(rawRows);
    const rows = tables(html);
    const priceRow = rows[0] && rows[0][1];
    const price = priceRow ? num(priceRow.join(' ')) : 0;
    const shopT = rows.find(t => /^Location\|Price/i.test((t[0] || []).join('|')));
    const contT = rows.find(t => /^Container\|Chance/i.test((t[0] || []).join('|')));
    const g = /kelp essence/i.test(title) ? 'Kelp essence' : /kelp/i.test(title) ? 'Kelp' : /ore$/i.test(title) ? 'Ore' : /bar$/i.test(title) ? 'Bar' : 'Materials';
    D.resources.push({
      id: slug(title), n: title, g, p: price,
      buy: shopT ? shopT.slice(1).slice(0, 6).map(r => ({ w: clean(r[0]), p: num(r[1]) })).filter(x => x.w) : [],
      // the container name is a rowspan: some rows start directly with the percentage
      found: contT ? (() => { let last = ''; return contT.slice(1).map(r => { if (/^[\d.]+%$/.test(clean(r[0]))) r = [last, r[0], r[1]]; else last = clean(r[0]); return { w: clean(r[0]), c: clean(r[1]) }; }).filter(x => x.w).slice(0, 8); })() : []
    });
  }

  /* ---------- OCEAN SEED MIXING ---------- */
  {
    const T = tables(await get('Ocean Seed Mixing'));
    const growth = {};
    T[1].slice(1).forEach(c => { if (c[1]) growth[c[1].toLowerCase()] = { g: clean(c[2]), r: clean(c[3]), n: clean(c[4]) }; });
    D.oceanSeeds = T[0].slice(1).map(c => {
      const seed = clean(c[1]); if (!seed) return null;
      const crop = seed.replace(/\s+seeds$/i, '');
      return { id: slug(seed), n: seed, kelp: clean(c[2]), land: clean(c[3]), lands: clean(c[4]), scav: clean(c[5]), depth: clean(c[6]), growth: growth[crop.toLowerCase()] || null };
    }).filter(Boolean);
  }

  /* ---------- EXTRAS (minor characters) ---------- */
  D.extras = tables(await get('Extras'))[0].slice(1).map(c => ({ id: slug(c[0]), n: clean(c[0]), d: clean(c[1]) })).filter(x => x.n);

  /* ---------- CRAFTING RECIPES (incl. consumables, baits, traps, bombs) ---------- */
  {
    const T = tables(await get('Crafting'));
    const sections = ['Storage', 'Farming', 'Ranching', 'Artisan equipment', 'Resource equipment', 'Item producers', 'Decor', 'Consumables', 'Baits', 'Traps', 'Decoys', 'Bombs', 'Miscellaneous'];
    D.crafting = [];
    sections.forEach((sec, i) => {
      const t = T[i]; if (!t || !/Product/.test((t[0] || []).join(' '))) { warn.push('crafting table ' + sec); return; }
      const hasProduces = t[0].some(h => /Produces/i.test(h));
      t.slice(1).forEach(c => {
        const n = stripQty(c[1]); if (!n) return;
        D.crafting.push({ id: slug(sec) + '-' + slug(n), n, g: sec, i: clean(c[2]), u: clean(c[hasProduces ? 4 : 3] || ''), pr: hasProduces ? clean(c[3]).replace(/\s*\/\s*/g, ', ') : '' });
      });
    });
    const seen = {}; D.crafting.forEach(x => { seen[x.id] = (seen[x.id] || 0) + 1; if (seen[x.id] > 1) x.id += '-' + seen[x.id]; });
  }

  /* ---------- VILLAGER DETAILS ---------- */
  const P = {};
  // infobox values: <h3 class="pi-data-label">Occupation</h3> <div class="pi-data-value">…</div>
  const pi = (html, label) => { const m = new RegExp('<h3[^>]*pi-data-label[^>]*>\\s*' + label + '\\s*</h3>\\s*<div[^>]*pi-data-value[^>]*>([\\s\\S]*?)</div>', 'i').exec(html); return m ? oneLine(txt(m[1])) : ''; };
  const merfolk = new Set(await members('Merfolk'));
  const sectionText = (html, id, max) => {
    const a0 = html.indexOf('id="' + id + '"'); if (a0 < 0) return '';
    const a1 = html.indexOf('</h', a0); if (a1 < 0) return '';
    const rest = html.slice(a1 + 5);
    const b = rest.search(/<h[23][ >]/);
    const full = oneLine(txt(rest.slice(0, b < 0 ? 4000 : b)));
    if (full.length <= max) return full;
    // cut at the last complete sentence that fits
    const cut = full.slice(0, max), i = cut.lastIndexOf('. ');
    return (i > max * 0.4 ? cut.slice(0, i + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…');
  };
  for (const v of D.villagers) {
    let html; try { html = await get(v.n); } catch (e) { warn.push('villager page ' + v.n); continue; }
    const rows = tables(html);
    const info = rows.find(t => /^Type\|Birthday/i.test((t[0] || []).join('|')));
    const rec = { type: info ? clean(info[1][0]) : '', gender: info ? clean(info[1][2] || '') : '', job: pi(html, 'Occupation').slice(0, 120), home: pi(html, 'Residency').slice(0, 100), fun: pi(html, 'Hobbies').slice(0, 160), about: sectionText(html, 'Personality', 380), events: [], hang: [], sched: [] };
    const rawT = rawTables(html);
    rawT.forEach(tb => {
      const rr = rawRows(tb), head = rr[0] ? rr[0].map(x => clean(txt(x))).join('|') : '';
      if (/^Hearts\|Day\|Location\|Summary/i.test(head)) rr.slice(1).forEach(r => rec.events.push({ h: hearts(r[0]), d: clean(txt(r[1])), l: clean(txt(r[2])), s: oneLine(txt(r[3])).slice(0, 240) }));
      else if (/^Hearts\|Requirement\|Summary/i.test(head)) rr.slice(1).forEach(r => rec.hang.push({ h: hearts(r[0]), q: clean(txt(r[1])), s: oneLine(txt(r[2])).slice(0, 200) }));
    });
    // schedule: walk the section in document order; tab labels come before the tables they name
    const sa = html.indexOf('id="Schedule"'), sb = html.indexOf('id="Gifts"', sa);
    if (sa > 0) {
      const seg = html.slice(sa, sb > sa ? sb : sa + 60000);
      const tokens = [...seg.matchAll(/<h3[^>]*>[\s\S]*?id="([^"]+)"|wds-tabs[^"]*tab-label">([\s\S]*?)<\/div>|<table[\s\S]*?<\/table>/g)];
      let group = 'Regular schedule'; const queue = [];
      tokens.forEach(m => {
        if (m[1]) { group = m[1].replace(/_/g, ' '); queue.length = 0; }
        else if (m[2] !== undefined) queue.push(clean(txt(m[2])));
        else {
          const rr = rawRows(m[0]); const head = rr[0] ? rr[0].map(x => clean(txt(x))).join('|') : '';
          if (!/^Time\|Activity/i.test(head)) return;
          const label = queue.shift() || 'All days';
          rec.sched.push({ g: group, l: label, r: rr.slice(1).map(r => [clean(txt(r[0])), oneLine(txt(r[1])).slice(0, 170)]).filter(r => r[0]) });
        }
      });
    }
    P[v.id] = rec;
    v.type = rec.type || (['Chieftain', 'Giu', 'Gong', 'Gort', 'Grog', 'Groo'].includes(v.n) ? 'Giant' : merfolk.has(v.n) ? 'Merfolk' : '') || v.type || '';
  }

  fs.writeFileSync(FILE, JSON.stringify(D));
  fs.writeFileSync(path.join(__dirname, 'people.json'), JSON.stringify(P));
  const counts = { monsters: D.monsters.length, drops: D.drops.length, geodes: D.geodes.length, resources: D.resources.length, oceanSeeds: D.oceanSeeds.length, extras: D.extras.length, crafting: D.crafting.length, people: Object.keys(P).length };
  console.log(JSON.stringify(counts));
  console.log('villager types:', JSON.stringify(D.villagers.reduce((a, v) => (a[v.type || '?'] = (a[v.type || '?'] || 0) + 1, a), {})));
  console.log('events:', Object.values(P).reduce((a, p) => a + p.events.length, 0), 'hangouts:', Object.values(P).reduce((a, p) => a + p.hang.length, 0), 'schedules:', Object.values(P).reduce((a, p) => a + p.sched.length, 0));
  console.log('warnings:', warn.length ? warn.join('; ') : 'none', '| sizes', fs.statSync(FILE).size, fs.statSync(path.join(__dirname, 'people.json')).size);
})().catch(e => { console.log('ERR', e.stack); process.exit(1); });
