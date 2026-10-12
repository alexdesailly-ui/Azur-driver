"""Génère lectures.js (mesures + lectures enregistrées du modèle local) à partir des fichiers de résultats. Usage : python3 generer_lectures.py"""
import json
from pathlib import Path

ICI = Path(__file__).parent
R = ICI / "resultats"


def res(n):
    return json.loads((R / n).read_text(encoding="utf-8"))


jeu = {m["id"]: m for f in ("jeu_messages.json", "jeu_controle.json") for m in json.loads((ICI / f).read_text(encoding="utf-8"))["messages"]}
essais = [("Consigne v1, 20 messages (1er passage)", "v1_jeu20_passage1.json"),
          ("Consigne v1, 20 messages (2e passage)", "v1_jeu20_passage2.json"),
          ("Consigne v1, 12 messages de contrôle", "v1_controle12.json"),
          ("Consigne v2, 20 messages", "v2_jeu20.json"),
          ("Consigne v2, 12 messages de contrôle", "v2_controle12.json")]
mesures = []
for titre, f in essais:
    r = res(f)["resume"]
    mesures.append({"essai": titre, "fichier": "ia/resultats/" + f,
                    "champs": f'{r["champs_justes"]}/{r["champs_total"]}', "precision": r["precision_champs"],
                    "entiers": f'{r["messages_entierement_justes"]}/{r["messages"]}', "inventions": r["inventions"],
                    "fauxAcceptes": r["faux_acceptes_par_le_code"], "latence": [r["latence_mediane_s"], r["latence_max_s"]]})
choix = [("v2_jeu20.json", "m01"), ("v2_jeu20.json", "m15"), ("v2_controle12.json", "c10"), ("v2_jeu20.json", "m17"),
         ("v2_jeu20.json", "m07"), ("v2_jeu20.json", "m10"), ("v2_jeu20.json", "m13")]
exemples = []
for f, mid in choix:
    d = next(l for l in res(f)["detail"] if l["id"] == mid)
    exemples.append({"id": mid, "texte": jeu[mid]["texte"], "lu": d["lecture_modele"], "secondes": d["secondes"],
                     "retenu": {c: v["obtenu"] for c, v in d["champs"].items()}, "attendu": jeu[mid]["attendu"],
                     "aRedemander": d["a_redemander"], "fauxAcceptes": d["faux_acceptes"]})
note = ("Le jeu de 20 messages a servi à corriger la consigne (v1 puis v2) ; les 12 messages de contrôle ont été écrits avant de voir "
        "les résultats de la v2. Un champ « à redemander » n'est pas une erreur : le voyageur reçoit la question. Une erreur acceptée "
        "par le code est le vrai risque : c'est pourquoi le voyageur confirme toujours le récapitulatif avant de payer.")
out = "/* Mesures et lectures enregistrées du modèle local (Qwen3-4B, OpenVINO, ordinateur portable), 12/10/2026. Généré par ia/generer_lectures.py. */\n"
out += "window.LecturesIA = " + json.dumps({"mesures": mesures, "exemples": exemples, "note": note}, ensure_ascii=False, indent=1) + ";\n"
(ICI / "lectures.js").write_text(out, encoding="utf-8")
print("lectures.js :", len(mesures), "mesures,", len(exemples), "exemples")
