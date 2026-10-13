/* Vrai Compteur — le seuil d'acceptation qui maximise le revenu, et la simulation qui le vérifie.
   Modèle : quand le chauffeur attend, les offres arrivent au rythme λ (par minute). Une offre rapporte v (net) et immobilise τ minutes
   (approche, course, et surcoût de repositionnement après la dépose). La meilleure stratégie accepte une offre si v/τ ≥ g,
   où g, le revenu moyen par minute de cette stratégie, vérifie g = λ · E[max(v − g·τ, 0)] (arrêt optimal, renouvellement).
   Refuser n'est pas gratuit : le temps d'attente de l'offre suivante est déjà dans g. */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.Strategie = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // offres : échantillon [{v, tau}] (poids égaux), lambda : offres par minute d'attente. Renvoie g en € par minute.
  function seuilOptimal(offres, lambda) {
    if (!offres.length || !(lambda > 0)) return 0;
    function f(g) {
      var s = 0;
      for (var i = 0; i < offres.length; i++) { var x = offres[i].v - g * offres[i].tau; if (x > 0) s += x; }
      return lambda * s / offres.length - g;    // décroissante en g
    }
    var hi = 0;
    offres.forEach(function (o) { if (o.tau > 0) hi = Math.max(hi, o.v / o.tau); });
    if (hi <= 0) return 0;
    var lo = 0;
    for (var k = 0; k < 80; k++) { var mid = (lo + hi) / 2; if (f(mid) > 0) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  // Générateur pseudo-aléatoire reproductible (mulberry32).
  function aleatoire(graine) {
    var a = graine >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Simule une longue période : attente exponentielle entre les offres, décision, course.
  function simuler(p) {
    var rng = aleatoire(p.graine || 1), t = 0, gain = 0, vues = 0, prises = 0;
    while (t < p.minutes) {
      t += -Math.log(1 - rng()) / p.lambda;
      var o = p.tirer(rng); vues++;
      if (p.accepter(o)) { t += o.tau; gain += o.v; prises++; }
    }
    return { parMinute: gain / t, parHeure: gain / t * 60, offresVues: vues, offresPrises: prises, tauxRefus: 1 - prises / vues };
  }

  // ---------- Modèle d'offres par défaut (en attendant les offres réelles du chauffeur) ----------
  // Calé sur les moyennes publiées : rapport ARPE 2026, cité par TPE Actu le 26/04/2026 ; Uber 2025 : 17,3 € par course
  // (revenu transmis par la plateforme, avant cotisations et frais), 21,8 min par prestation (on suppose : approche comprise),
  // 7,5 min entre deux propositions de course. Bolt 2025 : 15,9 € par course, 5,8 min entre deux propositions.
  // HYPOTHÈSES, à remplacer par les offres réelles : approche uniforme de 2 à 12 min, durée de course étalée (log-normale),
  // vitesse de 18 à 36 km/h, tarif « 1 € + 0,90 €/km + 0,35 €/min » mis à l'échelle de la moyenne publiée, écart de prix
  // de ±30 % autour du tarif (majorations, aéroport, minimum), zones de dépose 60 % centre, 30 % périphérie, 10 % isolé,
  // 9 € minimum par course (accord homologué par l'ARPE).
  var MODELE_DEFAUT = {
    prixMoyen: 17.3, minutesMoyennes: 21.8, intervalleMin: 7.5,
    approcheMin: [2, 12], vitesseKmMin: [0.3, 0.6], etalementDuree: 0.6, dispersion: 0.3,
    zones: { centre: 0.6, peripherie: 0.3, isole: 0.1 }, prixPlancher: 9,
    tarif: { base: 1, parKm: 0.9, parMin: 0.35 }
  };

  function normale(rng) { var u = 1 - rng(), w = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); }
  function entre(rng, t) { return t[0] + rng() * (t[1] - t[0]); }
  function dixieme(x) { return Math.round(x * 10) / 10; }

  function tirerBrut(m, rng) {
    var appr = Math.round(entre(rng, m.approcheMin));
    var moyCourse = m.minutesMoyennes - (m.approcheMin[0] + m.approcheMin[1]) / 2;
    var s = m.etalementDuree, mu = Math.log(moyCourse) - s * s / 2;
    var course = Math.max(3, Math.min(120, Math.round(Math.exp(mu + s * normale(rng)))));
    var courseKm = dixieme(course * entre(rng, m.vitesseKmMin)), approcheKm = dixieme(appr * entre(rng, m.vitesseKmMin));
    var tarif = m.tarif.base + m.tarif.parKm * courseKm + m.tarif.parMin * course;
    var mult = Math.exp(m.dispersion * normale(rng) - m.dispersion * m.dispersion / 2);
    var r = rng(), z = "isole", cumul = 0;
    for (var k in m.zones) { cumul += m.zones[k]; if (r < cumul) { z = k; break; } }
    return { approcheMin: appr, approcheKm: approcheKm, courseMin: course, courseKm: courseKm, destination: z, brut: tarif * mult };
  }

  // n offres au format du moteur ; l'échelle des prix est réglée pour retrouver le prix moyen publié, plancher compris.
  function genererOffres(n, modele, graine) {
    var m = modele || MODELE_DEFAUT, rng = aleatoire(graine || 1), brutes = [];
    for (var i = 0; i < n; i++) brutes.push(tirerBrut(m, rng));
    function moyenne(k) { var t = 0; brutes.forEach(function (b) { t += Math.max(m.prixPlancher, dixieme(k * b.brut)); }); return t / n; }
    var lo = 0, hi = 20;
    for (var it = 0; it < 60; it++) { var mid = (lo + hi) / 2; if (moyenne(mid) < m.prixMoyen) lo = mid; else hi = mid; }
    var k = (lo + hi) / 2;
    return brutes.map(function (b) {
      return { prixNet: Math.max(m.prixPlancher, dixieme(k * b.brut)), approcheMin: b.approcheMin, approcheKm: b.approcheKm,
        courseMin: b.courseMin, courseKm: b.courseKm, destination: b.destination };
    });
  }

  // La barre (€ par minute) pour un flux d'offres : valeur(offre) → {v, tau} ; une offre toutes les intervalleMin minutes.
  function barre(offres, valeur, intervalleMin) {
    return seuilOptimal(offres.map(valeur), 1 / intervalleMin);
  }

  // Compare des politiques d'acceptation sur le même flux d'offres et le même tirage (nombres aléatoires communs).
  // Types : tout ; barre (calculée, éventuellement en croyant à un autre intervalle : intervalleSuppose) ;
  // objectif (€/h fixe sur le temps immobilisé) ; km (prix au kilomètre de course, le filtre que proposent les plateformes) ;
  // v1 (la première version de cette démo : objectif fixe, attente moyenne après dépose comprise).
  var ATTENTE_V1 = { centre: 5, peripherie: 15, isole: 30 };
  function comparer(p) {
    var pool = p.offres.map(function (o) { var vt = p.valeur(o, p.profil); return { v: vt.v, tau: vt.tau, o: o }; });
    var lambda = 1 / p.intervalleMin, g = seuilOptimal(pool, lambda), res = { barreHeure: g * 60 };
    Object.keys(p.politiques).forEach(function (nom) {
      var q = p.politiques[nom], accepter;
      if (q.type === "tout") accepter = function () { return true; };
      else if (q.type === "barre") {
        var gq = q.intervalleSuppose ? seuilOptimal(pool, 1 / q.intervalleSuppose) : g;
        accepter = function (x) { return x.v > 0 && x.v / x.tau >= gq; };
      } else if (q.type === "objectif") accepter = function (x) { return x.v / x.tau * 60 >= q.heure; };
      else if (q.type === "km") accepter = function (x) { return x.o.prixNet / Math.max(0.1, x.o.courseKm) >= q.parKm; };
      else if (q.type === "v1") accepter = function (x) { return x.v / (x.o.approcheMin + x.o.courseMin + ATTENTE_V1[x.o.destination]) * 60 >= q.heure; };
      else throw new Error("politique inconnue : " + q.type);
      var r = simuler({ tirer: function (rng) { return pool[Math.floor(rng() * pool.length)]; }, lambda: lambda,
        minutes: p.minutes || 600000, accepter: accepter, graine: p.graine || 1 });
      res[nom] = { parHeure: r.parHeure, tauxRefus: r.tauxRefus, offresVues: r.offresVues, offresPrises: r.offresPrises };
    });
    return res;
  }

  return { seuilOptimal: seuilOptimal, simuler: simuler, aleatoire: aleatoire, MODELE_DEFAUT: MODELE_DEFAUT,
    genererOffres: genererOffres, barre: barre, comparer: comparer };
});
