// Tests automatiques du moteur de rotation (node --test). Données 100 % fictives.
const test = require("node:test");
const assert = require("node:assert");
const M = require("../moteur.js");

const R = (id, sens, origine, station, heure, places, payee = true, retard = 0) => ({ id, sens, origine, station, heure, places, payee, retard });

test("un van ne dépasse jamais 8 places", () => {
  const res = [R("a", "montee", "aix", "vars", "14:00", 5), R("b", "montee", "aix", "vars", "14:05", 4)];
  const c = M.composer(res);
  c.vans.forEach(v => assert.ok(v.places <= 8));
  assert.strictEqual(c.vans.length, 2);
});

test("les arrivées proches partagent le même van", () => {
  const res = [R("a", "montee", "aix", "vars", "14:00", 2), R("b", "montee", "aix", "vars", "14:30", 3), R("c", "montee", "aix", "vars", "14:40", 2)];
  const c = M.composer(res);
  assert.strictEqual(c.vans.length, 1);
  assert.strictEqual(c.vans[0].places, 7);
  assert.strictEqual(c.vans[0].heureDepart, "15:00"); // dernière arrivée 14:40 + 20 min
});

test("au-delà de la fenêtre d'attente, un nouveau van", () => {
  const res = [R("a", "montee", "aix", "vars", "11:15", 3), R("b", "montee", "aix", "vars", "12:30", 3)];
  assert.strictEqual(M.composer(res).vans.length, 2);
});

test("seuil : confirmé à 6 places payées, en attente sinon, annulé et remboursé à J-7", () => {
  const plein = [R("a", "montee", "mrs", "risoul", "13:00", 4), R("b", "montee", "mrs", "risoul", "13:10", 2)];
  assert.strictEqual(M.composer(plein).vans[0].statut, "confirme");
  const faible = [R("a", "montee", "mrs", "risoul", "13:00", 4), R("b", "montee", "mrs", "risoul", "13:10", 2, false)];
  assert.strictEqual(M.composer(faible).vans[0].statut, "en_attente");
  assert.strictEqual(M.composer(faible, { jMoins7: true }).vans[0].statut, "annule_rembourse");
  // à J-7, la place sans acompte est libérée : elle n'occupe plus le van
  const j7 = M.composer(faible, { jMoins7: true });
  assert.deepStrictEqual(j7.liberees, ["b"]);
  assert.strictEqual(j7.vans[0].places, 4);
});

test("descente : le van arrive en gare avant l'heure limite du premier voyageur", () => {
  const res = [R("x", "descente", "aix", "vars", "13:30", 3), R("y", "descente", "aix", "vars", "14:10", 3)];
  const c = M.composer(res);
  assert.strictEqual(c.vans.length, 1);
  const v = c.vans[0];
  assert.strictEqual(v.heureArrivee, "12:45"); // 13:30 - 45 min
  assert.strictEqual(v.heureDepart, "10:00");  // 12:45 - 165 min
});

test("appariement : la descente du matin et la montée de l'après-midi forment une journée", () => {
  const res = [R("x", "descente", "aix", "vars", "13:30", 6), R("a", "montee", "aix", "vars", "14:10", 6)];
  const c = M.composer(res);
  assert.strictEqual(c.journees.length, 1);
  assert.ok(c.journees[0].descente && c.journees[0].montee);
});

test("un retard replace le voyageur dans le van suivant sans intervention humaine", () => {
  const res = [R("a", "montee", "aix", "vars", "11:15", 4), R("b", "montee", "aix", "vars", "11:30", 2),
               R("c", "montee", "aix", "vars", "13:00", 3), R("d", "montee", "aix", "vars", "13:20", 3)];
  const r = M.replacerApresRetard(res, "b", 100);   // train de 11:30 arrivé à 13:10
  // b change de van ; a garde le sien mais part plus tôt (le van ne l'attend plus) ; c et d ne bougent pas.
  assert.deepStrictEqual(r.changements.filter(c => c.type === "van").map(c => c.id), ["b"]);
  const a = r.changements.find(c => c.id === "a");
  assert.deepStrictEqual([a.type, a.avant, a.apres], ["horaire", "11:50", "11:35"]);
  assert.ok(!r.changements.some(c => c.id === "c" || c.id === "d"));
  assert.strictEqual(r.composition.interventionsHumaines, 0);
  assert.strictEqual(r.alertes.length, 0);
  const vanB = r.composition.vans.find(v => v.reservations.includes("b"));
  assert.ok(vanB.reservations.includes("c") && vanB.places === 8 && vanB.heureDepart === "13:40");
});

