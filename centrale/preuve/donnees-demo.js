/* Samedi de démonstration (19/12/2026). Réservations 100 % fictives : aucun nom, aucun voyageur réel. */
(function (racine, fabrique) {
  if (typeof module === "object" && module.exports) module.exports = fabrique();
  else racine.DonneesDemo = fabrique();
})(typeof self !== "undefined" ? self : this, function () {
  function R(id, sens, origine, station, heure, places, payee, libelle) {
    return { id: id, sens: sens, origine: origine, station: station, heure: heure, places: places, payee: payee, libelle: libelle };
  }
  return {
    samedi: "samedi 19 décembre",
    jMoins7: "samedi 12 décembre",
    reservations: [
      R("D1", "descente", "aix", "vars",   "13:04", 4, true,  "famille, TGV de 13:04"),
      R("D2", "descente", "aix", "vars",   "13:40", 3, true,  "trois amis, TGV de 13:40"),
      R("D3", "descente", "mrs", "risoul", "14:30", 2, true,  "couple, vol de 14:30"),
      R("D4", "descente", "mrs", "risoul", "15:00", 1, true,  "une personne, vol de 15:00"),
      R("D5", "descente", "mrs", "risoul", "15:10", 3, true,  "famille, vol de 15:10"),
      R("M1", "montee",   "aix", "vars",   "13:10", 2, true,  "couple, TGV de 13:10"),
      R("M2", "montee",   "aix", "vars",   "13:25", 4, true,  "famille, TGV de 13:25"),
      R("M3", "montee",   "aix", "vars",   "13:48", 1, true,  "une personne, TGV de 13:48"),
      R("M4", "montee",   "aix", "vars",   "15:20", 4, true,  "famille, TGV de 15:20"),
      R("M5", "montee",   "aix", "vars",   "15:40", 2, true,  "couple, TGV de 15:40"),
      R("M6", "montee",   "mrs", "risoul", "16:05", 4, true,  "famille, vol de 16:05"),
      R("M7", "montee",   "mrs", "risoul", "16:30", 2, true,  "couple, vol de 16:30"),
      R("M8", "montee",   "aix", "risoul", "14:10", 2, true,  "couple, TGV de 14:10"),
      R("M9", "montee",   "aix", "risoul", "14:35", 1, false, "une personne, TGV de 14:35, acompte non versé")
    ],
    // Réservation proposée au visiteur dans la vue Voyageur : elle fait passer le van Aix > Risoul au seuil.
    voyageurPropose: { sens: "montee", origine: "aix", station: "risoul", heure: "14:20", places: 4 },
    retards: [
      { id: "M1", minutes: 120, titre: "Le TGV de 13:10 arrive avec 2 h de retard" },
      { id: "M6", minutes: 20,  titre: "Le vol de 16:05 arrive avec 20 min de retard" },
      { id: "M2", minutes: 100, titre: "Le TGV de 13:25 arrive avec 1 h 40 de retard" }
    ]
  };
});
