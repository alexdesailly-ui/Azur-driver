/* Démonstration Clé en Van : relie la page au moteur (moteur.js). Rien n'est envoyé, rien n'est payé. */
(function () {
  "use strict";
  var M = window.Moteur, D = window.DonneesDemo, L = window.LecturesIA || { mesures: [], exemples: [], note: "" };
  var PRIX = 55;
  var NOMS = { aix: "Aix-en-Provence TGV", mrs: "Aéroport Marseille Provence", vars: "Vars", risoul: "Risoul" };
  var COURT = { aix: "Aix TGV", mrs: "Aéroport de Marseille", vars: "Vars", risoul: "Risoul" };
  var SAMEDIS = { "1912": { nom: "samedi 19 décembre", j7: "samedi 12 décembre" }, "2612": { nom: "samedi 26 décembre", j7: "samedi 19 décembre" } };
  var CLE = "cle-en-van-preuve";

  var etat = { conciergerie: "Conciergerie de démonstration", station: "risoul", samedi: "1912", depuisLien: false, vous: null, phase: "j10", retard: null };
  var avantChangement = {};   // heures de départ affichées, pour faire « tourner » celles qui changent

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, enfants) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texte") n.textContent = attrs[k];
      else if (k === "classe") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === "string" ? document.createTextNode(e) : e); });
    return n;
  }
  function vider(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function personnes(n) { return n + (n > 1 ? " personnes" : " personne"); }

  // Mémoire locale : seulement une commodité, la page marche sans.
  function lire() {
    try {
      var o = JSON.parse(localStorage.getItem(CLE) || "null");
      if (o && typeof o === "object") ["conciergerie", "station", "samedi", "vous", "depuisLien"].forEach(function (k) { if (k in o) etat[k] = o[k]; });
    } catch (e) { /* stockage indisponible */ }
  }
  function ecrire() {
    try { localStorage.setItem(CLE, JSON.stringify({ conciergerie: etat.conciergerie, station: etat.station, samedi: etat.samedi, vous: etat.vous, depuisLien: etat.depuisLien })); } catch (e) { /* rien */ }
  }

  /* ---------- Onglets : les trois temps ---------- */
  var onglets = [$("onglet-1"), $("onglet-2"), $("onglet-3")];
  function montrer(i, focus) {
    onglets.forEach(function (o, j) {
      var actif = i === j;
      o.setAttribute("aria-selected", actif ? "true" : "false");
      o.tabIndex = actif ? 0 : -1;
      $("vue-" + (j + 1)).hidden = !actif;
    });
    if (focus) onglets[i].focus();
    if (i === 2) rendreSamedi();
  }
  onglets.forEach(function (o, i) {
    o.addEventListener("click", function () { montrer(i); });
    o.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowRight") n = (i + 1) % 3; else if (k === "ArrowLeft") n = (i + 2) % 3; else if (k === "Home") n = 0; else if (k === "End") n = 2;
      if (n !== null) { e.preventDefault(); montrer(n, true); }
    });
  });

  /* ---------- 1. Conciergerie ---------- */
  function code() { return "DEMO-" + etat.station.toUpperCase() + "-" + etat.samedi; }
  function lien() { return "https://cle-en-van.example/r/" + code(); }
  function texteMessage() {
    var s = SAMEDIS[etat.samedi];
    return "Bonjour,\nvotre séjour à " + NOMS[etat.station] + " approche. Si vous venez en train ou en avion, une place dans un van vous attend à Aix-en-Provence TGV ou à l'aéroport de Marseille, et vous dépose à la porte de votre location, à l'heure de la remise des clés.\n" +
      PRIX + " € par personne. Le van part dès que 6 places sur 8 sont réservées ; sinon, votre acompte vous est rendu.\nRéservez avant le " + s.j7 + " :";
  }
  function rendreConciergerie() {
    $("c-nom").value = etat.conciergerie; $("c-station").value = etat.station; $("c-samedi").value = etat.samedi;
    $("m-de").textContent = "Message de " + (etat.conciergerie || "votre conciergerie");
    $("m-texte").textContent = texteMessage();
    $("m-lien").textContent = lien();
  }
  $("c-nom").addEventListener("input", function () { etat.conciergerie = this.value.trim() || "Conciergerie de démonstration"; rendreConciergerie(); ecrire(); });
  $("c-station").addEventListener("change", function () { etat.station = this.value; rendreConciergerie(); ecrire(); });
  $("c-samedi").addEventListener("change", function () { etat.samedi = this.value; etat.retard = null; rendreConciergerie(); ecrire(); });
  $("copier").addEventListener("click", function () {
    var t = $("m-de").textContent + "\n\n" + texteMessage() + "\n" + lien();
    function selectionner() {
      try { var r = document.createRange(); r.selectNodeContents(document.querySelector(".message")); var s = getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) { /* rien */ }
      $("retour-copie").textContent = "Le texte est sélectionné : copiez-le avec votre clavier.";
    }
    try {
      navigator.clipboard.writeText(t).then(function () { $("retour-copie").textContent = "Message copié."; }, selectionner);
    } catch (e) { selectionner(); }
  });
  $("ouvrir-lien").addEventListener("click", function () {
    etat.depuisLien = true; ecrire();
    $("v-station").value = etat.station;
    rendreSource();
    montrer(1);
    $("vue-2").scrollIntoView({ block: "start" });
  });

  /* ---------- 2. Voyageur ---------- */
  for (var p = 1; p <= 8; p++) $("v-places").appendChild(el("option", { value: String(p), texte: personnes(p) }));
  function rendreSource() {
    var s = SAMEDIS[etat.samedi];
    $("source").textContent = etat.depuisLien
      ? "Vous venez du lien de " + etat.conciergerie + ", pour une arrivée le " + s.nom + " à " + NOMS[etat.station] + ". Code du lien : " + code() + "."
      : "Vous arrivez sans lien de conciergerie : la place n'est attribuée à aucune conciergerie.";
  }
  function sensChoisi() { var r = document.querySelector('input[name="sens"]:checked'); return r ? r.value : "montee"; }
  function majLibelleHeure() {
    $("l-heure").textContent = sensChoisi() === "montee" ? "Heure d'arrivée de votre train ou de votre vol" : "Heure de départ de votre train ou de votre vol";
  }
  Array.prototype.forEach.call(document.querySelectorAll('input[name="sens"]'), function (r) { r.addEventListener("change", majLibelleHeure); });
  function remplir(v) {
    var radio = document.querySelector('input[name="sens"][value="' + v.sens + '"]'); if (radio) radio.checked = true;
    if (v.origine) $("v-origine").value = v.origine;
    if (v.station) $("v-station").value = v.station;
    if (v.heure) $("v-heure").value = v.heure;
    if (v.places) $("v-places").value = String(v.places);
    majLibelleHeure();
  }
  function marquer(champs) {
    ["origine", "heure", "places", "station"].forEach(function (c) {
      var bloc = $("ch-" + c), ancien = bloc.querySelector(".indice");
      if (ancien) ancien.remove();
      bloc.classList.toggle("a-redemander", champs.indexOf(c) >= 0);
      if (champs.indexOf(c) >= 0) bloc.appendChild(el("span", { classe: "indice", texte: "À redemander au voyageur : le message ne le dit pas clairement." }));
    });
  }

  // Lectures enregistrées du modèle local
  var sel = $("v-message");
  sel.appendChild(el("option", { value: "", texte: "Choisir un message de voyageur" }));
  L.exemples.forEach(function (x, i) { sel.appendChild(el("option", { value: String(i), texte: x.texte })); });
  sel.addEventListener("change", function () {
    var x = L.exemples[+this.value];
    if (!x) { $("v-lu").textContent = ""; marquer([]); return; }
    var lignes = ["Le modèle a lu (" + String(x.secondes).replace(".", ",") + " s) :", JSON.stringify(x.lu, null, 1), "", "Le code retient :"];
    Object.keys(x.retenu).forEach(function (c) {
      var v = x.retenu[c];
      lignes.push("  " + c + " : " + (x.aRedemander.indexOf(c) >= 0 ? "à redemander" : v));
    });
    if (x.fauxAcceptes.length) lignes.push("", "Erreur non détectée par le code (" + x.fauxAcceptes.join(", ") + ") : le voyageur la corrige en relisant son récapitulatif avant de payer.");
    $("v-lu").textContent = lignes.join("\n");
    var v = {};
    Object.keys(x.retenu).forEach(function (c) { if (x.aRedemander.indexOf(c) < 0) v[c] = x.retenu[c]; });
    remplir(v);
    marquer(x.aRedemander.filter(function (c) { return c !== "sens"; }));
  });

  $("form-voyageur").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = { id: "VOUS", sens: sensChoisi(), origine: $("v-origine").value, station: $("v-station").value, heure: $("v-heure").value,
      places: +$("v-places").value, payee: $("v-acompte").checked, libelle: "votre réservation", vous: true };
    var erreurs = M.valider(r);
    if (erreurs.length) {
      vider($("resultat"));
      $("resultat").appendChild(el("p", { classe: "encart", texte: "Il manque une information : " + erreurs.join(", ") + ". Complétez le formulaire puis réservez." }));
      return;
    }
    etat.vous = r; etat.retard = null; ecrire(); marquer([]);
    rendreResultat();
  });

  function reservationsDuSamedi() {
    var base = etat.samedi === "1912" ? D.reservations.slice() : [];
    if (etat.vous) base.push(etat.vous);
    return base;
  }

  function ligneVan(v, parId, options) {
    options = options || {};
    var membres = v.reservations.map(function (id) { return parId[id]; });
    var heures = membres.map(function (r) { return M.enMinutes(r.heure) + (r.retard || 0); });
    var depuis = v.trajet.split("-"), gare = depuis[0], station = depuis[1];
    var titre = v.sens === "montee" ? NOMS[gare] + " > " + NOMS[station] : NOMS[station] + " > " + NOMS[gare];
    var mot = gare === "aix" ? "trains" : "vols";
    var detail = v.sens === "montee"
      ? (membres.length > 1 ? "après les " + mot + " arrivés de " + M.enHeure(Math.min.apply(null, heures)) + " à " + M.enHeure(Math.max.apply(null, heures)) : "après le " + mot.slice(0, -1) + " arrivé à " + M.enHeure(heures[0])) + ", arrivée vers " + v.heureArrivee
      : "en gare à " + v.heureArrivee + ", pour les " + mot + " de " + M.enHeure(Math.min.apply(null, heures)) + " à " + M.enHeure(Math.max.apply(null, heures));
    var libelles = { confirme: ["confirmé", "confirme"], en_attente: ["en attente", "attente"], annule_rembourse: ["annulé, acompte rendu", "annule"] };
    var lib = libelles[v.statut] || [v.statut, "attente"];
    var places = el("span", { classe: "places", "aria-label": v.places + " places réservées sur 8, dont " + v.payees + " payées" });
    membres.forEach(function (r) { for (var i = 0; i < r.places; i++) places.appendChild(el("i", { classe: r.vous ? "prise vous" : r.payee ? "prise" : "libre-non-paye" })); });
    for (var k = v.places; k < 8; k++) places.appendChild(el("i"));
    var li = el("li", { classe: "depart" + (v.statut === "annule_rembourse" ? " annule" : "") + (options.bouge ? " bouge" : "") }, [
      el("span", { classe: "heure", texte: v.heureDepart }),
      el("span", { classe: "trajet" }, [el("b", { texte: titre }), el("span", { texte: detail })]),
      el("span", { classe: "etat " + lib[1], texte: lib[0] }),
      places
    ]);
    return li;
  }

  function rendreResultat() {
    var zone = $("resultat"); vider(zone);
    var r = etat.vous; if (!r) return;
    var res = reservationsDuSamedi(), parId = {};
    res.forEach(function (x) { parId[x.id] = x; });
    var c = M.composer(res), v = c.vans.find(function (x) { return x.reservations.indexOf("VOUS") >= 0; });
    var mesPayees = r.payee ? r.places : 0, seuil = c.params.seuil, s = SAMEDIS[etat.samedi];
    var tab = el("div", { classe: "tableau" }, [
      el("div", { classe: "tableau-tete" }, [el("span", { texte: "Votre van, " + s.nom }), el("span", { texte: "places réservées sur 8" })]),
      el("ul", { classe: "tableau-liste" }, [ligneVan(v, parId)])
    ]);
    var trajet = r.sens === "montee"
      ? "Départ à " + v.heureDepart + " de " + NOMS[r.origine] + ", arrivée à " + NOMS[r.station] + " vers " + v.heureArrivee + ", à la porte de votre location."
      : "Le chauffeur vous prend à votre location à " + NOMS[r.station] + " à " + v.heureDepart + " ; arrivée à " + NOMS[r.origine] + " à " + v.heureArrivee + ", " + (r.origine === "aix" ? "45 minutes avant votre train." : "1 h 30 avant votre vol.");
    var seuilTxt;
    if (!r.payee) seuilTxt = "Sans acompte, votre place ne compte pas pour le seuil et sera libérée le " + s.j7 + " (J-7).";
    else if (v.statut === "confirme" && v.payees - mesPayees < seuil) seuilTxt = "Votre réservation fait passer ce van à " + v.payees + " places payées : son départ est confirmé.";
    else if (v.statut === "confirme") seuilTxt = "Ce van avait déjà atteint le seuil de " + seuil + " places : votre départ est confirmé.";
    else seuilTxt = "Ce van compte " + v.payees + " places payées sur les " + seuil + " nécessaires. Le " + s.j7 + " (J-7), s'il ne les atteint pas, votre acompte vous est rendu.";
    zone.appendChild(el("h3", { texte: "Votre place est réservée", style: "font-size:1.3rem;font-weight:800" }));
    zone.appendChild(tab);
    zone.appendChild(el("p", { texte: trajet }));
    zone.appendChild(el("p", { classe: "encart", texte: seuilTxt }));
    zone.appendChild(el("p", { classe: "prix", texte: (r.places * PRIX) + " €" }));
    zone.appendChild(el("p", { classe: "note", texte: r.places + " × " + PRIX + " €, aller simple. Démonstration : aucun paiement n'a eu lieu. Dans le vrai service, vous relisez ce récapitulatif avant de payer." }));
    var b = el("button", { classe: "bouton secondaire", type: "button", texte: "Voir le samedi complet" });
    b.addEventListener("click", function () { montrer(2); $("vue-3").scrollIntoView({ block: "start" }); });
    zone.appendChild(b);
  }

  /* ---------- 3. Le samedi ---------- */
  Array.prototype.forEach.call(document.querySelectorAll(".phases button"), function (b) {
    b.addEventListener("click", function () { etat.phase = b.getAttribute("data-phase"); if (etat.phase !== "j") etat.retard = null; rendreSamedi(); });
  });

  function rendreSamedi() {
    var s = SAMEDIS[etat.samedi], res = reservationsDuSamedi(), parId = {};
    res.forEach(function (x) { parId[x.id] = x; });
    Array.prototype.forEach.call(document.querySelectorAll(".phases button"), function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-phase") === etat.phase ? "true" : "false"); });
    $("t-titre").textContent = "Départs du " + s.nom;
    var opts = etat.phase === "j10" ? {} : { jMoins7: true };
    var c, changements = [], alertes = [], retardTxt = null;
    if (etat.phase === "j" && etat.retard && parId[etat.retard.id]) {
      var rr = M.replacerApresRetard(res, etat.retard.id, etat.retard.minutes, opts);
      c = rr.composition; changements = rr.changements; alertes = rr.alertes;
      rr.reservations.forEach(function (x) { parId[x.id] = x; });
      retardTxt = etat.retard;
    } else c = M.composer(res, opts);

    // Tableau
    var corps = $("t-corps"); vider(corps);
    if (!res.length) corps.appendChild(el("p", { classe: "groupe", texte: "Aucune réservation pour ce samedi. Réservez une place dans la vue 2 pour voir le seuil s'appliquer." }));
    var vansVisibles = c.vans.filter(function (v) { return !v.vide; });
    var bouges = {};
    changements.forEach(function (ch) { if (ch.van) bouges[ch.van] = true; });
    [["descente", "Descentes du matin, de la station vers la gare"], ["montee", "Montées de l'après-midi, de la gare vers la station"]].forEach(function (g) {
      var liste = vansVisibles.filter(function (v) { return v.sens === g[0]; }).sort(function (a, b) { return a.depart - b.depart; });
      if (!liste.length) return;
      corps.appendChild(el("p", { classe: "groupe", texte: g[1] }));
      var ul = el("ul", { classe: "tableau-liste" });
      liste.forEach(function (v) {
        var cle = v.reservations.slice().sort().join(","), bouge = !!bouges[v.id] || (avantChangement[cle] && avantChangement[cle] !== v.heureDepart);
        ul.appendChild(ligneVan(v, parId, { bouge: bouge }));
      });
      corps.appendChild(ul);
    });
    avantChangement = {};
    vansVisibles.forEach(function (v) { avantChangement[v.reservations.slice().sort().join(",")] = v.heureDepart; });
    $("t-compteur").textContent = "interventions humaines : " + c.interventionsHumaines;

    // Retards (jour J seulement)
    $("bloc-retards").hidden = etat.phase !== "j";
    var zr = $("retards"); vider(zr);
    var scenarios = [{ id: null, titre: "Aucun retard" }].concat(D.retards.filter(function (x) { return parId[x.id]; }));
    scenarios.forEach(function (sc) {
      var actif = sc.id === null ? !etat.retard : !!(etat.retard && etat.retard.id === sc.id);
      var b = el("button", { type: "button", "aria-pressed": actif ? "true" : "false", texte: sc.titre });
      b.addEventListener("click", function () { etat.retard = sc.id ? { id: sc.id, minutes: sc.minutes } : null; rendreSamedi(); });
      zr.appendChild(b);
    });

    rendreEnvois(c, parId, changements, retardTxt);
    rendreJournees(c);
    rendreJournal(c, res, changements, alertes, retardTxt, parId);
  }

  function aQui(r) { return r.vous ? "Votre réservation" : "Réservation " + r.id + ", " + r.libelle; }
  function vanDe(c, id) { return c.vans.find(function (v) { return v.reservations.indexOf(id) >= 0; }); }

  function rendreEnvois(c, parId, changements, retard) {
    var ul = $("envois"); vider(ul);
    function ajouter(a, texte) { ul.appendChild(el("li", {}, [el("span", { classe: "a", texte: a }), texte])); }
    var s = SAMEDIS[etat.samedi];
    if (etat.phase === "j10") {
      if (etat.vous) {
        var v = vanDe(c, "VOUS");
        ajouter("Votre réservation", "Votre place est réservée dans le van de " + v.heureDepart + " (" + COURT[v.trajet.split("-")[v.sens === "montee" ? 0 : 1]] + "). Le " + s.j7 + ", vous saurez si le van part.");
      } else ajouter("Aucun destinataire", "Rien à envoyer avant J-7 : les réservations s'accumulent.");
      return;
    }
    if (etat.phase === "j7") {
      c.vans.forEach(function (v) {
        var dest = v.reservations.map(function (id) { return parId[id]; });
        var a = dest.length === 1 ? aQui(dest[0]) : dest.length + " réservations du van de " + v.heureDepart;
        if (v.statut === "confirme") ajouter(a, "Votre départ du " + s.nom + " est confirmé : van de " + v.heureDepart + ". Le solde est débité aujourd'hui.");
        else ajouter(a, "Ce van n'a pas atteint 6 places payées : votre acompte vous est intégralement rendu. Si vous le souhaitez, un transfert privé vous est proposé au prix du marché.");
      });
      (c.liberees || []).forEach(function (id) { ajouter(aQui(parId[id]), "Sans acompte versé, votre place est libérée."); });
      return;
    }
    if (!retard) { ajouter("Aucun destinataire", "Aucun retard signalé : les vans partent à l'heure prévue."); return; }
    var r = parId[retard.id], arrive = M.enHeure(M.enMinutes(r.heure) + retard.minutes), mot = r.origine === "aix" ? "train" : "vol";
    var lui = changements.find(function (ch) { return ch.id === retard.id; });
    if (!lui) {
      var v0 = vanDe(c, retard.id);
      ajouter(aQui(r), "Votre " + mot + " arrive à " + arrive + " : votre van part comme prévu à " + v0.heureDepart + ". Rien à faire.");
    }
    changements.forEach(function (ch) {
      var x = parId[ch.id];
      if (ch.type === "van") ajouter(aQui(x), "Votre " + mot + " arrive à " + arrive + ". Votre place passe dans le van de " + ch.apres + ", au même point de rendez-vous. Rien à faire de votre côté.");
      else if (ch.type === "horaire" && ch.id === retard.id) ajouter(aQui(x), "Votre " + mot + " arrive à " + arrive + " : votre van vous attend et part à " + ch.apres + ".");
      else if (ch.type === "horaire") ajouter(aQui(x), "Votre van part désormais à " + ch.apres + " au lieu de " + ch.avant + ".");
      else if (ch.type === "sans_van") ajouter(aQui(x), "Votre " + mot + " arrive à " + arrive + " et aucun van de la journée n'a de place pour vous. Choisissez dans ce message : un transfert individuel, ou le remboursement de votre place (conditions de vente, article 5).");
    });
  }

  function rendreJournees(c) {
    var ul = $("journees"); vider(ul);
    function court(v) {
      var t = v.trajet.split("-");
      return v.heureDepart + " " + (v.sens === "montee" ? COURT[t[0]] + " > " + COURT[t[1]] : COURT[t[1]] + " > " + COURT[t[0]]) + " (" + v.places + " places)";
    }
    function roule(v) { return v && !v.vide && v.statut !== "annule_rembourse"; }
    var n = 0;
    c.journees.forEach(function (j) {
      var d = roule(j.descente) ? j.descente : null, m = roule(j.montee) ? j.montee : null;
      if (!d && !m) return;
      n++;
      var detail = d && m ? court(d) + ", puis " + court(m) : d ? "descente seule : " + court(d) : "montée seule : " + court(m);
      ul.appendChild(el("li", {}, ["Journée " + n, el("span", { texte: detail })]));
    });
    if (!n) ul.appendChild(el("li", {}, ["Aucune journée", el("span", { texte: "Aucun van ne roule pour l'instant." })]));
  }

  function rendreJournal(c, res, changements, alertes, retard, parId) {
    var ul = $("journal"); vider(ul);
    function ajouter(t) { ul.appendChild(el("li", { texte: t })); }
    var vans = c.vans.filter(function (v) { return !v.vide; });
    ajouter(vans.length + " vans composés à partir de " + res.length + " réservations, sans dépasser 8 places.");
    if (etat.phase !== "j10") {
      var conf = vans.filter(function (v) { return v.statut === "confirme"; }).length, ann = vans.length - conf;
      ajouter(conf + " vans confirmés à J-7 (6 places payées ou plus)" + (ann ? ", " + ann + " annulé" + (ann > 1 ? "s" : "") + " avec acomptes rendus." : "."));
      if (c.liberees && c.liberees.length) ajouter(c.liberees.length + " place" + (c.liberees.length > 1 ? "s" : "") + " sans acompte libérée" + (c.liberees.length > 1 ? "s" : "") + ".");
    } else {
      var att = vans.filter(function (v) { return v.statut !== "confirme"; }).length;
      ajouter(att ? att + " van en attente du seuil de 6 places payées." : "Tous les vans ont atteint le seuil.");
    }
    var paires = c.journees.filter(function (j) { return j.descente && j.montee && j.descente.statut !== "annule_rembourse" && j.montee.statut !== "annule_rembourse"; }).length;
    ajouter(paires + " journée" + (paires > 1 ? "s" : "") + " de chauffeur avec descente et montée dans le même van.");
    if (retard) {
      var r = parId[retard.id], lui = changements.find(function (ch) { return ch.id === retard.id; });
      if (!lui) ajouter("Retard de " + retard.minutes + " min absorbé : le van de " + r.id + " partait déjà après son arrivée.");
      else if (lui.type === "van") ajouter("Réservation " + r.id + " placée dans le van de " + lui.apres + " ; les voyageurs à l'heure ne bougent pas.");
      else if (lui.type === "horaire") ajouter("Le van de " + r.id + " l'attend : départ à " + lui.apres + ".");
      else ajouter("Aucun van ne convient pour " + r.id + " : message de l'article 5 préparé, le voyageur choisit.");
      var autres = changements.filter(function (ch) { return ch.id !== retard.id; }).length;
      if (autres) ajouter(autres + " autre" + (autres > 1 ? "s" : "") + " voyageur" + (autres > 1 ? "s" : "") + " prévenu" + (autres > 1 ? "s" : "") + " d'un nouvel horaire.");
      if (alertes.length) ajouter("Alerte enregistrée pour le bilan de la semaine, sans appel le samedi.");
    }
    ajouter("Interventions humaines : " + c.interventionsHumaines + ".");
  }

  /* ---------- Mesures de la lecture des messages ---------- */
  function rendreMesures() {
    var tb = document.querySelector("#mesures tbody"); vider(tb);
    L.mesures.forEach(function (m) {
      tb.appendChild(el("tr", {}, [
        el("td", { texte: m.essai }),
        el("td", { texte: m.champs + " (" + Math.round(m.precision * 100) + " %)" }),
        el("td", { texte: m.entiers }),
        el("td", { texte: String(m.inventions) }),
        el("td", { texte: String(m.fauxAcceptes) }),
        el("td", { texte: String(m.latence[0]).replace(".", ",") + " s, " + String(m.latence[1]).replace(".", ",") + " s" })
      ]));
    });
    $("mesures-note").textContent = L.note;
  }

  /* ---------- Démarrage ---------- */
  lire();
  remplir(D.voyageurPropose);
  if (etat.vous) remplir(etat.vous);
  $("v-station").value = etat.vous ? etat.vous.station : etat.station;
  rendreConciergerie(); rendreSource(); rendreMesures();
  if (etat.vous) rendreResultat();
  var ancre = (location.hash || "").replace("#", "");
  if (ancre === "voyageur") montrer(1); else if (ancre === "samedi") montrer(2); else montrer(0);
})();