test("un petit retard : le van attend dans sa fenêtre, tout le monde est prévenu du nouvel horaire", () => {
  const res = [R("a", "montee", "aix", "vars", "11:15", 4), R("b", "montee", "aix", "vars", "11:30", 2)];
  const r = M.replacerApresRetard(res, "b", 20);    // 11:50, soit 35 min après la première arrivée
  assert.strictEqual(r.composition.vans.length, 1);
  assert.deepStrictEqual(r.changements.map(c => [c.id, c.type, c.apres]).sort(), [["a", "horaire", "12:10"], ["b", "horaire", "12:10"]]);
});

test("aucun van ne convient : alerte article 5, aucun van surchargé, personne d'autre ne bouge", () => {
  const res = [R("a", "montee", "aix", "vars", "11:15", 2), R("b", "montee", "aix", "vars", "11:30", 2),
               R("c", "montee", "aix", "vars", "13:00", 4), R("d", "montee", "aix", "vars", "13:20", 4)];
  const r = M.replacerApresRetard(res, "b", 100);
  r.composition.vans.forEach(v => assert.ok(v.places <= 8));
  assert.strictEqual(r.alertes.length, 1);
  assert.deepStrictEqual(r.changements.find(c => c.id === "b").type, "sans_van");
  assert.ok(!r.changements.some(c => c.id === "c" || c.id === "d"));
});

test("après J-7, un van confirmé reste confirmé même s'il perd un voyageur en retard", () => {
  const res = [R("a", "montee", "aix", "vars", "13:10", 2), R("b", "montee", "aix", "vars", "13:25", 4), R("c", "montee", "aix", "vars", "13:48", 1),
               R("d", "montee", "aix", "vars", "15:20", 4), R("e", "montee", "aix", "vars", "15:40", 2)];
  const r = M.replacerApresRetard(res, "a", 120, { jMoins7: true });
  const vanB = r.composition.vans.find(v => v.reservations.includes("b"));
  assert.strictEqual(vanB.statut, "confirme");
  assert.strictEqual(vanB.places, 5);
  assert.strictEqual(r.composition.vans.find(v => v.reservations.includes("a")).heureDepart, "16:00");
});

test("une place déjà remboursée à J-7 n'est pas replacée", () => {
  const res = [R("a", "montee", "aix", "risoul", "14:10", 2), R("b", "montee", "aix", "risoul", "14:35", 1, false)];
  const r = M.replacerApresRetard(res, "a", 60, { jMoins7: true });
  assert.strictEqual(r.changements.length, 0);
  assert.strictEqual(r.composition.vans[0].statut, "annule_rembourse");
});

test("descente vers l'aéroport : le van arrive 90 min avant le premier vol", () => {
  const res = [R("x", "descente", "mrs", "risoul", "15:00", 4), R("y", "descente", "mrs", "risoul", "15:30", 3)];
  const c = M.composer(res);
  assert.strictEqual(c.vans.length, 1);
  assert.strictEqual(c.vans[0].heureArrivee, "13:30"); // 15:00 - 90 min
  assert.strictEqual(c.vans[0].heureDepart, "10:39");  // 13:30 - 171 min
});

test("une réservation invalide est signalée, pas avalée", () => {
  const c = M.composer([R("z", "montee", "nice", "vars", "14:00", 2)]);
  assert.strictEqual(c.invalides.length, 1);
  assert.strictEqual(c.interventionsHumaines, 1);
});

test("outil de prévente : un export CSV donne le tableau, les places par lien et les erreurs à corriger", () => {
  const fs = require("node:fs"), path = require("node:path");
  const O = require("../composer-csv.js");
  const res = O.lireCsv(fs.readFileSync(path.join(__dirname, "exemple-reservations.csv"), "utf8"));
  assert.strictEqual(res.length, 8);
  const j7 = O.rapport(res, ["--j7"]);
  assert.match(j7, /Place libérée, acompte jamais versé : M3/);
  assert.match(j7, /À CORRIGER : réservation X1 \(origine\)/);
  assert.match(j7, /Places payées par le lien DEMO-VARS-1912 : 13/);
  const jour = O.rapport(res, ["--retard", "M1", "120"]);
  assert.match(jour, /Prévenir M1/);
});
