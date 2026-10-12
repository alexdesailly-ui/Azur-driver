"""Transforme des fichiers de trajet « À la place » (trajet.schema.json) en un flux GTFS-Flex unique.

Pourquoi GTFS-Flex : c'est l'extension officielle de GTFS pour le transport à la demande (adoptée en mars 2024).
Un trajet y est décrit par des ZONES et des FENÊTRES de prise en charge, jamais par un horaire fixe :
c'est exactement la règle juridique du réseau (un départ est composé à partir des réservations).

Usage : python3 gtfs_flex.py corridors/*.json -o flux/alaplace-gtfs.zip
Plusieurs chauffeurs = plusieurs fichiers = un seul flux : les identifiants sont préfixés par l'identifiant du trajet.
"""
import argparse, csv, io, json, zipfile
from datetime import date
from pathlib import Path

ICI = Path(__file__).parent
JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
JOURS_GTFS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]


def valider_schema(trajet):
    import jsonschema
    schema = json.loads((ICI / "trajet.schema.json").read_text(encoding="utf-8"))
    jsonschema.validate(trajet, schema)
    ids = {z["id"] for z in trajet["zones"]}
    for t in trajet["trajets"]:
        if t["de"] not in ids or t["vers"] not in ids:
            raise ValueError(f"{trajet['id']}/{t['id']} : zone inconnue")
        if t["de"] == t["vers"]:
            raise ValueError(f"{trajet['id']}/{t['id']} : départ et arrivée dans la même zone")
    if trajet["seuil"] > trajet["capacite"]:
        raise ValueError(f"{trajet['id']} : seuil supérieur à la capacité")


def hms(hhmm):
    return hhmm + ":00"


def polygone(boite):
    o, s, e, n = boite
    return {"type": "Polygon", "coordinates": [[[o, s], [e, s], [e, n], [o, n], [o, s]]]}


