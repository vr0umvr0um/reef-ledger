const fs = require('fs');

async function get(page) {
  const f = __dirname + '/cache_' + page.replace(/\W/g, '_') + '.html';
  if (fs.existsSync(f)) return fs.readFileSync(f, 'utf8');
  const url = 'https://coralisland.fandom.com/api.php?action=parse&page=' + encodeURIComponent(page) +
    '&redirects=1&prop=text&format=json&formatversion=2';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const j = await r.json();
  if (!j.parse) throw new Error(page + ': ' + JSON.stringify(j).slice(0, 200));
  fs.writeFileSync(f, j.parse.text);
  return j.parse.text;
}

const dec = s => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&#x27;/g, "'")
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&#(\d+);/g, (m, d) => String.fromCharCode(d));

const txt = h => dec(
  h.replace(/<br\s*\/?>/gi, ' / ')
    .replace(/<\/(li|p|div)>/gi, ' / ')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<[^>]+>/g, '')
).replace(/\s+/g, ' ').replace(/( \/ )+/g, ' / ').replace(/ \/$/, '').trim();

function tables(html) {
  const out = [];
  const re = /<table[\s\S]*?<\/table>/gi;
  let m;
  while ((m = re.exec(html))) {
    const rows = [...m[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)].map(r =>
      [...r[0].matchAll(/<(t[hd])([^>]*)>([\s\S]*?)<\/\1>/gi)].map(c => txt(c[3])));
    out.push(rows);
  }
  return out;
}

module.exports = { get, tables, txt, dec };

if (require.main === module) {
  (async () => {
    const page = process.argv[2];
    const n = +process.argv[3] || 2;
    const html = await get(page);
    const T = tables(html);
    T.forEach((t, i) => {
      console.log('#T' + i + ' rows=' + t.length);
      t.slice(0, n).forEach(r => console.log('  ' + r.join(' | ').slice(0, 300)));
    });
    if (!T.length) console.log('(no tables) ' + txt(html).slice(0, 500));
  })().catch(e => console.log('ERR', e.message));
}
