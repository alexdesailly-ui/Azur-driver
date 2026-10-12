"""Tests du format ouvert « À la place » : python3 -m unittest discover -s tests (depuis alaplace/)."""
import copy, io, json, sys, unittest, zipfile
from pathlib import Path

ICI = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ICI))
import gtfs_flex, flex_check  # noqa: E402

CORRIDORS = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((ICI / "corridors").glob("*.json"))]


def flux(trajets, tmp):
    return gtfs_flex.ecrire_zip(gtfs_flex.construire(trajets), tmp)


def modifier_zip(src, dst, nom, transformer):
    with zipfile.ZipFile(src) as zi, zipfile.ZipFile(dst, "w") as zo:
        for n in zi.namelist():
            data = zi.read(n).decode("utf-8")
            zo.writestr(n, transformer(data) if n == nom else data)
    return dst


class TestFlux(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(__file__).parent / "_tmp"
        self.tmp.mkdir(exist_ok=True)

    def test_deux_chauffeurs_un_flux_sans_erreur(self):
        z = flux(CORRIDORS, self.tmp / "ok.zip")
        erreurs, avert = flex_check.verifier(z)
        self.assertEqual(erreurs, [])
        agences = zipfile.ZipFile(z).read("agency.txt").decode().count("\n") - 1
        self.assertEqual(agences, 2)

    def test_aucun_horaire_fixe_dans_le_flux(self):
        z = zipfile.ZipFile(flux(CORRIDORS, self.tmp / "ok2.zip"))
        entete = z.read("stop_times.txt").decode().splitlines()[0]
        self.assertNotIn("arrival_time", entete)
        self.assertNotIn("departure_time", entete)

    def test_un_horaire_fixe_est_refuse_par_le_controle(self):
        src = flux(CORRIDORS, self.tmp / "src.zip")
        def ajouter_heure(t):
            lignes = t.splitlines()
            lignes[0] += ",arrival_time"
            lignes[1] += ",10:00:00"
            return "\n".join(lignes) + "\n"
        bad = modifier_zip(src, self.tmp / "heure.zip", "stop_times.txt", ajouter_heure)
        erreurs, _ = flex_check.verifier(bad)
        self.assertTrue(any("horaire fixe interdit" in e for e in erreurs))
        self.assertTrue(any("interdits avec une fenêtre" in e for e in erreurs))

    def test_le_schema_refuse_un_champ_horaire(self):
        c = copy.deepcopy(CORRIDORS[0])
        c["trajets"][0]["heure_depart"] = "14:00"
        with self.assertRaises(Exception):
            gtfs_flex.construire([c])

    def test_collision_entre_chauffeurs_refusee(self):
        with self.assertRaises(ValueError):
            gtfs_flex.construire([CORRIDORS[0], CORRIDORS[0]])

    def test_regle_de_reservation_incoherente_detectee(self):
        src = flux(CORRIDORS, self.tmp / "src2.zip")
        bad = modifier_zip(src, self.tmp / "resa.zip", "booking_rules.txt", lambda t: t.replace(",2,1,18:00:00,", ",1,1,18:00:00,"))
        erreurs, _ = flex_check.verifier(bad)
        self.assertTrue(any("prior_notice" in e for e in erreurs))

    def test_seuil_superieur_a_la_capacite_refuse(self):
        c = copy.deepcopy(CORRIDORS[1])
        c["seuil"] = 9
        with self.assertRaises(Exception):
            gtfs_flex.construire([c])

    def tearDown(self):
        for f in self.tmp.glob("*.zip"):
            f.unlink()


if __name__ == "__main__":
    unittest.main()