def construire(trajets):
    """Renvoie {nom_de_fichier: contenu} pour le flux GTFS-Flex."""
    t_agency, t_routes, t_trips, t_stop_times, t_calendar, t_booking, t_fare_attr, t_fare_rules = [], [], [], [], [], [], [], []
    features, vus_agences, vus_zones = [], set(), set()
    debut_flux, fin_flux = None, None
    for c in trajets:
        valider_schema(c)
        op = c["operateur"]
        if op["id"] not in vus_agences:
            vus_agences.add(op["id"])
            t_agency.append({"agency_id": op["id"], "agency_name": op["nom"], "agency_url": op.get("site", "https://example.org"),
                             "agency_timezone": "Europe/Paris", "agency_lang": "fr"})
        cid = c["id"]
        for z in c["zones"]:
            zid = f"{cid}:{z['id']}"
            if zid in vus_zones:
                raise ValueError(f"zone en double : {zid}")
            vus_zones.add(zid)
            features.append({"type": "Feature", "id": zid, "properties": {"stop_name": z["nom"]}, "geometry": polygone(z["boite"])})
        p = c["periode"]
        sid = f"{cid}:service"
        cal = {"service_id": sid, **{g: int(j in p["jours"]) for j, g in zip(JOURS, JOURS_GTFS)},
               "start_date": p["debut"].replace("-", ""), "end_date": p["fin"].replace("-", "")}
        t_calendar.append(cal)
        debut_flux = min(filter(None, [debut_flux, cal["start_date"]]))
        fin_flux = max(filter(None, [fin_flux, cal["end_date"]]))
        r = c["reservation"]
        bid = f"{cid}:reservation"
        message = (f"Place à {c['prix_place_eur']} € par personne. Pas d'horaire fixe : le départ est composé à partir des réservations "
                   f"et confirmé dès {c['seuil']} places payées sur {c['capacite']} ; sinon l'acompte est rendu.")
        b = {"booking_rule_id": bid, "booking_url": r["url"], "info_url": r["url"], "message": message,
             "prior_notice_start_day": r["ouverture_jours_avant"], "prior_notice_start_time": "00:00:00"}
        if "preavis_minutes" in r:
            b.update({"booking_type": 1, "prior_notice_duration_min": r["preavis_minutes"]})
            b.pop("prior_notice_start_day"); b.pop("prior_notice_start_time")   # interdits pour le type 1 sans durée maximale
        else:
            b.update({"booking_type": 2, "prior_notice_last_day": r["jours_avant_min"], "prior_notice_last_time": hms(r["heure_limite"])})
        t_booking.append(b)
        fid = f"{cid}:place"
        t_fare_attr.append({"fare_id": fid, "price": f"{c['prix_place_eur']:.2f}", "currency_type": "EUR", "payment_method": 1, "transfers": 0, "agency_id": op["id"]})
        noms = {z["id"]: z["nom"] for z in c["zones"]}
        for t in c["trajets"]:
            rid = f"{cid}:{t['id']}"
            t_routes.append({"route_id": rid, "agency_id": op["id"], "route_short_name": "",
                             "route_long_name": f"{noms[t['de']]} > {noms[t['vers']]} (à la place, sur réservation)", "route_type": 3})
            t_fare_rules.append({"fare_id": fid, "route_id": rid})
            tid = f"{rid}:fenetre"
            t_trips.append({"route_id": rid, "service_id": sid, "trip_id": tid, "trip_headsign": noms[t["vers"]]})
            t_stop_times.append({"trip_id": tid, "stop_sequence": 1, "location_id": f"{cid}:{t['de']}",
                                 "start_pickup_drop_off_window": hms(t["prise_en_charge"][0]), "end_pickup_drop_off_window": hms(t["prise_en_charge"][1]),
                                 "pickup_type": 2, "drop_off_type": 1, "pickup_booking_rule_id": bid, "drop_off_booking_rule_id": ""})
            t_stop_times.append({"trip_id": tid, "stop_sequence": 2, "location_id": f"{cid}:{t['vers']}",
                                 "start_pickup_drop_off_window": hms(t["depose"][0]), "end_pickup_drop_off_window": hms(t["depose"][1]),
                                 "pickup_type": 1, "drop_off_type": 2, "pickup_booking_rule_id": "", "drop_off_booking_rule_id": bid})
    feed_info = [{"feed_publisher_name": "À la place (démonstration)", "feed_publisher_url": "https://example.org/alaplace", "feed_lang": "fr",
                  "feed_start_date": debut_flux, "feed_end_date": fin_flux, "feed_version": date.today().isoformat()}]
    fichiers = {
        "agency.txt": t_agency, "routes.txt": t_routes, "trips.txt": t_trips, "stop_times.txt": t_stop_times,
        "calendar.txt": t_calendar, "booking_rules.txt": t_booking, "fare_attributes.txt": t_fare_attr,
        "fare_rules.txt": t_fare_rules, "feed_info.txt": feed_info,
    }
    sortie = {nom: ecrire_csv(lignes) for nom, lignes in fichiers.items()}
    sortie["locations.geojson"] = json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, indent=1)
    return sortie


def ecrire_csv(lignes):
    entetes = []
    for l in lignes:
        for k in l:
            if k not in entetes:
                entetes.append(k)
    f = io.StringIO()
    w = csv.DictWriter(f, fieldnames=entetes, lineterminator="\n")
    w.writeheader()
    for l in lignes:
        w.writerow({k: l.get(k, "") for k in entetes})
    return f.getvalue()


def ecrire_zip(fichiers, chemin):
    chemin = Path(chemin)
    chemin.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(chemin, "w", zipfile.ZIP_DEFLATED) as z:
        for nom in sorted(fichiers):
            z.writestr(nom, fichiers[nom])
    return chemin


if __name__ == "__main__":
    a = argparse.ArgumentParser(description=__doc__)
    a.add_argument("trajets", nargs="+")
    a.add_argument("-o", "--sortie", default=str(ICI / "flux" / "alaplace-gtfs.zip"))
    args = a.parse_args()
    trajets = [json.loads(Path(p).read_text(encoding="utf-8")) for p in args.trajets]
    print(ecrire_zip(construire(trajets), args.sortie))
