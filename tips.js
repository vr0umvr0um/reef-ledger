/* Tips of the day.
   Static tips are facts taken from the Coral Island Wiki (numbers included). Contextual tips are built
   from your date and progress. app.js is loaded after this file; everything here is called lazily. */

const TIPS = [
  /* ---- Friendship ---- */
  {id:'chat', c:'Friendship', t:'Chatting with a villager earns 35 friendship points, once per day. A quick hello to everyone adds up fast.'},
  {id:'birthday5', c:'Friendship', t:'A gift on a villager’s birthday is worth five times the points. A Loved gift is 140, so 700 on their birthday, and 1,400 at Osmium quality.'},
  {id:'quality', c:'Friendship', t:'Gift quality multiplies friendship points: Bronze ×1.15, Silver ×1.3, Gold ×1.5, Osmium ×2.'},
  {id:'loved', c:'Friendship', t:'A Loved gift gives 140 friendship points and a Liked one 70. Pink diamond is loved by everyone.'},
  {id:'nodecay', c:'Friendship', t:'Friendship never decays. You can ignore a villager for weeks without losing a single heart.'},
  {id:'locket', c:'Friendship', t:'Romanceable villagers stop at 8 hearts until you give them the Locket. After that their limit rises to 10.'},
  {id:'errand', c:'Friendship', t:'Finishing a villager’s errand earns 250 friendship points with them. Take the ones that come up.'},
  {id:'hangout', c:'Friendship', t:'You can ask certain villagers to hang out, but only with empty hands. Some spots need good weather or must be unlocked first.'},
  {id:'festchat', c:'Friendship', t:'At festivals a chat can be worth 0, 35, 50 or 85 friendship points, unless you already talked to that villager earlier the same day.'},
  {id:'treeplant', c:'Friendship', t:'The Tree Planting Festival (Spring 21) can give friendship points with all townies. Plan to attend.', when:x => x.s===0 && x.d>=14 && x.d<=21},
  {id:'letters', c:'Friendship', t:'Some recipes arrive as letters once you reach a heart level with a villager. Raise hearts, then check your mail.'},

  /* ---- Daily life ---- */
  {id:'sleep', c:'Daily life', t:'Sleep before midnight for a full energy bar. If you stay up past 2 AM you are sent home and wake up with less energy.'},
  {id:'mastery', c:'Daily life', t:'Each mastery level unlocks recipes and raises your maximum energy. All eight masteries at level 10 earn “This is Coral Island”.'},
  {id:'proficiency', c:'Daily life', t:'Every mastery level also raises a hidden proficiency that lowers the energy some tools use.'},
  {id:'merit', c:'Daily life', t:'Festivals give 40 merit points for attending, 300 for winning the main game and 100 for winning a bonus game.'},
  {id:'cook', c:'Daily life', t:'Cook 15 recipes for the Home Cook badge and every recipe for Chef de Cuisine.'},

  /* ---- Farming ---- */
  {id:'farm2', c:'Farming', t:'Farming level 2 unlocks Sprinkler I and the Compost bin. Level 6 unlocks the Keg and Sprinkler II.'},
  {id:'ranch', c:'Farming', t:'Ranching level 2 unlocks the Mayonnaise machine, level 4 the Cheese press and level 6 the Loom.'},
  {id:'seeds', c:'Farming', t:'Sam’s General Store sells seeds, and new ones appear there as your town rank climbs (ranks E, D and C).'},
  {id:'rankranch', c:'Farming', t:'Town rank unlocks Ranch animals: Duck and Sheep at E, Goat and Quail at D, Pig and Peafowl at C, Llama and Luwak at B.'},

  /* ---- Fishing ---- */
  {id:'bait', c:'Fishing', t:'Bait adds 25% to the chance of a fish size. Small bait needs Fishing level 1, medium level 4 and large level 8. Craft it or buy it at the Beach Shack.'},
  {id:'cast', c:'Fishing', t:'Cast length changes the odds of fish size and rarity. Even at maximum length there is still at least a 5% chance of trash.'},
  {id:'treasure', c:'Fishing', t:'Every cast has a 0.05% chance of treasure, such as a coffer or a geode. It is a slow but free way to find artifacts.'},
  {id:'pattern', c:'Fishing', t:'Watch how the fish moves on your line. Each species has a swim pattern, which helps you guess what you have hooked.'},
  {id:'weather', c:'Fishing', t:'Some fish only bite in certain weather. Open a fish in the Museum tab to see its weather, time and location before you head out.'},
  {id:'conch', c:'Fishing', t:'A Weather conch can change tomorrow’s weather, handy when you need rain or snow for a particular catch.'},
  {id:'minefish', c:'Fishing', t:'Cobia, pufferfish, polka-dot batfish and lobster also turn up in the mines as common variants.'},

  /* ---- Catching ---- */
  {id:'traps', c:'Catching', t:'Traps catch insects and critters while you work. They unlock at Catching level 5 (crawler), 6 (flying insect) and 8 (float).'},
  {id:'scent', c:'Catching', t:'Scents give 4% Bug Awareness for one type of insect or critter. Use one yourself or drop it on a matching trap.'},
  {id:'forecast', c:'Catching', t:'Buy the catching component for the Sturdy computer to see which insects and critters can appear today. Foraging has its own forecast.'},
  {id:'net', c:'Catching', t:'Upgraded bug nets cost the same energy as the basic one but catch across a wider angle and radius.'},

  /* ---- Museum ---- */
  {id:'m3', c:'Museum', t:'Each item you donate earns 3 museum points toward your town rank, and completing a whole collection adds a 40-point bonus.'},
  {id:'coffer', c:'Museum', t:'Coffers come from tilling soil or sand and from fishing. Tilling soil also turns up fossil nodes.'},
  {id:'geode', c:'Museum', t:'Gems come from geodes and mine nodes. Each mine has its own geode (Earth, Water, Wind, Fire), so visit them all for a full gem set.'},
  {id:'lab', c:'Museum', t:'The Laboratory can process fossil remains. Bring the nodes you find there.'},
  {id:'ms340', c:'Museum', t:'Donation rewards start at 5 donations and run all the way to 340, where you become the Part-Time Curator.'},

  /* ---- Town & ocean ---- */
  {id:'off45', c:'Town & ocean', t:'Every Lake Temple offering you complete earns 45 town points. There are 24 regular ones.'},
  {id:'offrew', c:'Town & ocean', t:'Offerings pay in machines: Essential Resources gives a Recycling machine, Barn Animals a Cheese press and Rare Crops a Sprinkler III.'},
  {id:'coral', c:'Town & ocean', t:'Each coral site you heal earns 10 ocean points, and healing them all adds 100 more.'},
  {id:'orbs', c:'Town & ocean', t:'Activate every solar orb in an underwater area to unlock its waypoint, located in front of the ocean caves.'},
  {id:'dive', c:'Town & ocean', t:'You can dive any time between 6:00 and 23:00 from the boat at the Diving Pier. Use your scythe on trash and debris to find resources and orbs.'},
  {id:'orch', c:'Town & ocean', t:'The four orchestra sites need four donations each, in order. The first, Se Pulu (10m), asks for 3 Bronze kelp essence, 2 Marinip, 2 Bluebell blossom and 2 Twinshade sealeaf.'}
];

