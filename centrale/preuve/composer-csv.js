#!/usr/bin/env node
/* Outil de la prévente : compose un samedi à partir de l'export CSV des réservations, sans aucune base de données.
   Usage :
     node composer-csv.js reservations.csv            -> tableau du samedi (J-10)
     node composer-csv.js reservations.csv --j7       -> seuil appliqué : vans confirmés, acomptes à rendre
     node composer-csv.js reservations.csv --retard ID MINUTES   -> le jour même : qui prévenir
   Colonnes attendues (première ligne) : id,sens,origine,station,heure,places,payee,code
     sens : montee | descente ; origine : aix | mrs ; station : vars | risoul ; heure : HH:MM ; payee : oui | non
   Rien n'est envoyé : l'outil écrit seulement le tableau et les messages à copier. */
"use strict";
const fs = require("fs");
const path = require("path");
const M = require(path.join(__dirname, "moteur.js"));

function lireCsv(texte) {
  const lignes = texte.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const sep = lignes[0].includes(";") ? ";" : ",";
  const tetes = lignes[0].split(sep).map((t) => t.trim().toLowerCase());
  return lignes.slice(1).map((l) => {
    const v = l.split(sep).map((x) => x.trim());
    const o = {};
    tetes.forEach((t, i) => { o[t] = v[i]; });
    return {
      id: o.id, sens: (o.sens || "").toLowerCase(), origine: (o.origine || "").toLowerCase(), station: (o.station || "").toLowerCase(),
      heure: o.heure, places: Number(o.places), payee: /^(oui|o|1|true|vrai)$/i.test(o.payee || ""), code: o.code || "",
    };
  });
}

const NOMS = { aix: "Aix TGV", mrs: "Aéroport Marseille", vars: "Vars", risoul: "Risoul" };
const STATUTS = { confirme: "confirmé", en_attente: "en attente", annule_rembourse: "annulé, acompte à rendre" };

function trajet(v) {
  const [g, s] = v.trajet.split("-");
  return v.sens === "montee" ? `${NOMS[g]} > ${NOMS[s]}` : `${NOMS[s]} > ${NOMS[g]}`;
}

function rapport(reservations, args) {
  const j7 = args.includes("--j7") || args.includes("--retard");
  const i = args.indexOf("--retard");
  const sorties = [];
  let c, changements = [], alertes = [];
  if (i >= 0) {
    const r = M.replacerApresRetard(reservations, args[i + 1], Number(args[i + 2]), { jMoins7: true });
    c = r.composition; changements = r.changements; alertes = r.alertes;
  } else c = M.composer(reservations, { jMoins7: j7 });
  sorties.push(`${c.vans.filter((v) => !v.vide).length} vans, ${reservations.length} réservations, interventions humaines : ${c.interventionsHumaines}`);
  c.vans.filter((v) => !v.vide).sort((a, b) => a.depart - b.depart).forEach((v) => {
    sorties.push(`${v.heureDepart}  ${trajet(v).padEnd(28)} ${String(v.places).padStart(1)}/8 places, ${v.payees} payées  ${STATUTS[v.statut]}  [${v.reservations.join(", ")}]`);
  });
  c.invalides.forEach((x) => sorties.push(`À CORRIGER : réservation ${x.id} (${x.erreurs.join(", ")})`));
  (c.liberees || []).forEach((id) => sorties.push(`Place libérée, acompte jamais versé : ${id}`));
  changements.forEach((ch) => {
    if (ch.type === "van") sorties.push(`Prévenir ${ch.id} : votre place passe dans le van de ${ch.apres}.`);
    else if (ch.type === "horaire") sorties.push(`Prévenir ${ch.id} : départ à ${ch.apres} au lieu de ${ch.avant}.`);
    else sorties.push(`Prévenir ${ch.id} : aucun van ne convient, proposer un transfert individuel ou le remboursement (CGV, article 5).`);
  });
  alertes.forEach((a) => sorties.push(`ALERTE ${a.id} : ${a.regle}`));
  const parCode = {};
  reservations.forEach((r) => { if (r.payee && r.code) parCode[r.code] = (parCode[r.code] || 0) + r.places; });
  Object.keys(parCode).sort().forEach((k) => sorties.push(`Places payées par le lien ${k} : ${parCode[k]}`));
  return sorties.join("\n");
}

if (require.main === module) {
  const [fichier, ...args] = process.argv.slice(2);
  if (!fichier) { console.error("Usage : node composer-csv.js reservations.csv [--j7 | --retard ID MINUTES]"); process.exit(2); }
  console.log(rapport(lireCsv(fs.readFileSync(fichier, "utf8")), args));
}

module.exports = { lireCsv, rapport };
