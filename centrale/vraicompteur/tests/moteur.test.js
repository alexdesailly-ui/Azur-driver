// Cas écrits à la main AVANT le code du moteur (hypothese.json). node --test tests/
// Profil d'exemple : 0,15 €/km de frais variables, 21 % de cotisations, objectif 18 €/h net (avant charges fixes).
// Attente après la dépose selon la destination : centre 5 min, périphérie 15 min (+3 km à vide), isolé 30 min (+10 km à vide).
const test = require("node:test");
const assert = require("node:assert");
const M = require("../moteur.js");

const PROFIL = { coutKm: 0.15, cotisations: 21, objectifHeure: 18 };
const arrondi = (x) => Math.round(x * 10) / 10;

test("A : course courte en centre, approche courte → verte", () => {
  const r = M.evaluerOffre({ prixNet: 12, approcheMin: 4, approcheKm: 1.5, courseMin: 12, courseKm: 5, destination: "centre" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 8.5);     // 12 × 0,79 − 0,15 × 6,5
  assert.strictEqual(r.minutesTotales, 21);          // 4 + 12 + 5
  assert.strictEqual(arrondi(r.netHeure), 24.3);
  assert.strictEqual(r.verdict, "vert");
});

test("B : approche longue → rouge, et la raison le dit", () => {
  const r = M.evaluerOffre({ prixNet: 9, approcheMin: 14, approcheKm: 7, courseMin: 9, courseKm: 4, destination: "centre" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 5.5);
  assert.strictEqual(r.minutesTotales, 28);
  assert.strictEqual(arrondi(r.netHeure), 11.7);
  assert.strictEqual(r.verdict, "rouge");
  assert.ok(r.raisons.some((t) => /approche/i.test(t)));
});

test("C : longue course vers un lieu isolé, retour à vide compté → verte de justesse", () => {
  const r = M.evaluerOffre({ prixNet: 38, approcheMin: 6, approcheKm: 3, courseMin: 32, courseKm: 30, destination: "isole" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 23.6);    // 30,02 − 0,15 × 43
  assert.strictEqual(r.minutesTotales, 68);          // 6 + 32 + 30
  assert.strictEqual(arrondi(r.netHeure), 20.8);
  assert.strictEqual(r.verdict, "vert");
});

test("D : course moyenne en périphérie → orange", () => {
  const r = M.evaluerOffre({ prixNet: 18, approcheMin: 8, approcheKm: 4, courseMin: 20, courseKm: 12, destination: "peripherie" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 11.4);
  assert.strictEqual(r.minutesTotales, 43);
  assert.strictEqual(arrondi(r.netHeure), 15.9);
  assert.strictEqual(r.verdict, "orange");
});

test("E : la course fait perdre de l'argent → rouge et le dit", () => {
  const r = M.evaluerOffre({ prixNet: 6, approcheMin: 10, approcheKm: 6, courseMin: 15, courseKm: 12, destination: "isole" }, { ...PROFIL, coutKm: 0.2 });
  assert.ok(r.netCourse < 0);
  assert.strictEqual(r.verdict, "rouge");
  assert.ok(r.raisons.some((t) => /perds/i.test(t)));
});

test("une offre incomplète n'est pas jugée : on dit ce qui manque", () => {
  const r = M.evaluerOffre({ prixNet: 12, approcheMin: 4, courseMin: 12, destination: "centre" }, PROFIL);
  assert.strictEqual(r.verdict, "incomplet");
  assert.deepStrictEqual(r.manque.sort(), ["approcheKm", "courseKm"]);
});

test("semaine : revenu net réel à l'heure, charges fixes comprises", () => {
  const s = M.semaine({ heures: 45, revenus: 900, km: 1000, coutKm: 0.15, fixes: 250, cotisations: 21 });
  assert.strictEqual(arrondi(s.brutHeure), 20);
  assert.strictEqual(arrondi(s.net), 311);
  assert.strictEqual(arrondi(s.netHeure), 6.9);
});

test("repères de l'accord : une course à 7,80 € est sous les 9 € net minimum", () => {
  const r = M.reperesAccord({ prixNet: 7.8, approcheMin: 11, approcheKm: 5.6, courseMin: 7, courseKm: 2.4 });
  assert.strictEqual(r[0].respecte, false);
  assert.strictEqual(r[1].respecte, false);   // 7,80 € pour 8 km
  assert.strictEqual(r[2].respecte, false);   // 7,80 € pour 18 min = 26 €/h
});

test("repères de l'accord : une course à 12 € pour 6,5 km et 16 min les respecte", () => {
  const r = M.reperesAccord({ prixNet: 12, approcheMin: 4, approcheKm: 1.5, courseMin: 12, courseKm: 5 });
  assert.deepStrictEqual(r.map((x) => x.respecte), [true, true, true]);
});
