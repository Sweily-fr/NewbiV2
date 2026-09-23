#!/usr/bin/env python3
"""Génère les cinq modèles Word à partir de modeles.json."""
import json, os, sys, importlib.util, zipfile, xml.dom.minidom

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("gendocx", os.path.join(HERE, "docx-lib.py"))
g = importlib.util.module_from_spec(spec)
spec.loader.exec_module(g)

ROOT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..")
SPEC = json.load(open(os.path.join(HERE, "modeles.json"), encoding="utf-8"))
SKEL = os.path.join(HERE, "squelette.docx")
OUT = os.path.join(ROOT, "public", "modeles")

# Largeurs de colonnes en twips : la page A4 utile fait ~9750 twips.
WIDTHS = {
    5: [4150, 1300, 1700, 1000, 1600],
    4: [4750, 1500, 1750, 1750],
}
ALIGNS = {
    5: [None, "right", "right", "right", "right"],
    4: [None, "right", "right", "right"],
}

for m in SPEC["modeles"]:
    b = [g.heading(m["titre"], size=40)]
    b.append(g.para(m["intro"], size=17, after=240))

    # Émetteur puis client, en deux blocs (Word gère mal les colonnes
    # côte à côte sans tableau : on utilise un tableau sans bordure visible
    # via deux cellules larges).
    b.append(g.para("ÉMETTEUR", bold=True, size=15, after=60))
    for l in SPEC["commun"]["emetteur"]:
        b.append(g.para(l, size=18, after=20))
    b.append(g.para(after=100))
    b.append(g.para("CLIENT", bold=True, size=15, after=60))
    for l in SPEC["commun"]["client"]:
        b.append(g.para(l, size=18, after=20))
    b.append(g.para(after=160))

    for k, v in m["meta"]:
        b.append(g.para(f"{k} : {v}", size=18, after=40))
    b.append(g.para(after=160))

    n = len(m["colonnes"])
    b.append(
        g.table([m["colonnes"]] + m["lignes"], WIDTHS[n], aligns=ALIGNS[n])
    )

    for i, (k, v) in enumerate(m["totaux"]):
        last = i == len(m["totaux"]) - 1
        b.append(
            g.para(f"{k} : {v} €", bold=last, size=22 if last else 18, after=60, align="right")
        )
    b.append(g.para(after=200))

    b.append(g.para("MENTIONS OBLIGATOIRES", bold=True, size=15, after=80))
    for l in m["mentions"]:
        b.append(g.para(l, size=17, after=80))

    b.append(g.para(after=200))
    b.append(
        g.para(
            "Modèle fourni par Newbi - www.newbi.fr - à compléter avec vos informations.",
            size=15,
            color="6E6E6E",
        )
    )

    path = os.path.join(OUT, f"{m['slug']}.docx")
    g.build(SKEL, path, b)

    # Contrôle : archive lisible, XML bien formé, tableau présent.
    z = zipfile.ZipFile(path)
    assert z.testzip() is None, path
    d = z.read("word/document.xml").decode("utf-8")
    xml.dom.minidom.parseString(d)
    assert "<w:tbl>" in d, path
    print(
        f"{m['slug']}.docx : {os.path.getsize(path)} o | "
        f"{d.count('<w:tr>')} lignes de tableau | XML valide"
    )
