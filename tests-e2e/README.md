# Tests de bout en bout de Newbi (`tests-e2e/`)

Le site et l'API tournent ensemble sur des **données de test** : base Mongo en
mémoire (replica set), API lancée sans crons, services externes coupés
(Stripe, Resend, R2, SuperPDP, Bridge, OCR…), appels vers Internet bloqués
dans le navigateur. Rien ne touche la prod.

Ils se lancent depuis l'admin (**admin.newbi.fr/tests/newbi**, workflow
`.github/workflows/tests-e2e.yml`), en local, et d'office sur chaque PR vers
`main` (release ou hotfix) avec l'API de `main` : dernier filet avant la prod.
Ces lancements apparaissent aussi dans l'admin (« Par : PR #n »).

## Ce qui est testé

Un dossier par fonctionnalité ; l'admin range le rapport de la même façon
(fonctionnalité = dossier, partie = premier `describe`, écrit « Devis : création »).

| Dossier           | Création                                                      | Erreurs de saisie                                                | Liste et actions                                                                                              |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `factures/`       | catalogue (remises, TVA, autoliquidation, acompte…)           | sans client, sans article, TVA 0 % sans mention, remise > 100 %… | onglets, recherche, panneau, payée, annulée, brouillon validé ou supprimé                                     |
| `devis/`          | catalogue (référence, validité 30 jours, remises, TVA…)       | communes (`erreurs.mjs`)                                         | onglets, « Expiré », accepter, rejeter, créer un brouillon, supprimer, convertir en facture                   |
| `bons-commande/`  | catalogue (référence du devis, remise en €…)                  | communes (`erreurs.mjs`)                                         | onglets, cycle validé → en cours → livré, annuler, créer un brouillon, supprimer                              |
| `bons-livraison/` | transporteur, adresse du client ou saisie                     | sans article, désignation vide, adresse incomplète               | onglets, recherche transporteur et suivi, émettre, expédier, livrer (réception), annuler, facturer, supprimer |
| `avoirs/`         | total depuis le panneau, partiel (type, remboursement, motif) | montant restant dépassé, facture en brouillon                    | onglet « Avoirs », panneau de la facture                                                                      |

`socle.spec.mjs` vérifie que le compte de test est connecté. Chaque page est
contrôlée d'office (`outils.mjs`) : erreur JavaScript ou console, réponse 500,
« undefined » / « NaN » affichés, appel vers l'extérieur.

## Tester une fonctionnalité de bout en bout

Chaque fonctionnalité a son dossier (ex. `clients/`) et quatre familles de tests,
sur le modèle de `clients/` :

1. **Tous les boutons** (`boutons.spec.mjs`, `verifierBoutons` de `exploration.mjs`) :
   chaque page est décrite élément par élément (`"button Nouveau contact": { fenetre:
"Ajouter un client" }`, `"button Exporter > CSV": { telechargement: /\.csv$/ }`…), un
   test par élément, et un test « Chaque élément de la page est décrit et testé » qui
   échoue si un bouton apparaît sans description (ou disparaît). Une page par rôle :
   propriétaire, Éditeur, Membre (lecture seule). Les éléments sans nom sont repérés
   par leur icône (`icône settings2`). Une action qui modifie les données dès le clic
   renvoie à son parcours (`{ parcours: "…" }`).
2. **Tous les champs** (`verifierFormulaire` de `champs.mjs`) : un formulaire décrit
   une fois (ouvrir, remplir, valider, retrouver en base) et, par champ, les valeurs
   refusées et les valeurs réelles acceptées (accents, « n° », noms étrangers…).
   Un test par cas : refus avec message (ou bouton grisé) et rien en base, ou
   enregistrement exact.
3. **Les parcours** : chaque action vérifiée en base (créer, modifier, supprimer,
   statuts, actions groupées, export dont le contenu du fichier, import de vrais
   fichiers…), avec une donnée de départ par action (`donnees/<fonctionnalité>.mjs`).
