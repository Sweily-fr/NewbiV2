# Modèles téléchargeables (Word, Excel, PDF)

Les articles « modèle » du blog et la page `/modeles` promettent un fichier à
télécharger. Ces scripts génèrent les vingt-huit fichiers réellement servis
depuis `public/modeles/`, pour quatorze modèles :

| Modèle                                                                         | Fichiers         | Source         |
| ------------------------------------------------------------------------------ | ---------------- | -------------- |
| Facture, devis, facture auto-entrepreneur, facture d'acompte, facture sans TVA | Word, Excel, PDF | `rendus.json`  |
| Bon de commande                                                                | Word, Excel      | `rendus.json`  |
| Avoir (`modele-avoir`)                                                         | Word, Excel      | `rendus.json`  |
| Facture en anglais (`modele-facture-anglais`)                                  | Word, Excel      | `rendus.json`  |
| Reçu de paiement (`modele-recu-paiement`)                                      | Word, Excel      | `rendus.json`  |
| Contrat de prestation de services                                              | Word             | `textes.json`  |
| Lettre de mise en demeure pour facture impayée                                 | Word             | `textes.json`  |
| Note de frais (`modele-note-de-frais`)                                         | Excel            | `tableurs.cjs` |
| Plan de trésorerie (`modele-plan-de-tresorerie`)                               | Excel            | `tableurs.cjs` |
| Tableau de suivi des factures (`modele-tableau-suivi-factures`)                | Excel            | `tableurs.cjs` |

Pas de PDF pour le bon de commande, l'avoir, la facture en anglais ni le reçu.
Les PDF sont rendus par le gabarit du produit via `/pdf-generator/<type>/preview`,
et cette route n'existe que pour `invoice` et `quote`. Un avoir ne peut pas y
passer déguisé en facture : la page force le type `invoice`, le document
sortirait titré « Facture », sans référence à la facture d'origine et avec
des montants positifs. La facture en anglais a des libellés français dans le
gabarit, et le reçu n'a pas de gabarit. Créer ces routes toucherait le
pipeline PDF partagé avec la WebView mobile et l'endpoint
`POST /api/invoices/preview-pdf`.

Les documents chiffrés de `rendus.json` montrent, dans les trois formats,
**le même document, au gabarit Newbi** : titre à droite, méta sous le titre,
blocs émetteur et client côte à côte, tableau à en-tête noir, totaux à droite
avec le TTC sur fond gris, conditions, puis bande de pied de page.
`rendus.json` en est la source unique et `modele-document.cjs` en dérive la
structure commune aux générateurs (types `invoice`, `quote`, `purchaseOrder`,
`creditNote`, `invoiceEn`, `receipt`).

`textes.json` décrit les documents rédigés (contrat, lettre) par blocs :
titres, paragraphes avec **gras**, listes, tableau, signatures et encadré de
notes à supprimer. `tableurs.cjs` construit les classeurs cellule par cellule ;
`formules.cjs` calcule leurs formules pour écrire la valeur en cache (voir
plus bas).

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

Pour ne régénérer que certains modèles, ajoutez leurs noms de fichier sans
extension après `rendus.json`, par exemple
`node scripts/modeles/generate-xlsx-newbi.cjs . scripts/modeles/rendus.json modele-note-de-frais`.
Sans nom, tout est régénéré (le Word lit aussi `textes.json`, l'Excel aussi
`tableurs.cjs`).

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

**Formules des tableurs.** Excel et Numbers recalculent à l'ouverture, mais
LibreOffice affiche par défaut les valeurs en cache d'un fichier Excel, et les
aperçus (Finder, Google Drive, messageries) n'affichent qu'elles : sans cache,
un total paraît vide. `formules.cjs` évalue donc chaque formule avec la
sémantique d'Excel (sous-ensemble utilisé : SUM, SUMIF, SUMIFS, SUMPRODUCT,
COUNTIF, IF, IFERROR, AND, OR, VLOOKUP, INDEX, MATCH, ROUND, DATEDIF, TODAY...)
et la génération échoue si une formule renverrait #VALUE!, #REF! ou #N/A. Les
écarts de jours passent par DATEDIF et non par une soustraction de dates :
Numbers transforme cette soustraction en durée, que MAX ne compare pas à zéro.
TODAY() est mis en cache à la date de génération. Pour contrôler les résultats
avec un moteur indépendant, ouvrez le classeur dans Numbers et exportez-le en
CSV : les valeurs doivent être identiques au cache.

Les mentions suivent les règles françaises en vigueur au second semestre
2026 : taux d'intérêt légal des créances entre professionnels de 2,75 %, donc
pénalités d'au moins 8,25 %, mention « EI » de l'entrepreneur individuel, TVA
non déductible sur l'hébergement et le transport de personnes dans la note de
frais (art. 206, IV de l'annexe II au CGI), barème kilométrique tel que l'article
le présente, à vérifier chaque année.
