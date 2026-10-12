"""Brique IA de la preuve : un modèle local lit le message libre d'un voyageur et en tire la réservation.

Principe (fixé par Alex) : l'IA comprend, le code garantit.
- v1 : le modèle remplit directement les valeurs du moteur (montee/descente, aix/mrs, vars/risoul).
- v2 : le modèle répond à des questions naturelles (arrive ou repart ? train ou avion ? quel lieu ?) et c'est le code
       qui traduit en valeurs du moteur, avec une liste fermée : tout ce qui n'est pas reconnu devient null.
- Un champ null n'est pas une erreur de la plateforme : elle repose la question au voyageur au lieu d'inventer.

Usage :
  python3 extraction.py demandes <ov|ollama> <lot> <v1|v2> <jeu.json>  -> script bash qui dépose les demandes dans le pont
  python3 extraction.py juger <dossier_reponses> <lot> <v1|v2> <jeu.json> -> resultats_<lot>.json + résumé
"""
import base64, json, re, statistics, sys, unicodedata
from pathlib import Path

ICI = Path(__file__).parent
CHAMPS = ["sens", "origine", "station", "heure", "places"]
PERMIS = {"sens": {"montee", "descente"}, "origine": {"aix", "mrs"}, "station": {"vars", "risoul"}}

CONSIGNES = {
"v1": """Tu extrais une demande de transfert à partir du message d'un voyageur.
Réponds uniquement par un objet JSON, sans texte autour, avec exactement ces clés :
- "sens" : "montee" si le voyageur arrive (gare ou aéroport vers la station), "descente" s'il repart (station vers la gare ou l'aéroport) ;
- "origine" : "aix" pour la gare d'Aix-en-Provence TGV, "mrs" pour l'aéroport Marseille Provence (Marignane, MRS), null pour toute autre gare ou si ce n'est pas dit ;
- "station" : "vars" (Vars, Vars les Claux, Vars Sainte-Marie) ou "risoul" (Risoul, Risoul 1850), null pour toute autre station ;
- "heure" : l'heure du train ou du vol au format HH:MM sur 24 heures, null si elle n'est pas donnée ;
- "places" : le nombre de personnes (entier), null s'il n'est pas dit.
N'invente rien : une information absente du message vaut null.

Message du voyageur :
""",
"v2": """Lis le message d'un voyageur qui part au ski et réponds uniquement par un objet JSON, sans texte autour, avec ces clés :
- "voyageur" : "arrive" s'il arrive en vacances (il descend du train ou de l'avion), "repart" s'il rentre chez lui (il doit prendre un train ou un avion) ;
- "mode" : "train" ou "avion", null si ce n'est pas dit ;
- "lieu" : la gare ou l'aéroport, recopié tel qu'il est écrit dans le message, null s'il n'est pas dit ;
- "station" : la station de ski ou le lieu de la location, recopié tel qu'il est écrit, null s'il n'est pas dit ;
- "heure" : l'heure du train ou de l'avion au format HH:MM sur 24 heures, null si elle n'est pas donnée ;
- "personnes" : le nombre total de personnes (entier), null s'il n'est pas clair.
N'invente rien : une information absente du message vaut null.

Message :
""",
}


def sans_accents(t):
    return "".join(c for c in unicodedata.normalize("NFD", str(t)) if unicodedata.category(c) != "Mn").lower()


def v2_vers_moteur(o):
    """Le code traduit la lecture du modèle en valeurs du moteur. Liste fermée : rien d'autre ne passe."""
    if not isinstance(o, dict):
        return None
    v = sans_accents(o.get("voyageur") or "")
    sens = "montee" if v.startswith("arriv") else "descente" if v.startswith("repart") or v.startswith("rentr") else None
    lieu, mode = sans_accents(o.get("lieu") or ""), sans_accents(o.get("mode") or "")
    if "aix" in lieu:
        origine = "aix"
    elif "marignane" in lieu or re.search(r"\bmrs\b", lieu) or ("marseille" in lieu and ("aeroport" in lieu or "provence" in lieu or mode == "avion")):
        origine = "mrs"   # « gare Saint-Charles » ou « Marseille » en train ne sont pas desservis : null
    else:
        origine = None
    st = sans_accents(o.get("station") or "")
    station = "vars" if "vars" in st else "risoul" if "risoul" in st else None
    return {"sens": sens, "origine": origine, "station": station, "heure": o.get("heure"), "places": o.get("personnes")}


def demande(m, moteur, lot, version):
    return {"id": f"{lot}-{m['id']}", "moteur": moteur, "max_tokens": 160,
            "messages": [{"role": "user", "content": CONSIGNES[version] + m["texte"]}]}


def script_depot(moteur, lot, version, jeu):
    lignes = ["set -e", "D=${PONT_DEMANDES:?dossier des demandes du pont local}"]
    for m in jeu:
        q = demande(m, moteur, lot, version)
        b64 = base64.b64encode(json.dumps(q, ensure_ascii=False).encode("utf-8")).decode()
        lignes.append(f"echo {b64} | base64 -d > $D/{q['id']}.tmp && mv $D/{q['id']}.tmp $D/{q['id']}.json")
    lignes.append(f"ls $D | grep -c '^{lot}-' || true")
    return "\n".join(lignes)