4. **La sécurité** (`securite.spec.mjs`, `appelApi` et `verifierRefus` de
   `securite.mjs`) : chaque opération GraphQL de la fonctionnalité appelée
   directement avec la session du navigateur : Membre (tout refusé), Éditeur (ce que
   son rôle permet), intrus d'une autre organisation (refus, et « introuvable » en
   visant les données des autres), visiteur sans session ; la base ne doit pas bouger
   quand c'est refusé. Plus un texte piégé (`<img onerror>`) écrit par un membre et
   ouvert par un autre, et les plafonds de l'offre d'entrée (`offre.spec.mjs`) tenus
   aussi par l'API.

Un défaut trouvé garde **un test dédié, rouge** jusqu'à sa correction ; les tests
voisins ne doivent pas en dépendre (ex. ordre comparé sans les majuscules, la
réécriture des noms ayant son propre test).

**Relevé des pages** (`inventaire.spec.mjs`, entrée « inventaire » du workflow) :
pour une page, chaque élément est essayé et ce qu'il fait est écrit en JSON (fenêtres
ouvertes et leurs champs, menus, navigations, téléchargements, erreurs). C'est le
point de départ pour décrire une page. Relevé ciblé : entrée « filtre » (ex.
`Relevé des contacts`).

**Comptes de test** (`donnees/base.mjs`) : une organisation par usage (« Atelier »
créations, « Liste », « Avoirs », « Clients », « Réglages » configuration,
« Freelance » offre d'entrée, « Intrus » autre entreprise) et des membres invités
« Membre » et « Éditeur » de « Clients ». `connecte(TOKEN)` pour `test.use`.

**Surveillance** (`outils.mjs`) : toute erreur JavaScript, erreur de console,
réponse 500 ou boîte de dialogue fait échouer le test ; `erreursConsoleAutorisees`
et `dialoguesAttendus` (un motif) pour les cas voulus, toujours expliqués.

**Lancer une partie sur GitHub** : workflow « Tests E2E », entrées `fichiers`
(ex. `clients`), `filtre`, `machines`, `inventaire`. Les tests sont répartis sur
plusieurs machines et rassemblés en un rapport (vidéo de chaque test).

## Ajouter un cas

- **Création** : une entrée dans `CAS` du `creation.spec.mjs` de la fonctionnalité
  (client, articles `nom`, `quantite`, `prix`, `tva`, `mention`, `remise`, actions
  avant création, `attendu` en base). Devis et bons de commande partagent le même
  déroulé (`creation.mjs`) et les mêmes erreurs (`erreurs.mjs`).
- **Actions communes des éditeurs** (client, articles, remise, brouillon) :
  `editeur.mjs` ; ce qui est propre à un document : `<dossier>/editeur.mjs`.
- **Listes** (ligne d'un document, menu de ligne, panneau, statut en base) : `liste.mjs`.
- **Données de départ** : `donnees/`, trois comptes : « Atelier » (vide, pour les
  créations), « Liste » (factures, devis, bons de commande et de livraison dans
  chaque état, un document par action qui le modifie) et « Avoirs » (factures à
  créditer, à part pour ne pas changer la liste des factures).

Toujours ouvrir avec `ouvrir()` et cliquer avec `cliquer()` (`navigation.mjs`) : ils
attendent que la page soit hydratée et que les requêtes Next et GraphQL soient finies.

## Lancer en local

Le lancement **refuse** un dossier qui contient un fichier `.env` (le site et l'API
y liraient de vraies clés, par exemple Resend : de vrais e-mails partiraient). Il
faut donc une copie du site et une copie de l'API sans `.env` :

```bash
git -C ~/dev/Newbi2/newbi-api worktree add --detach ../.worktrees/newbi-api-tests-e2e origin/develop
ln -s ../newbi-api/node_modules ~/dev/Newbi2/.worktrees/newbi-api-tests-e2e/node_modules
# depuis une copie du site sans .env :
NEWBI_API_DIR=../newbi-api-tests-e2e npm run tests-e2e:ui
```

Ports : site 3201, API 4201 (jamais 3000/4000). `E2E_PORT` pour un second lancement
en parallèle. `E2E_REUTILISER_BUILD=1` garde le build du site d'un lancement à
l'autre (gain de plusieurs minutes), `E2E_DEV=1` utilise `next dev`,
`E2E_LOG_API=debug` affiche les journaux de l'API.
