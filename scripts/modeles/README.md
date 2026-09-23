# Modèles téléchargeables (Word, Excel, PDF)

Les cinq articles « modèle » du blog promettaient un fichier à télécharger
alors qu'ils ne proposaient qu'un tableau à recopier. Ces scripts génèrent les
fichiers réellement servis depuis `public/modeles/`.

## Régénérer

```bash
# Word (.docx) : nécessite uniquement Python 3
python3 scripts/modeles/generate-docx.py

# Excel (.xlsx) et PDF : depuis la racine du projet, pour que xlsx et jspdf
# soient résolus depuis node_modules
cp scripts/modeles/generate-xlsx-pdf.cjs ./.gen.cjs && node ./.gen.cjs . scripts/modeles/modeles.json && rm ./.gen.cjs
```

## Contenu

`modeles.json` décrit les cinq modèles : blocs émetteur et client communs,
puis par modèle le titre, l'introduction, les métadonnées (numéro, dates), les
colonnes du tableau, des lignes d'exemple, les totaux et les mentions
obligatoires. Modifier ce fichier puis régénérer suffit à mettre les quinze
fichiers à jour.

## Pourquoi un squelette Word

`textutil`, le convertisseur natif de macOS, produit un `.docx` valide mais
perd les tableaux, or un modèle de facture en est un. `squelette.docx` est un
document minimal généré par `textutil` : on en réutilise l'archive (types de
contenu, relations, thème, propriétés) et on remplace `word/document.xml` par
un corps écrit à la main, tableaux compris. Le script valide ensuite l'archive
et le XML produits.

Les montants et les taux des exemples suivent les règles françaises en vigueur
en 2026 : indemnité forfaitaire de recouvrement de 40 €, pénalités d'au moins
trois fois le taux d'intérêt légal, mention de l'article 293 B du CGI pour la
franchise en base.