def extraire_json(texte):
    t = re.sub(r"<think>.*?</think>", "", texte or "", flags=re.S).strip()
    t = re.sub(r"^```(?:json)?|```$", "", t.strip(), flags=re.M).strip()
    debut, fin = t.find("{"), t.rfind("}")
    if debut < 0 or fin < 0:
        return None
    try:
        return json.loads(t[debut:fin + 1])
    except json.JSONDecodeError:
        return None


def normaliser(champ, v):
    if v is None or (isinstance(v, str) and v.strip().lower() in ("", "null", "none")):
        return None
    if champ == "places":
        try:
            return int(v)
        except (TypeError, ValueError):
            return "invalide"
    if champ == "heure":
        mt = re.fullmatch(r"\s*(\d{1,2})\s*[:h]\s*(\d{2})\s*", str(v))
        return f"{int(mt.group(1)):02d}:{mt.group(2)}" if mt else "invalide"
    v = str(v).strip().lower()
    if champ in PERMIS and v not in PERMIS[champ]:
        return "hors_liste"
    return v


def juger(dossier, lot, version, jeu):
    dossier = Path(dossier)
    lignes, latences = [], []
    for m in jeu:
        f = dossier / f"{lot}-{m['id']}.json"
        if not f.exists():
            lignes.append({"id": m["id"], "statut": "sans_reponse"})
            continue
        r = json.loads(f.read_text(encoding="utf-8"))
        latences.append(r.get("secondes"))
        brut = extraire_json(r.get("texte", "")) if r.get("ok") else None
        obj = v2_vers_moteur(brut) if version == "v2" else brut
        detail = {}
        for c in CHAMPS:
            obtenu = normaliser(c, obj.get(c)) if isinstance(obj, dict) else "json_invalide"
            attendu = m["attendu"][c]
            detail[c] = {"attendu": attendu, "obtenu": obtenu, "juste": obtenu == attendu,
                         "invention": attendu is None and obtenu is not None}
        # Sécurité : une valeur hors liste ou invalide n'entre jamais dans le moteur, elle déclenche une question au voyageur.
        a_redemander = [c for c, d in detail.items() if d["obtenu"] in (None, "hors_liste", "invalide", "json_invalide")]
        faux_acceptes = [c for c, d in detail.items() if not d["juste"] and c not in a_redemander]
        lignes.append({"id": m["id"], "statut": "ok" if obj is not None else "json_invalide",
                       "moteur": r.get("moteur"), "secondes": r.get("secondes"), "lecture_modele": brut, "champs": detail,
                       "message_entier_juste": all(d["juste"] for d in detail.values()),
                       "a_redemander": a_redemander, "faux_acceptes": faux_acceptes})
    champs = [d for l in lignes if "champs" in l for d in l["champs"].values()]
    n = len(jeu) * len(CHAMPS)
    justes = sum(d["juste"] for d in champs)
    lat = [x for x in latences if isinstance(x, (int, float))]
    resume = {
        "lot": lot, "consigne": version, "messages": len(jeu), "champs_total": n,
        "champs_justes": justes, "precision_champs": round(justes / n, 3),
        "messages_entierement_justes": sum(1 for l in lignes if l.get("message_entier_juste")),
        "inventions": sum(d["invention"] for d in champs),
        "faux_acceptes_par_le_code": sum(len(l.get("faux_acceptes", [])) for l in lignes),
        "messages_a_redemander": sum(1 for l in lignes if l.get("a_redemander")),
        "json_invalides": sum(1 for l in lignes if l["statut"] == "json_invalide"),
        "sans_reponse": sum(1 for l in lignes if l["statut"] == "sans_reponse"),
        "latence_mediane_s": statistics.median(lat) if lat else None,
        "latence_max_s": max(lat) if lat else None,
        "critere": "précision >= 0,85 et chaque réponse < 20 s (hypothese.json)",
    }
    resume["critere_atteint"] = bool(lat) and resume["precision_champs"] >= 0.85 and max(lat) < 20 and resume["sans_reponse"] == 0
    par_champ = {c: sum(1 for l in lignes if "champs" in l and l["champs"][c]["juste"]) for c in CHAMPS}
    sortie = {"resume": resume, "justes_par_champ": par_champ, "detail": lignes}
    (ICI / f"resultats_{lot}.json").write_text(json.dumps(sortie, ensure_ascii=False, indent=1), encoding="utf-8")
    return sortie


def charger_jeu(chemin):
    return json.loads((ICI / chemin).read_text(encoding="utf-8"))["messages"]


if __name__ == "__main__":
    action, *args = sys.argv[1:]
    if action == "demandes":
        moteur, lot, version, jeu = args
        print(script_depot(moteur, lot, version, charger_jeu(jeu)))
    elif action == "juger":
        dossier, lot, version, jeu = args
        s = juger(dossier, lot, version, charger_jeu(jeu))
        print(json.dumps(s["resume"], ensure_ascii=False, indent=1))
        print(json.dumps(s["justes_par_champ"], ensure_ascii=False))
        for l in s["detail"]:
            if not l.get("message_entier_juste"):
                faux = {c: d["obtenu"] for c, d in l.get("champs", {}).items() if not d["juste"]}
                print(l["id"], l["statut"], faux, "| lu :", json.dumps(l.get("lecture_modele"), ensure_ascii=False))
