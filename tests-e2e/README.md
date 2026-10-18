# Tests de bout en bout de Newbi (`tests-e2e/`)

Le site et l'API tournent ensemble sur des **données de test** : base Mongo en
mémoire (replica set), API lancée sans crons, services externes coupés
(Stripe, Resend, R2, SuperPDP, Bridge, OCR…), appels vers Internet bloqués
dans le navigateur. Rien ne touche la prod.

Ils se lancent depuis l'admin (**admin.newbi.fr/tests/newbi**, workflow
`.github/workflows/tests-e2e.yml`) ou en local.

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
