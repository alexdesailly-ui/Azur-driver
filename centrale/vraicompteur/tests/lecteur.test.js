// Lecture du texte d'offre. Les textes imitent des sorties d'OCR, fautes comprises. node --test tests/
const test = require("node:test");
const assert = require("node:assert");
const L = require("../lecteur.js");

test("format « Prise en charge : 4 min (1,5 km) / Trajet : 12 min (5,0 km) »", () => {
  const r = L.lire("Nouvelle course\n12,00 €\nPrise en charge : 4 min (1,5 km)\nTrajet : 12 min (5,0 km)\nVers : Aix-en-Provence, centre");
  assert.deepStrictEqual(r.offre, { prixNet: 12, approcheMin: 4, approcheKm: 1.5, courseMin: 12, courseKm: 5 });
});

test("format « Approche 6 min · 3,0 km / Course 32 min · 30,0 km »", () => {
  const r = L.lire("Course proposée\n38,00 €\nApproche 6 min · 3,0 km\nCourse 32 min · 30,0 km");
  assert.deepStrictEqual(r.offre, { prixNet: 38, approcheMin: 6, approcheKm: 3, courseMin: 32, courseKm: 30 });
});

test("durée en heures et minutes", () => {
  const r = L.lire("64,50 €\nPrise en charge : 3 min (0,9 km)\nTrajet : 1 h 05 min (62,3 km)");
  assert.strictEqual(r.offre.courseMin, 65);
  assert.strictEqual(r.offre.courseKm, 62.3);
});

test("fautes d'OCR courantes : espaces dans les nombres, O pour 0, euro collé", () => {
  const r = L.lire("Prix net : 18 ,0O€\nApproche 8 mn · 4,0 km\nCourse 2O min · 12 ,0 km");
  assert.deepStrictEqual(r.offre, { prixNet: 18, approcheMin: 8, approcheKm: 4, courseMin: 20, courseKm: 12 });
});

test("sans mots-clés : la première paire est l'approche, la seconde le trajet", () => {
  const r = L.lire("9,00 €\n14 min (7,0 km)\n9 min (4,0 km)");
  assert.deepStrictEqual(r.offre, { prixNet: 9, approcheMin: 14, approcheKm: 7, courseMin: 9, courseKm: 4 });
});

test("champ illisible : il reste vide et la confiance baisse, rien n'est inventé", () => {
  const r = L.lire("Nouvelle course\n12,00 €\nPrise en charge : 4 min\nTrajet : 12 min (5,0 km)");
  assert.strictEqual(r.offre.approcheKm, null);
  assert.strictEqual(r.champsTrouves, 4);
});

test("virgule perdue sur une capture floue : « 780 € » pour 7 km est relu 7,80 € et signalé", () => {
  const r = L.lire("Nouvelle course\n780 €\nPrise en charge : 11 min (5,6 km)\nTrajet : 7 min (2,4 km)");
  assert.strictEqual(r.offre.prixNet, 7.8);
  assert.strictEqual(r.alertes.length, 1);
});

test("un vrai prix entier plausible n'est pas modifié mais reste signalé", () => {
  const r = L.lire("120 €\nPrise en charge : 5 min (2,0 km)\nTrajet : 1 h 30 min (140 km)");
  assert.strictEqual(r.offre.prixNet, 120);
  assert.ok(/sans centimes/.test(r.alertes[0]));
});
