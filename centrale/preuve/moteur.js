/* Moteur de rotation Clé en Van — démonstration.
   Compose les vans d'un samedi à partir des réservations, applique le seuil de départ,
   apparie descente (matin) et montée (après-midi), et replace les voyageurs en retard.
   Fonctionne dans le navigateur (window.Moteur) et sous Node (module.exports). Aucune donnée n'est envoyée. */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.Moteur = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var PARAMS = {
    capacite: 8,              // places passagers d'un van
    seuil: 6,                 // places payées à J-7 pour confirmer un van
    fenetreMontee: 45,        // un van attend au plus 45 min après la première arrivée
    margeMontee: 20,          // départ 20 min après la dernière arrivée du van
    fenetreDescente: 60,      // voyageurs dont l'heure limite en gare tient dans 60 min
    avanceGare: { aix: 45, mrs: 90 },   // arriver en gare 45 min avant le train, 90 min avant le vol
    // Durées de trajet en minutes. mrs-risoul : 171 min (montransport, 237 km). Les autres : à justifier.
    duree: { "aix-vars": 165, "aix-risoul": 160, "mrs-vars": 175, "mrs-risoul": 171 }
  };

  function enMinutes(hhmm) { var p = String(hhmm).split(":"); return (+p[0]) * 60 + (+p[1]); }
  function enHeure(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m; }
  function cle(r) { return r.origine + "-" + r.station; }

  function valider(r) {
    var e = [];
    if (["montee", "descente"].indexOf(r.sens) < 0) e.push("sens");
    if (["aix", "mrs"].indexOf(r.origine) < 0) e.push("origine");
    if (["vars", "risoul"].indexOf(r.station) < 0) e.push("station");
    if (!/^\d{1,2}:\d{2}$/.test(r.heure || "")) e.push("heure");
    if (!(r.places >= 1 && r.places <= 8)) e.push("places");
    return e;
  }

  // Montée : gare -> station. On regroupe par trajet, dans l'ordre des arrivées effectives (heure + retard).
  function composerMontee(res, P) {
    var groupes = {}, vans = [], aTraiter = [];
    res.forEach(function (r) { (groupes[cle(r)] = groupes[cle(r)] || []).push(r); });
    Object.keys(groupes).sort().forEach(function (k) {
      var liste = groupes[k].slice().sort(function (a, b) { return (enMinutes(a.heure) + (a.retard || 0)) - (enMinutes(b.heure) + (b.retard || 0)); });
      var van = null;
      liste.forEach(function (r) {
        var arrivee = enMinutes(r.heure) + (r.retard || 0);
        var tient = van && (arrivee - van.premiere) <= P.fenetreMontee && (van.places + r.places) <= P.capacite;
        if (!tient) { van = { sens: "montee", trajet: k, premiere: arrivee, derniere: arrivee, places: 0, payees: 0, reservations: [] }; vans.push(van); }
        van.reservations.push(r.id); van.places += r.places; if (r.payee) van.payees += r.places; van.derniere = Math.max(van.derniere, arrivee);
      });
    });
    vans.forEach(function (v) {
      v.depart = v.derniere + P.margeMontee; v.arrivee = v.depart + P.duree[v.trajet];
      v.heureDepart = enHeure(v.depart); v.heureArrivee = enHeure(v.arrivee);
    });
    return { vans: vans, aTraiter: aTraiter };
  }

  // Descente : station -> gare. L'heure de la réservation est celle du train ou du vol ; on doit être en gare avant (avanceGare).
  function composerDescente(res, P) {
    var groupes = {}, vans = [];
    res.forEach(function (r) { (groupes[cle(r)] = groupes[cle(r)] || []).push(r); });
    Object.keys(groupes).sort().forEach(function (k) {
      var origine = k.split("-")[0];
      var liste = groupes[k].slice().sort(function (a, b) { return enMinutes(a.heure) - enMinutes(b.heure); });
      var van = null;
      liste.forEach(function (r) {
        var limite = enMinutes(r.heure) - P.avanceGare[origine];
        var tient = van && (limite - van.limite) <= P.fenetreDescente && (van.places + r.places) <= P.capacite;
        if (!tient) { van = { sens: "descente", trajet: k, limite: limite, places: 0, payees: 0, reservations: [] }; vans.push(van); }
        van.reservations.push(r.id); van.places += r.places; if (r.payee) van.payees += r.places;
      });
    });
    vans.forEach(function (v) {
      v.arrivee = v.limite; v.depart = v.limite - P.duree[v.trajet];
      v.heureDepart = enHeure(v.depart); v.heureArrivee = enHeure(v.arrivee);
    });
    return { vans: vans };
  }

  function statut(van, jMoins7, P) {
    if (van.payees >= P.seuil) return "confirme";
    return jMoins7 ? "annule_rembourse" : "en_attente";
  }

  // Une « journée » de partenaire : une descente le matin, puis une montée depuis la même gare.
  function apparier(descentes, montees) {
    var libres = montees.slice().sort(function (a, b) { return a.depart - b.depart; });
    var journees = [];
    descentes.slice().sort(function (a, b) { return a.arrivee - b.arrivee; }).forEach(function (d) {
      var origine = d.trajet.split("-")[0];
      var i = libres.findIndex(function (m) { return m.trajet.split("-")[0] === origine && m.depart >= d.arrivee + 15; });
      if (i >= 0) { journees.push({ descente: d, montee: libres[i] }); libres.splice(i, 1); }
      else journees.push({ descente: d, montee: null });
    });
    libres.forEach(function (m) { journees.push({ descente: null, montee: m }); });
    return journees;
  }

  function composer(reservations, options) {
    var P = Object.assign({}, PARAMS, (options && options.params) || {});
    var jMoins7 = !!(options && options.jMoins7);
    var invalides = [], ok = [];
    var liberees = [];
    reservations.forEach(function (r) {
      var e = valider(r);
      if (e.length) invalides.push({ id: r.id, erreurs: e });
      else if (jMoins7 && !r.payee) liberees.push(r.id);   // à J-7, une place sans acompte est libérée
      else ok.push(r);
    });
    var m = composerMontee(ok.filter(function (r) { return r.sens === "montee"; }), P).vans;
    var d = composerDescente(ok.filter(function (r) { return r.sens === "descente"; }), P).vans;
    m.concat(d).forEach(function (v, i) { v.id = "V" + (i + 1); v.statut = statut(v, jMoins7, P); });
    var journees = apparier(d, m);
    var interventions = invalides.length; // seuls les cas que le moteur ne sait pas traiter demandent un humain
    return { params: P, vans: m.concat(d), journees: journees, invalides: invalides, liberees: liberees, interventionsHumaines: interventions };
  }

  // Retard, le jour même (après J-7, les statuts sont figés : un van confirmé roule).
  // Règle d'exploitation : on ne déplace JAMAIS un voyageur à l'heure. Seul le retardataire bouge :
  //  1. son van peut l'attendre si son arrivée tient dans la fenêtre d'attente (les autres partent un peu plus tard) ;
  //  2. sinon, le premier van suivant du même trajet qui a la place le prend (CGV, article 5) ;
  //  3. sinon, aucun van ne convient : alerte, et le message prévu par l'article 5 propose un transfert ou le remboursement.
  // Si son van l'attendait (il était le dernier arrivé), ce van part plus tôt : ses compagnons sont prévenus du nouvel horaire.
  function replacerApresRetard(reservations, id, retardMin, options) {
    var base = composer(reservations, options), P = base.params;
    var maj = reservations.map(function (r) { return r.id === id ? Object.assign({}, r, { retard: retardMin }) : r; });
    var parId = {}; maj.forEach(function (r) { parId[r.id] = r; });
    var vans = base.vans.map(function (v) { return Object.assign({}, v, { reservations: v.reservations.slice() }); });
    var cible = parId[id], changements = [], alertes = [];
    function fin() {
      var m = vans.filter(function (v) { return v.sens === "montee"; }), d = vans.filter(function (v) { return v.sens === "descente"; });
      var composition = Object.assign({}, base, { vans: vans, journees: apparier(d, m) });
      return { composition: composition, changements: changements, alertes: alertes, reservations: maj };
    }
    function arrivee(r) { return enMinutes(r.heure) + (r.retard || 0); }
    function caler(v, depart) { v.depart = depart; v.arrivee = depart + P.duree[v.trajet]; v.heureDepart = enHeure(v.depart); v.heureArrivee = enHeure(v.arrivee); }
    function prevenir(v, ancien, sauf) {
      if (v.heureDepart === ancien) return;
      v.reservations.forEach(function (x) { if (x !== sauf) changements.push({ id: x, type: "horaire", avant: ancien, apres: v.heureDepart, van: v.id }); });
    }
    var origine = cible && vans.find(function (v) { return v.reservations.indexOf(id) >= 0; });
    if (!cible || !origine || cible.sens !== "montee" || origine.statut === "annule_rembourse") return fin(); // descente ou place déjà remboursée : rien à faire
    var a = arrivee(cible), ancienDepart = origine.heureDepart;
    var autres = origine.reservations.filter(function (x) { return x !== id; }).map(function (x) { return parId[x]; });
    var candidats = [];
    if (autres.length === 0) candidats.push({ van: origine, depart: a + P.margeMontee });
    else {
      var premiere = Math.min.apply(null, autres.map(arrivee)), derniere = Math.max.apply(null, autres.map(arrivee));
      if (a - premiere <= P.fenetreMontee) candidats.push({ van: origine, depart: Math.max(derniere, a) + P.margeMontee });
    }
    vans.forEach(function (v) {
      if (v === origine || v.sens !== "montee" || v.trajet !== origine.trajet || v.statut === "annule_rembourse") return;
      if (v.places + cible.places > P.capacite) return;
      var attend = a - v.premiere <= P.fenetreMontee;
      if (a + P.margeMontee <= v.depart || attend) candidats.push({ van: v, depart: Math.max(v.depart, a + P.margeMontee) });
    });
    candidats.sort(function (x, y) { return x.depart - y.depart || (x.van === origine ? -1 : 1); });
    var choix = candidats[0];
    if (choix && choix.van === origine) {
      caler(origine, choix.depart);
      if (origine.heureDepart !== ancienDepart) changements.push({ id: id, type: "horaire", avant: ancienDepart, apres: origine.heureDepart, van: origine.id });
      prevenir(origine, ancienDepart, id);
      return fin();
    }
    // Le retardataire quitte son van ; si ce van l'attendait, il part plus tôt.
    origine.reservations = autres.map(function (r) { return r.id; });
    origine.places -= cible.places; if (cible.payee) origine.payees -= cible.places;
    if (autres.length) { caler(origine, Math.max.apply(null, autres.map(arrivee)) + P.margeMontee); prevenir(origine, ancienDepart, null); }
    else origine.vide = true;
    if (choix) {
      var v = choix.van, ancienV = v.heureDepart;
      caler(v, choix.depart); prevenir(v, ancienV, null);
      v.reservations.push(id); v.places += cible.places; if (cible.payee) v.payees += cible.places;
      v.derniere = Math.max(v.derniere, a);
      changements.push({ id: id, type: "van", avant: ancienDepart, apres: v.heureDepart, van: v.id });
    } else {
      changements.push({ id: id, type: "sans_van", avant: ancienDepart, apres: null, van: null });
      alertes.push({ id: id, regle: "Aucun van de la journée ne convient. Le message prévu à l'article 5 des CGV propose au voyageur un transfert individuel ou le remboursement de sa place ; il choisit lui-même." });
    }
    return fin();
  }

  return { PARAMS: PARAMS, composer: composer, replacerApresRetard: replacerApresRetard, enMinutes: enMinutes, enHeure: enHeure, valider: valider };
});
