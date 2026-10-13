// Cas écrits à la main AVANT le code du moteur. node --test tests/
// v2 (13/10, 03:07, après la relecture critique) : le verdict compare l'offre à la « barre », le revenu moyen par minute
// que le chauffeur peut espérer s'il refuse et attend la suivante (strategie.js), et non plus à un objectif fixe.
// Temps compté pour une offre : approche + course + surcoût de la zone de dépose (le temps et les kilomètres en plus pour
// revenir dans une zone active). L'attente ordinaire entre deux offres n'est pas dans l'offre : elle est déjà dans la barre.
// Profil d'exemple : 0,15 €/km de frais variables, 21 % de cotisations. Surcoût de dépose : centre 0 min et 0 km,
// périphérie +10 min et +3 km, lieu isolé +25 min et +10 km.
const test = require("node:test");
const assert = require("node:assert");
const M = require("../moteur.js");

const PROFIL = { coutKm: 0.15, cotisations: 21, barreHeure: 18 };
const arrondi = (x) => Math.round(x * 10) / 10;
const D = { prixNet: 17, approcheMin: 8, approcheKm: 4, courseMin: 20, courseKm: 12, destination: "peripherie" };

test("A : course courte en centre, approche courte → verte, et on dit ce qu'elle rapporte de plus qu'un refus", () => {
  const r = M.evaluerOffre({ prixNet: 12, approcheMin: 4, approcheKm: 1.5, courseMin: 12, courseKm: 5, destination: "centre" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 8.5);     // 12 × 0,79 − 0,15 × 6,5
  assert.strictEqual(r.minutesTotales, 16);          // 4 + 12 + 0
  assert.strictEqual(arrondi(r.netHeure), 31.9);     // 8,505 / 16 × 60
  assert.strictEqual(r.verdict, "vert");
  assert.strictEqual(arrondi(r.gainVsRefus), 3.7);   // 8,505 − 0,30 €/min × 16 min
});

test("B : approche longue → rouge, la raison le dit, et le refus rapporte plus", () => {
  const r = M.evaluerOffre({ prixNet: 9, approcheMin: 14, approcheKm: 7, courseMin: 9, courseKm: 4, destination: "centre" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 5.5);     // 9 × 0,79 − 0,15 × 11
  assert.strictEqual(r.minutesTotales, 23);
  assert.strictEqual(arrondi(r.netHeure), 14.2);     // 14,2 / 18 = 0,79 : sous la bande orange (0,9)
  assert.strictEqual(r.verdict, "rouge");
  assert.strictEqual(arrondi(r.gainVsRefus), -1.4);  // 5,46 − 0,30 × 23
  assert.ok(r.raisons.some((t) => /approche/i.test(t)));
});

test("C : longue course vers un lieu isolé, surcoût de retour compté → verte", () => {
  const r = M.evaluerOffre({ prixNet: 38, approcheMin: 6, approcheKm: 3, courseMin: 32, courseKm: 30, destination: "isole" }, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 23.6);    // 30,02 − 0,15 × 43
  assert.strictEqual(r.minutesTotales, 63);          // 6 + 32 + 25
  assert.strictEqual(arrondi(r.netHeure), 22.4);
  assert.strictEqual(r.verdict, "vert");
});

test("D : course moyenne en périphérie, juste sous la barre → orange (presque indifférent)", () => {
  const r = M.evaluerOffre(D, PROFIL);
  assert.strictEqual(arrondi(r.netCourse), 10.6);    // 13,43 − 0,15 × 19
  assert.strictEqual(r.minutesTotales, 38);          // 8 + 20 + 10
  assert.strictEqual(arrondi(r.netHeure), 16.7);     // 16,7 / 18 = 0,93
  assert.strictEqual(r.verdict, "orange");
  assert.strictEqual(arrondi(r.gainVsRefus), -0.8);  // 10,58 − 0,30 × 38
});

test("la même offre est bonne quand les offres sont rares et mauvaise quand elles pleuvent", () => {
  assert.strictEqual(M.evaluerOffre(D, { ...PROFIL, barreHeure: 12 }).verdict, "vert");
  assert.strictEqual(M.evaluerOffre(D, { ...PROFIL, barreHeure: 24 }).verdict, "rouge");   // 16,7 / 24 = 0,70
});

test("un plancher personnel au-dessus de la barre fait refuser, et on dit ce que ça coûte", () => {
  const r = M.evaluerOffre(D, { ...PROFIL, barreHeure: 12, plancherHeure: 20 });
  assert.strictEqual(r.seuilHeure, 20);
  assert.strictEqual(r.verdict, "rouge");                    // 16,7 / 20 = 0,835
  assert.strictEqual(arrondi(r.gainVsRefus), 3);             // 10,58 − 0,20 × 38 = 2,98 : la refuser coûte ~3 €
  assert.ok(r.raisons.some((t) => /plancher/i.test(t)));
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

test("valeurTemps : ce que l'offre rapporte et le temps qu'elle immobilise, pour le calcul de la barre", () => {
  const vt = M.valeurTemps(D, PROFIL);
  assert.strictEqual(arrondi(vt.v), 10.6);
  assert.strictEqual(vt.tau, 38);
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

// Règle de poche (13/10, 03:33) : le prix minimum d'une offre, pour qu'elle rapporte au moins la barre.
// prix minimum = (barre par minute × minutes + frais au km × km) / (1 − cotisations), minutes et km d'approche, de course et de retour.
test("règle de poche : à 18 €/h de barre, 0,38 € par minute et 0,19 € par kilomètre", () => {
  const r = M.reglePoche({ coutKm: 0.15, cotisations: 21 }, 18);
  assert.strictEqual(Math.round(r.parMinute * 100) / 100, 0.38);   // 0,30 / 0,79
  assert.strictEqual(Math.round(r.parKm * 100) / 100, 0.19);       // 0,15 / 0,79
});

test("règle de poche : une offre payée exactement au prix minimum rapporte exactement la barre", () => {
  const o = { approcheMin: 8, approcheKm: 4, courseMin: 20, courseKm: 12, destination: "peripherie" };
  const pm = M.prixMinimum(o, PROFIL, 18);
  assert.strictEqual(arrondi(pm), 18.0);                            // (0,30 × 38 + 0,15 × 19) / 0,79 = 18,04
  const r = M.evaluerOffre({ ...o, prixNet: pm }, PROFIL);
  assert.ok(Math.abs(r.netHeure - 18) < 1e-9);
  assert.strictEqual(r.verdict, "vert");
});
