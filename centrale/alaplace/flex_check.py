"""Contrôle écrit d'un flux GTFS-Flex, d'après la référence GTFS (google/transit, gtfs/spec/en/reference.md :
stop_times.txt, locations.geojson, booking_rules.txt), plus la règle juridique du réseau « À la place » : aucun horaire fixe.

Ce n'est PAS le validateur officiel MobilityData (téléchargement bloqué par le réseau le 12/10/2026) : c'est un juge écrit
qui couvre les règles conditionnelles des fichiers Flex. Usage : python3 flex_check.py flux/alaplace-gtfs.zip
"""
import csv, io, json, re, sys, zipfile
from datetime import datetime

HEURE = re.compile(r"^(\d{1,2}):([0-5]\d):([0-5]\d)$")


def secondes(t):
    m = HEURE.match(t or "")
    return None if not m else int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))


def lire(z, nom):
    if nom not in z.namelist():
        return None
    return list(csv.DictReader(io.StringIO(z.read(nom).decode("utf-8-sig"))))


def verifier(chemin):
    erreurs, avert = [], []
    z = zipfile.ZipFile(chemin)
    noms = set(z.namelist())
    for f in ["agency.txt", "routes.txt", "trips.txt", "stop_times.txt"]:
        if f not in noms:
            erreurs.append(f"fichier obligatoire absent : {f}")
    if "calendar.txt" not in noms and "calendar_dates.txt" not in noms:
        erreurs.append("calendar.txt ou calendar_dates.txt obligatoire")
    if "stops.txt" not in noms and "locations.geojson" not in noms:
        erreurs.append("stops.txt obligatoire sauf si des zones sont définies dans locations.geojson")
    if erreurs:
        return erreurs, avert

    # locations.geojson
    ids_lieux = set()
    if "locations.geojson" in noms:
        g = json.loads(z.read("locations.geojson"))
        if g.get("type") != "FeatureCollection" or not isinstance(g.get("features"), list):
            erreurs.append("locations.geojson : doit être une FeatureCollection avec features")
        for i, f in enumerate(g.get("features", [])):
            fid = f.get("id")
            if f.get("type") != "Feature":
                erreurs.append(f"locations.geojson[{i}] : type doit valoir Feature")
            if not fid:
                erreurs.append(f"locations.geojson[{i}] : id obligatoire")
            elif fid in ids_lieux:
                erreurs.append(f"locations.geojson : id en double {fid}")
            ids_lieux.add(fid)
            if not isinstance(f.get("properties"), dict):
                erreurs.append(f"locations.geojson {fid} : properties obligatoire")
            geo = f.get("geometry") or {}
            if geo.get("type") not in ("Polygon", "MultiPolygon"):
                erreurs.append(f"locations.geojson {fid} : géométrie Polygon ou MultiPolygon obligatoire")
                continue
            polys = [geo["coordinates"]] if geo["type"] == "Polygon" else geo["coordinates"]
            for poly in polys:
                for anneau in poly:
                    if len(anneau) < 4 or anneau[0] != anneau[-1]:
                        erreurs.append(f"locations.geojson {fid} : anneau non fermé ou trop court")
                    for lon, lat in anneau:
                        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
                            erreurs.append(f"locations.geojson {fid} : coordonnée hors bornes")
    stops = lire(z, "stops.txt") or []
    ids_arrets = {s["stop_id"] for s in stops}
    if ids_arrets & ids_lieux:
        erreurs.append("un id est partagé entre stops.txt et locations.geojson")

    agences = {a["agency_id"] for a in lire(z, "agency.txt")}
    routes = {r["route_id"]: r for r in lire(z, "routes.txt")}
    for r in routes.values():
        if r.get("agency_id") and r["agency_id"] not in agences:
            erreurs.append(f"routes {r['route_id']} : agency_id inconnu")
    services = set()
    for c in lire(z, "calendar.txt") or []:
        services.add(c["service_id"])
        try:
            d1, d2 = datetime.strptime(c["start_date"], "%Y%m%d"), datetime.strptime(c["end_date"], "%Y%m%d")
            if d2 < d1:
                erreurs.append(f"calendar {c['service_id']} : end_date avant start_date")
        except ValueError:
            erreurs.append(f"calendar {c['service_id']} : date invalide")
        if not any(c.get(j) == "1" for j in ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]):
            avert.append(f"calendar {c['service_id']} : aucun jour actif")
    trips = {t["trip_id"]: t for t in lire(z, "trips.txt")}
    for t in trips.values():
        if t["route_id"] not in routes:
            erreurs.append(f"trips {t['trip_id']} : route_id inconnu")
        if t["service_id"] not in services:
            erreurs.append(f"trips {t['trip_id']} : service_id inconnu")

    # booking_rules.txt
    regles = {}
    for b in lire(z, "booking_rules.txt") or []:
        bid, typ = b["booking_rule_id"], b.get("booking_type")
        regles[bid] = b
        def present(k):
            return (b.get(k) or "") != ""
        if typ not in ("0", "1", "2"):
            erreurs.append(f"booking_rules {bid} : booking_type invalide")
        if present("prior_notice_duration_min") != (typ == "1"):
            erreurs.append(f"booking_rules {bid} : prior_notice_duration_min requis pour le type 1, interdit sinon")
        if present("prior_notice_duration_max") and typ != "1":
            erreurs.append(f"booking_rules {bid} : prior_notice_duration_max interdit hors type 1")
        if present("prior_notice_last_day") != (typ == "2"):
            erreurs.append(f"booking_rules {bid} : prior_notice_last_day requis pour le type 2, interdit sinon")
        if present("prior_notice_last_time") != present("prior_notice_last_day"):
            erreurs.append(f"booking_rules {bid} : prior_notice_last_time requis si et seulement si prior_notice_last_day")
        if present("prior_notice_start_day") and (typ == "0" or (typ == "1" and present("prior_notice_duration_max"))):
            erreurs.append(f"booking_rules {bid} : prior_notice_start_day interdit ici")
        if present("prior_notice_start_time") != present("prior_notice_start_day"):
            erreurs.append(f"booking_rules {bid} : prior_notice_start_time requis si et seulement si prior_notice_start_day")
        if present("prior_notice_service_id") and typ != "2":
            erreurs.append(f"booking_rules {bid} : prior_notice_service_id interdit hors type 2")
        if not (present("booking_url") or present("phone_number") or present("info_url")):
            avert.append(f"booking_rules {bid} : aucun moyen de réserver indiqué")

    # stop_times.txt
    par_trip = {}
    for st in lire(z, "stop_times.txt"):
        tid = st["trip_id"]
        par_trip.setdefault(tid, []).append(st)
        def present(k):
            return (st.get(k) or "") != ""
        lieu = present("location_id") or present("location_group_id")
        fenetre = present("start_pickup_drop_off_window") or present("end_pickup_drop_off_window")
        ou = f"stop_times {tid}#{st.get('stop_sequence')}"
        if tid not in trips:
            erreurs.append(f"{ou} : trip_id inconnu")
        if present("stop_id") and lieu:
            erreurs.append(f"{ou} : stop_id interdit avec location_id ou location_group_id")
        if not present("stop_id") and not lieu:
            erreurs.append(f"{ou} : stop_id requis sans zone")
        if present("location_id") and st["location_id"] not in ids_lieux:
            erreurs.append(f"{ou} : location_id inconnu")
        if (lieu or fenetre) and not (present("start_pickup_drop_off_window") and present("end_pickup_drop_off_window")):
            erreurs.append(f"{ou} : fenêtres de prise en charge requises")
        if fenetre and (present("arrival_time") or present("departure_time")):
            erreurs.append(f"{ou} : arrival_time et departure_time interdits avec une fenêtre")
        if fenetre:
            a, b = secondes(st.get("start_pickup_drop_off_window")), secondes(st.get("end_pickup_drop_off_window"))
            if a is None or b is None or b <= a:
                erreurs.append(f"{ou} : fenêtre invalide")
            if st.get("pickup_type", "") in ("0", "3", ""):
                erreurs.append(f"{ou} : pickup_type 0 ou 3 (ou vide = 0) interdit avec une fenêtre")
            if st.get("drop_off_type", "") in ("0", ""):
                erreurs.append(f"{ou} : drop_off_type 0 (ou vide = 0) interdit avec une fenêtre")
        for k in ("pickup_booking_rule_id", "drop_off_booking_rule_id"):
            if present(k) and st[k] not in regles:
                erreurs.append(f"{ou} : {k} inconnu")
        if st.get("pickup_type") == "2" and not present("pickup_booking_rule_id"):
            avert.append(f"{ou} : pickup_booking_rule_id recommandé quand pickup_type=2")
        if st.get("drop_off_type") == "2" and not present("drop_off_booking_rule_id"):
            avert.append(f"{ou} : drop_off_booking_rule_id recommandé quand drop_off_type=2")
        # Règle du réseau « À la place » : jamais d'horaire fixe (sinon risque de requalification en service régulier).
        if present("arrival_time") or present("departure_time"):
            erreurs.append(f"{ou} : RÈGLE DU RÉSEAU — horaire fixe interdit, un départ est composé à partir des réservations")
    for tid in trips:
        if len(par_trip.get(tid, [])) < 2:
            erreurs.append(f"trips {tid} : au moins deux stop_times requis")

    # Tarifs
    fares = {f["fare_id"] for f in lire(z, "fare_attributes.txt") or []}
    for fr in lire(z, "fare_rules.txt") or []:
        if fr["fare_id"] not in fares:
            erreurs.append(f"fare_rules : fare_id inconnu {fr['fare_id']}")
        if fr.get("route_id") and fr["route_id"] not in routes:
            erreurs.append(f"fare_rules : route_id inconnu {fr['route_id']}")
    return erreurs, avert


if __name__ == "__main__":
    e, a = verifier(sys.argv[1])
    for x in e:
        print("ERREUR", x)
    for x in a:
        print("avertissement", x)
    print(f"{len(e)} erreur(s), {len(a)} avertissement(s)")
    sys.exit(1 if e else 0)
