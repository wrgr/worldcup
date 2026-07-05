// Reproducible backtest for the bracket's win-probability classifier.
//
//   node model/backtest.mjs
//
// Fetches the public martj42 international-results dataset, builds an Elo rating for every
// national team from full match history, fits a logistic "to advance" classifier on decisive
// matches from 2014 onward, validates it out-of-sample on a 2023+ holdout, and writes the
// coefficients + current ratings to model/model.json (which index.html embeds).
//
// Model:  P(win) = sigmoid( B·(ΔElo/100) + C·host )   (intercept ≈0, dropped for symmetry)

const BASE = "https://raw.githubusercontent.com/martj42/international_results/master";

function parseCSV(txt) {
  const lines = txt.trim().split("\n");
  const head = lines[0].split(",");
  return lines.slice(1).map(l => { const c = l.split(","); const o = {}; head.forEach((h, i) => o[h] = c[i]); return o; });
}

const [resTxt, shootTxt] = await Promise.all([
  fetch(`${BASE}/results.csv`).then(r => r.text()),
  fetch(`${BASE}/shootouts.csv`).then(r => r.text()),
]);
const results = parseCSV(resTxt);
const shoot = parseCSV(shootTxt);
const sw = new Map();
for (const s of shoot) sw.set(`${s.date}|${s.home_team}|${s.away_team}`, s.winner);

// ---- Elo through history (World-Football-Elo style: home advantage + margin of victory) ----
const elo = new Map();
const R0 = 1500, HA = 65;
const getR = t => elo.has(t) ? elo.get(t) : R0;
const kW = t => { t = t.toLowerCase();
  if (t.includes("world cup") && !t.includes("qualification")) return 60;
  if (t.includes("world cup")) return 40;
  if (/(euro|copa am|african cup|afc asian cup|gold cup|confederations|nations league)/.test(t) && !t.includes("qualification")) return 50;
  if (t.includes("qualification")) return 40;
  if (t.includes("friendly")) return 20;
  return 30; };
const gM = gd => { gd = Math.abs(gd); if (gd <= 1) return 1; if (gd === 2) return 1.5; if (gd === 3) return 1.75; return 1.75 + (gd - 3) / 8; };

const samples = [];
for (const m of results) {
  const hs = +m.home_score, as = +m.away_score;
  if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
  const neutral = m.neutral === "TRUE";
  const Rh = getR(m.home_team), Ra = getR(m.away_team);
  const eloDiff = (Rh + (neutral ? 0 : HA)) - Ra;
  let y = null;
  if (hs > as) y = 1; else if (as > hs) y = 0;
  else { const w = sw.get(`${m.date}|${m.home_team}|${m.away_team}`); if (w === m.home_team) y = 1; else if (w === m.away_team) y = 0; }
  if (m.date >= "2014-01-01") samples.push({ date: m.date, tournament: m.tournament, x_elo: eloDiff / 100, x_home: neutral ? 0 : 1, ywin: y });
  const We = 1 / (1 + Math.pow(10, -eloDiff / 400));
  const Sh = hs > as ? 1 : (hs < as ? 0 : 0.5);
  const d = kW(m.tournament) * gM(hs - as) * (Sh - We);
  elo.set(m.home_team, Rh + d); elo.set(m.away_team, Ra - d);
}
const dec = samples.filter(s => s.ywin !== null);
const keys = ["x_elo", "x_home"];
const mean = {}, std = {};
for (const k of keys) { const v = dec.map(r => r[k]); const mu = v.reduce((a, b) => a + b, 0) / v.length; const sd = Math.sqrt(v.reduce((a, b) => a + (b - mu) ** 2, 0) / v.length) || 1; mean[k] = mu; std[k] = sd; }
const train = dec.filter(s => s.date < "2023-01-01"), test = dec.filter(s => s.date >= "2023-01-01");

function fit(rows) {
  const w = { b: 0 }; keys.forEach(k => w[k] = 0);
  const X = rows.map(r => { const o = {}; keys.forEach(k => o[k] = (r[k] - mean[k]) / std[k]); return o; });
  const y = rows.map(r => r.ywin);
  for (let e = 0; e < 600; e++) {
    const g = { b: 0 }; keys.forEach(k => g[k] = 0);
    for (let i = 0; i < X.length; i++) { let z = w.b; keys.forEach(k => z += w[k] * X[i][k]); const p = 1 / (1 + Math.exp(-z)); const er = p - y[i]; g.b += er; keys.forEach(k => g[k] += er * X[i][k]); }
    w.b -= 0.3 * g.b / X.length; keys.forEach(k => w[k] -= 0.3 * (g[k] / X.length + 1e-3 * w[k]));
  }
  return w;
}
const w = fit(train);
const B = w.x_elo / std.x_elo, C = w.x_home / std.x_home;   // un-standardized (intercept dropped)
const round4 = x => Math.round(x * 1e4) / 1e4;
function met(rows) { let ll = 0, br = 0, c = 0; for (const r of rows) { const p = 1 / (1 + Math.exp(-(B * r.x_elo + C * r.x_home))); ll += -(r.ywin * Math.log(p + 1e-12) + (1 - r.ywin) * Math.log(1 - p + 1e-12)); br += (p - r.ywin) ** 2; if ((p >= .5 ? 1 : 0) === r.ywin) c++; } return { n: rows.length, acc: round4(c / rows.length), brier: round4(br / rows.length), logloss: round4(ll / rows.length) }; }
const testM = met(test);
const wcM = met(test.filter(s => /world cup/i.test(s.tournament) && !/qualification/i.test(s.tournament)));

const appTeams = ["Argentina","Spain","France","England","Colombia","Brazil","Portugal","Belgium","Netherlands","Germany","Morocco","Japan","Switzerland","Croatia","Ecuador","Norway","Senegal","Algeria","Austria","Paraguay","Mexico","United States","Australia","Egypt","Canada","Ivory Coast","DR Congo","Sweden","South Africa","Cape Verde","Ghana","Bosnia and Herzegovina"];
const ratings = {};
for (const t of appTeams) ratings[t.toLowerCase()] = elo.has(t) ? Math.round(elo.get(t)) : null;

const out = { B: round4(B), C: round4(C), test: testM, wc: wcM, decisiveMatches: dec.length, ratings };
const { writeFileSync } = await import("node:fs");
writeFileSync(new URL("./model.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(`decisive matches (2014+): ${dec.length}  |  train ${train.length} / test ${test.length}`);
console.log(`model: P = sigmoid(${out.B}*(dElo/100) + ${out.C}*host)`);
console.log(`TEST (2023+):`, testM, `\nWorld Cup subset:`, wcM);
console.log("wrote model/model.json — copy B, C, ratings into index.html (MODEL / modelElo).");
