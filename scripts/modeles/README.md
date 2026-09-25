# Modèles téléchargeables (Word, Excel, PDF)

Les cinq articles « modèle » du blog et la page `/modeles` promettent un
fichier à télécharger. Ces scripts génèrent les quinze fichiers réellement
servis depuis `public/modeles/`.

Les trois formats montrent **le même document, au gabarit Newbi** : titre à
droite, méta sous le titre, blocs émetteur et client côte à côte, tableau à
en-tête noir, totaux à droite avec le TTC sur fond gris, conditions, puis
bande de pied de page. `rendus.json` en est la source unique et
`modele-document.cjs` en dérive la structure commune aux trois générateurs.

## Régénérer

### PDF : le vrai gabarit du produit

Les PDF ne sont pas dessinés à la main : ils sont rendus par le gabarit du
produit (`UniversalPreviewPDF`), pour que le modèle téléchargé soit exactement
la facture que Newbi génère. Le script pilote Chrome sur la page
`/pdf-generator/<type>/preview`, qui lit ses données dans
`window.__PREVIEW_DATA`, puis récupère le PDF vectoriel, comme le fait la
route `POST /api/invoices/preview-pdf`.

Prérequis : le serveur de développement doit tourner sur le port 3000, et
`CHROME_PATH` doit pointer vers un binaire Chrome (voir `.env.local`).

```bash
npm run dev   # dans un autre terminal

cp scripts/modeles/render-pdf-newbi.cjs ./.render.cjs
CHROME_PATH="$(grep '^CHROME_PATH=' .env.local | cut -d= -f2- | tr -d '"')" \
  node ./.render.cjs public/modeles scripts/modeles/rendus.json
rm ./.render.cjs
```

### Word et Excel

Hors ligne, sans serveur :

```bash
node scripts/modeles/generate-docx-newbi.cjs . scripts/modeles/rendus.json
node scripts/modeles/generate-xlsx-newbi.cjs . scripts/modeles/rendus.json
node scripts/modeles/verifier-docx.cjs public/modeles
```

## Pourquoi tout est écrit à la main

**Word.** `textutil`, le convertisseur natif de macOS, produit un `.docx`
valide mais perd les tableaux, or un modèle de facture en est un.
`squelette.docx` est un document minimal généré par `textutil` : on en
réutilise l'archive (types de contenu, relations, thème, propriétés) et on
écrit `word/document.xml` et `word/footer1.xml`. Le pied de page est un vrai
pied de page Word, référencé dans `sectPr`, pour qu'il reste en bas de page
comme sur le PDF.

Attention, le schéma OOXML impose l'ORDRE des enfants de `rPr`, `pPr`, `tcPr`,
`tblPr`, `tcBorders` et `sectPr`. Word n'est pas tolérant : un élément hors
séquence déclenche « Word a détecté un problème de contenu » et le document
s'ouvre vide. Aucun validateur n'étant installé sur les machines de l'équipe,
`verifier-docx.cjs` contrôle ces séquences ; le lancer après toute
modification du générateur.

**Excel.** Le paquet `xlsx` installé est l'édition communautaire de SheetJS :
elle lit les styles mais ne les écrit pas, c'est réservé à l'édition Pro. Or
l'en-tête noir et la bande grise du total TTC font toute la différence entre
un tableur quelconque et un document Newbi. Le classeur est donc écrit
directement en OOXML, ce qui donne au passage la main sur les formules : la
colonne « Total HT » multiplie quantité et prix unitaire, le total HT somme la
colonne, la TVA et le TTC suivent. Trois lignes vierges sont prêtes à être
remplies.

Les montants et les taux des exemples suivent les règles françaises en vigueur
en 2026 : indemnité forfaitaire de recouvrement de 40 euros, pénalités d'au
moins trois fois le taux d'intérêt légal, mention de l'article 293 B du CGI
pour la franchise en base.
