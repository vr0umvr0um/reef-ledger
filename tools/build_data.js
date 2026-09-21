const fs = require('fs');
const { get, tables, txt, dec } = require('./wiki.js');

const slug = s => s.toLowerCase().replace(/&#39;|'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const num = s => { const m = String(s || '').match(/[\d,]+/); return m ? +m[0].replace(/,/g, '') : 0; };
const ck = s => (/✓/.test(s) ? (/\(|only|Only/.test(s) ? 2 : 1) : 0);
const uniq = a => [...new Set(a)];
const clean = s => s.replace(/\s*\/\s*$/, '').replace(/\s+/g, ' ').trim();

function rawTables(html) { return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map(m => m[0]); }
function rawRows(tb) {
  return [...tb.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(r => [...r[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(c => c[1]));
}
function links(cellHtml) {
  return uniq([...cellHtml.matchAll(/<a [^>]*title="([^"]*)"/gi)].map(x => dec(x[1])));
}

(async () => {
  const D = {};
  const warn = [];

  // ---------- FISH ----------
  {
    const T = tables(await get('Fish'))[0];
    D.fish = T.slice(1).map(c => ({
      id: slug(c[1]), n: c[1], p: num(c[2].replace(/Base:/, '')),
      w: clean(c[4]), t: clean(c[5]), wx: clean(c[6]),
      s: [ck(c[7]), ck(c[8]), ck(c[9]), ck(c[10])],
      sz: c[11], d: c[12], r: c[13]
    })).filter(x => x.n && !/^Fish$/.test(x.n));
  }
  // ---------- INSECTS ----------
  {
    const T = tables(await get('Insect'))[1];
    D.insects = T.slice(1).map(c => ({
      id: slug(c[1]), n: c[1], p: num(c[2].replace(/Base:/, '')),
      w: clean(c[4]), t: clean(c[5]), wx: clean(c[6]),
      s: [ck(c[7]), ck(c[8]), ck(c[9]), ck(c[10])], r: c[11]
    })).filter(x => x.n);
  }
  // ---------- CRITTERS ----------
  {
    const T = tables(await get('Critter'))[0];
    D.critters = T.slice(1).map(c => ({
      id: slug(c[1]), n: c[1], p: num(c[2].replace(/Base:/, '')),
      w: clean(c[3]), t: clean(c[4]),
      s: [ck(c[5]), ck(c[6]), ck(c[7]), ck(c[8])], r: c[9]
    })).filter(x => x.n);
  }
  // ---------- ARTIFACTS ----------
  {
    const html = await get('Artifact');
    const rows = rawRows(rawTables(html)[0]).slice(1);
    const junk = /^(Trash|Glass|Scrap|Bronze kelp|Silver kelp|Gold kelp|Osmium kelp|Mysterious coffer|Vintage artifact)$/;
    const src = {};
    let all = [];
    rows.forEach(r => {
      const coffer = txt(r[0]);
      const items = links(r[2]).filter(x => !junk.test(x));
      if (coffer !== 'Mysterious coffer') items.forEach(i => { if (!src[i]) src[i] = coffer; });
      all.push(...items);
    });
    all = uniq(all);
    D.artifacts = all.map(n => ({ id: slug(n), n, w: src[n] || 'Mysterious coffer' }));
  }
  // ---------- FOSSILS ----------
  {
    const html = await get('Fossil');
    const rows = rawRows(rawTables(html)[0]).slice(1);
    const dino = /(Gallimimus|Stegosaurus|Triceratops|Mammoth|Pterodactyl|Velociraptor|Brontosaurus|Tyrannosaurus|Mosasaurus|Plesiosaurus)/;
    const src = {};
    let all = [];
    rows.forEach(r => {
      const node = txt(r[0]);
      const items = links(r[2]).filter(x => dino.test(x));
      if (node !== 'Mysterious node') items.forEach(i => { if (!src[i]) src[i] = node; });
      all.push(...items);
    });
    all = uniq(all);
    D.fossils = all.map(n => ({ id: slug(n), n, w: src[n] || 'Mysterious node', g: n.split(' ')[0] }));
  }
  // ---------- GEMS ----------
  {
    const html = await get('Gem');
    const T = tables(html)[1];
    const museum = tables(await get('Museum'))[1];
    const group = {};
    museum.forEach(r => {
      const m = /^(Wind|Water|Earth|Fire) Gem$/.exec(r[0]);
      if (m) r[2].split('/').map(x => x.trim()).filter(Boolean).forEach(g => group[g] = m[1]);
    });
    D.gems = T.slice(1).map(c => ({ id: slug(c[1]), n: c[1], p: num(c[2]), w: clean([c[3], c[4]].join('; ')), g: group[c[1]] || '' })).filter(x => x.n);
  }
  // ---------- MUSEUM MILESTONES ----------
  {
    const T = tables(await get('Museum'));
    D.museumMilestones = T[0].slice(1).map(c => ({ n: num(c[0]), r: clean(c[1] || '') })).filter(x => x.n);
    D.museumCollections = T[1].slice(1).map(c => ({ n: c[0], need: num(c[1]), r: clean(c[3] || '') }));
  }
  // ---------- OFFERINGS ----------
  {
    const html = await get('Offering');
    const T = tables(html).slice(0, 5);
    const heads = [...html.matchAll(/<h[234][^>]*>([\s\S]*?)<\/h[234]>/g)].map(m => txt(m[1]).replace(/\[\]$/, ''));
    D.offeringHeads = heads;
    D.offerings = [];
    T.forEach((t, i) => {
      if (!/Offering/.test((t[0] || []).join(' '))) return;
      t.slice(1).forEach(c => {
        const items = [...c[3].matchAll(/([^×]+?)\s*×\s*([\d,]+)/g)].map(m => ({ n: clean(m[1]).replace(/^\/\s*/, ''), q: num(m[2]) }));
        D.offerings.push({ id: slug(clean(c[1])), altar: i, n: clean(c[1]).replace(/^\/\s*/, ''), need: num(c[2]), items, reward: clean(c[4] || '') });
      });
    });
  }
  // ---------- VILLAGERS ----------
  {
    const html = await get('Gift_preferences');
    const rows = rawRows(rawTables(html)[0]).slice(1);
    const mk = h => dec(h.replace(/<a [^>]*title="([^"]*)"[^>]*>[\s\S]*?<\/a>/gi, (m, t) => '' + t + '')
      .replace(/<br\s*\/?>/gi, ' / ').replace(/<\/(li|p|div)>/gi, ' / ').replace(/<[^>]+>/g, ''));
    const parse = h => {
      const s = mk(h);
      const parts = s.split(/[]/);
      const out = { loved: [], liked: [], disliked: [], hated: [], neutral: [] };
      let cat = null;
      parts.forEach((p, i) => {
        if (i % 2 === 1) { if (cat) out[cat].push(dec(p.trim())); return; }
        p.split('/').map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean).forEach(seg => {
          const m = /^(Loved|Liked|Neutral|Disliked|Hated)\b\s*(.*)$/i.exec(seg);
          if (m) { cat = m[1].toLowerCase(); if (m[2]) out[cat].push(m[2]); }
          else if (cat) out[cat].push(seg);
        });
      });
      // normalise: drop icon links, merge "All" + category, attach parentheticals, dedupe
      Object.keys(out).forEach(k => {
        const res = [];
        let all = false;
        out[k].forEach(t => {
          t = t.replace(/^Category:/, '').trim();
          if (!t || t === 'Gift') return;
          if (t === 'All') { all = true; return; }
          if (/^\(/.test(t) && res.length) { res[res.length - 1] += ' ' + t; return; }
          if (all) { t = 'All ' + t.charAt(0).toLowerCase() + t.slice(1); if (/^All (gem|geode|critter)$/.test(t)) t += 's'; all = false; }
          res.push(t);
        });
        out[k] = uniq(res);
      });
      return out;
    };
    const mon = { Spr: 0, Sum: 1, Fal: 2, Fall: 2, Win: 3 };
    D.universal = null;
    D.villagers = [];
    rows.forEach(r => {
      const head = txt(r[0]);
      const g = parse(r[1] || '');
      if (/^Universal/.test(head)) { D.universal = g; return; }
      const m = /^(.*?)\s*\/\s*(Spr|Sum|Fal|Fall|Win)\s+(\d+)/.exec(head);
      const u = /^(.*?)\s*\/\s*Unknown/.exec(head);
      if (!m && !u) { warn.push('villager?: ' + head); return; }
      const name = m ? m[1] : u[1];
      D.villagers.push({ id: slug(name), n: name, b: m ? [mon[m[2]], +m[3]] : null, loved: g.loved, hated: g.hated });
    });
    const t = tables(await get('Townies'));
    const cand = new Set();
    t.forEach(rows => rows.forEach(r => r.forEach(c => {
      if (/Marriage/.test(c)) {
        const after = c.split(/candidates/i)[1] || '';
        after.split('/').map(x => x.trim()).filter(Boolean).forEach(n => cand.add(n));
      }
    })));
    // second table candidates in row cells
    t.forEach(rows => rows.forEach(r => { if (/Marriage/.test(r[0] || '') && r[1]) r[1].split('/').map(x => x.trim()).filter(Boolean).forEach(n => cand.add(n)); }));
    D.villagers.forEach(v => { v.rom = cand.has(v.n); });
    D.candCount = cand.size;
  }
  // ---------- RECIPES ----------
  {
    const T = tables(await get('Cooking'))[0];
    D.recipes = T.slice(1).map(c => ({
      id: slug(c[0].replace(/×.*/, '')), n: clean(c[0].replace(/×\s*\d+.*/, '')), i: clean(c[1] || ''), m: clean(c[2] || '').replace(/^Ceramic Bowl$/, 'Ceramic bowl'),
      src: clean((c[4] || '').replace(/\s+[^\s\/]+\/[A-Za-z]+#.*$/, '').replace(/\s*\/\s*(\d+)\s*\(\d+ hearts?\)/, ' ♥$1'))
    })).filter(x => x.n);
  }
  // ---------- CROPS ----------
  {
    const T = tables(await get('Crop'));
    const names = ['Spring', 'Summer', 'Fall', 'Winter'];
    const map = {};
    [2, 3, 4, 5].forEach((ti, si) => {
      T[ti].slice(1).forEach(c => {
        const n = c[0]; if (!n) return;
        const e = map[n] || (map[n] = { id: slug(n), n, t: c[1], s: [0, 0, 0, 0], g: clean(c[3]), seed: num(c[4]), p: num(c[5]), max: num(c[6]), ppd: parseFloat(((c[7] || '').replace(/Base:/, '').match(/[\d.]+/) || [0])[0]) });
        e.s[si] = 1;
      });
    });
    D.crops = Object.values(map);
  }
  // ---------- QUESTS ----------
  {
    const html = await get('Quests');
    const T = tables(html);
    const heads = ['Main quests', 'Town quests', 'Giant quests', 'Ocean quests', 'Museum quests'];
    D.quests = [];
    [1, 2, 3, 4].forEach((ti, i) => {
      T[ti].slice(1).forEach(c => {
        if (!c[0]) return;
        D.quests.push({ id: slug(heads[i] + '-' + c[0]), g: ['Main', 'Mines & Giants', 'Ocean', 'Museum'][i], n: c[0], by: clean(c[2] || ''), req: clean(c[3] || '').slice(0, 220) });
      });
    });
  }
  // ---------- TOWN RANK ----------
  {
    const T = tables(await get('Town rank'));
    D.rankTotals = T[0].slice(1).map(c => ({ r: c[0], total: num(c[2]) }));
  }

  fs.writeFileSync(__dirname + '/data.json', JSON.stringify(D));
  const counts = Object.fromEntries(Object.entries(D).map(([k, v]) => [k, Array.isArray(v) ? v.length : typeof v]));
  console.log(JSON.stringify(counts));
  console.log('warn', warn.slice(0, 10));
  console.log('size', fs.statSync(__dirname + '/data.json').size);
})().catch(e => { console.log('ERR', e.stack); });
