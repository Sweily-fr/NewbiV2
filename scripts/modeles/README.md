# Modèles téléchargeables (Word, Excel, PDF)

Les cinq articles « modèle » du blog promettaient un fichier à télécharger
alors qu'ils ne proposaient qu'un tableau à recopier. Ces scripts génèrent les
fichiers réellement servis depuis `public/modeles/`.

## Régénérer

### PDF : le vrai gabarit Newbi

Les PDF ne sont PAS dessinés à la main : ils sont rendus par le gabarit du
produit (`UniversalPreviewPDF`), pour que le modèle téléchargé soit exactement
la facture que Newbi génère. Le script pilote Chrome sur la page
`/pdf-generator/<type>/preview`, qui lit ses données dans
`window.__PREVIEW_DATA`, puis récupère le PDF vectoriel, comme le fait la route
`POST /api/invoices/preview-pdf`.

Prérequis : le serveur de développement doit tourner sur le port 3000, et
`CHROME_PATH` doit pointer vers un binaire Chrome (voir `.env.local`).

```bash
npm run dev   # dans un autre terminal

cp scripts/modeles/render-pdf-newbi.cjs ./.render.cjs
CHROME_PATH="$(grep '^CHROME_PATH=' .env.local | cut -d= -f2- | tr -d '"')" \
  node ./.render.cjs public/modeles scripts/modeles/rendus.json
rm ./.render.cjs
```

`rendus.json` contient les données d'exemple de chaque modèle : société,
client, lignes, conditions. Le gabarit en déduit le titre (Facture, Devis,
Facture d'acompte), la mention de franchise de TVA et le pied de page légal.

### Word et Excel

Ces deux formats sont des documents modifiables, générés hors ligne :

```bash
# Word (.docx) : nécessite uniquement Python 3
python3 scripts/modeles/generate-docx.py

# Excel (.xlsx) : depuis la racine du projet, pour que xlsx soit résolu
# depuis node_modules
cp scripts/modeles/generate-xlsx-pdf.cjs ./.gen.cjs && node ./.gen.cjs . scripts/modeles/modeles.json && rm ./.gen.cjs
```

Attention : `generate-xlsx-pdf.cjs` écrit aussi des PDF, dessinés avec jsPDF.
Ils sont écrasés par le rendu au gabarit ci-dessus, qui fait foi. Lancer les
deux commandes dans cet ordre : Excel d'abord, PDF au gabarit ensuite.

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