/* deterministic shuffle so categories alternate and the order is stable between sessions */
const TIP_ORDER = (() => {
  let a = 0x9E3779B9;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const arr = TIPS.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
})();

/* three static tips for the current game day; `shift` lets the player ask for others */
function dailyTips(ctx, shift = 0) {
  const pool = TIP_ORDER.filter(t => !t.when || t.when(ctx));
  const n = pool.length;
  const base = ((ctx.abs * 3 + shift * 3) % n + n) % n;
  return [0, 1, 2].map(i => pool[(base + i) % n]);
}

/* tips built from the date and what you have ticked; most urgent first */
function contextTips(ctx) {
  const out = [];
  const { s, d, left } = ctx;
  const nx = (s + 1) % 4;

  // birthdays within 3 days
  D.villagers.filter(v => v.b).map(v => ({ v, n: untilBirthday(v.b) })).filter(x => x.n <= 3).sort((a, b) => a.n - b.n).slice(0, 2).forEach(({ v, n }) => {
    out.push({ id: 'bd-' + v.id, c: 'Birthday', now: true, t: (n === 0 ? `Today is ${v.n}’s birthday.` : `${v.n}’s birthday is in ${plural(n, 'day')}.`) + ` A gift is worth five times the usual points. Loved: ${v.loved.slice(0, 4).join(', ') || 'see People'}.` });
  });
  // festivals within 3 days
  for (let i = 0; i <= 3; i++) {
    const dd = addDays(ctx.date, i);
    festOn(dd.s, dd.d).forEach(f => { if (dd.d === f.a || i === 0) out.push({ id: 'fe-' + f.n, c: 'Festival', now: true, t: `${f.n} ${i === 0 ? 'is on today' : 'is in ' + plural(i, 'day')}: ${f.time}, ${f.where}. ${f.note}` }); });
  }
  // creatures leaving with the season
  if (left <= 6) {
    const lv = missingSeason(s).filter(x => x.leaving).sort(byScarce);
    if (lv.length) out.push({ id: 'leave', c: 'Season end', now: true, t: `${lv.length} ${lv.length === 1 ? 'creature you still need leaves' : 'creatures you still need leave'} with ${SEAS[s]}. Rarest first: ${lv.slice(0, 4).map(x => x.it.n).join(', ')}.` });
  }
  // museum milestone
  const tot = museumTotal(), nm = D.museumMilestones.find(m => m.n > tot);
  if (tot > 0 && nm && nm.n - tot <= 6) out.push({ id: 'ms', c: 'Museum', now: true, t: `${plural(nm.n - tot, 'donation')} away from the ${nm.n}-donation reward${nm.r ? ': ' + nm.r : ''}.` });
  // nearly finished collection
  collections().filter(c => c.have >= 1 && c.need - c.have >= 1 && c.need - c.have <= 3).slice(0, 1).forEach(c => out.push({ id: 'col-' + c.n, c: 'Museum', now: true, t: `${c.n}: only ${c.need - c.have} to go (${c.have}/${c.need})${c.r ? '. Reward: ' + c.r : ''}.` }));
  // best crops right now
  const plant = D.crops.filter(c => c.k === 'Crop' && c.s[s] && growDays(c) <= left).sort((a, b) => b.ppd - a.ppd);
  if (plant.length) out.push({ id: 'crop', c: 'Farming', now: true, t: `Best profit per day you can still plant in ${SEAS[s]}: ${plant.slice(0, 3).map(c => `${c.n} (${c.ppd}/day, ready ${fmt(addDays(ctx.date, growDays(c)))})`).join(', ')}.` });
  // recipe letters
  for (const r of D.recipes) {
    const m = /^([A-Za-z]+) ♥(\d+)/.exec(r.src || '');
    if (!m || S.done.recipes[r.id]) continue;
    const v = D.villagers.find(x => x.n === m[1]);
    if (v && heartsOf(v) >= +m[2]) { out.push({ id: 'rec-' + r.id, c: 'Kitchen', now: true, t: `You have ${heartsOf(v)} hearts with ${v.n}, enough for the ${r.n} recipe (${m[2]} hearts). Check your mail and try cooking it.` }); break; }
  }
  // seasonal offering
  const ses = D.offerings.find(o => o.n === SEAS[s] + ' Sesajen');
  if (ses && !offDone(ses) && left <= 10) out.push({ id: 'ses', c: 'Offering', now: true, t: `${ses.n} isn’t finished (${offCount(ses)}/${ses.need}). Items: ${ses.items.map(i => i.n).join(', ')}.` });
  return out;
}
