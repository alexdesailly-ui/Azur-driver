// Seuil optimal d'acceptation : cas calculables à la main, écrits avant le code (relecture critique de 03:02).
// Règle : accepter si v/τ ≥ g, où g = λ · E[max(v − g·τ, 0)] (revenu moyen par minute de la meilleure stratégie).
const test = require("node:test");
const assert = require("node:assert");
const S = require("../strategie.js");
const proche = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;

test("une seule sorte d'offre : g = revenu par cycle (attente + course)", () => {
  // v = 10 €, τ = 20 min, une offre toutes les 5 min en moyenne : 10 € / 25 min = 0,4 €/min
  const g = S.seuilOptimal([{ v: 10, tau: 20 }], 1 / 5);
  assert.ok(proche(g, 0.4));
});

test("deux sortes d'offres : refuser les mauvaises rapporte plus", () => {
  // moitié à 10 €/20 min, moitié à 2 €/20 min, λ = 1/5. Tout accepter : 6 € / 25 min = 0,24.
  // Ne prendre que les bonnes : attente moyenne 10 min + 20 min → 10/30 = 0,333 ; g = 1/3.
  const offres = [{ v: 10, tau: 20 }, { v: 2, tau: 20 }];
  const g = S.seuilOptimal(offres, 1 / 5);
  assert.ok(proche(g, 1 / 3));
  assert.ok(2 / 20 < g && 10 / 20 >= g);   // la mauvaise est refusée, la bonne acceptée
});

test("quand les offres sont rares, le seuil baisse : on accepte plus", () => {
  const offres = [{ v: 10, tau: 20 }, { v: 2, tau: 20 }];
  const gFrequent = S.seuilOptimal(offres, 1 / 2);
  const gRare = S.seuilOptimal(offres, 1 / 60);
  assert.ok(gRare < gFrequent);
  assert.ok(gRare < 0.1);                    // à une offre par heure, même la mauvaise (0,1 €/min) devient acceptable
});

test("simulation : avec le seuil calculé, on gagne au moins autant qu'en acceptant tout (même tirage)", () => {
  const offres = [{ v: 10, tau: 20 }, { v: 2, tau: 20 }];
  const g = S.seuilOptimal(offres, 1 / 5);
  const tirer = (rng) => offres[rng() < 0.5 ? 0 : 1];
  const tout = S.simuler({ tirer, lambda: 1 / 5, minutes: 200000, accepter: () => true, graine: 7 });
  const seuil = S.simuler({ tirer, lambda: 1 / 5, minutes: 200000, accepter: (o) => o.v / o.tau >= g, graine: 7 });
  assert.ok(proche(tout.parMinute, 0.24, 0.01));
  assert.ok(proche(seuil.parMinute, 1 / 3, 0.01));
});

test("un objectif fixe trop haut fait perdre de l'argent quand les offres sont rares", () => {
  const offres = [{ v: 10, tau: 20 }, { v: 2, tau: 20 }];
  const tirer = (rng) => offres[rng() < 0.5 ? 0 : 1];
  const lambda = 1 / 60;
  const tout = S.simuler({ tirer, lambda, minutes: 400000, accepter: () => true, graine: 3 });
  const exigeant = S.simuler({ tirer, lambda, minutes: 400000, accepter: (o) => o.v / o.tau >= 0.4, graine: 3 });
  assert.ok(exigeant.parMinute < tout.parMinute);
});

// Modèle d'offres par défaut : calé sur les moyennes publiées (rapport ARPE 2026 cité par TPE Actu, 26/04/2026 ; Uber 2025 :
// 17,3 € par course, 21,8 min par prestation, 7,5 min entre deux propositions). Le reste est une hypothèse, testée ici pour sa forme.
const M = require("../moteur.js");
const N = 20000;
const offres = S.genererOffres(N, S.MODELE_DEFAUT, 11);
const moyenne = (t) => t.reduce((a, b) => a + b, 0) / t.length;

test("modèle d'offres : reproductible avec la même graine", () => {
  assert.deepStrictEqual(S.genererOffres(5, S.MODELE_DEFAUT, 4), S.genererOffres(5, S.MODELE_DEFAUT, 4));
});

test("modèle d'offres : retrouve les moyennes publiées (17,3 € par course, 21,8 min approche comprise)", () => {
  assert.ok(proche(moyenne(offres.map((o) => o.prixNet)), 17.3, 0.17));
  assert.ok(proche(moyenne(offres.map((o) => o.approcheMin + o.courseMin)), 21.8, 0.65));
  assert.ok(offres.every((o) => o.prixNet >= 9));            // accord : 9 € minimum par course
});

test("modèle d'offres : zones de dépose 60 / 30 / 10 %", () => {
  const part = (z) => offres.filter((o) => o.destination === z).length / N;
  assert.ok(proche(part("centre"), 0.6, 0.02) && proche(part("peripherie"), 0.3, 0.02) && proche(part("isole"), 0.1, 0.02));
});

test("la barre baisse quand les offres se font rares", () => {
  const valeur = (o) => M.valeurTemps(o, M.PROFIL_DEFAUT);
  const b4 = S.barre(offres, valeur, 4), b75 = S.barre(offres, valeur, 7.5), b15 = S.barre(offres, valeur, 15);
  assert.ok(b4 > b75 && b75 > b15);
});

test("comparaison : le seuil calculé gagne au moins autant que tout accepter et que le meilleur filtre au kilomètre", () => {
  const r = S.comparer({ offres, profil: M.PROFIL_DEFAUT, valeur: M.valeurTemps, intervalleMin: 7.5, minutes: 600000, graine: 5,
    politiques: { tout: { type: "tout" }, km: { type: "km", parKm: 1.5 }, barre: { type: "barre" } } });
  assert.ok(r.barre.parHeure >= r.tout.parHeure - 0.05);
  assert.ok(r.barre.parHeure >= r.km.parHeure - 0.05);
});
