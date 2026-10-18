# Tests de bout en bout de Newbi (`tests-e2e/`)

Le site et l'API tournent ensemble sur des **données de test** : base Mongo en
mémoire (replica set), API lancée sans crons, services externes coupés
(Stripe, Resend, R2, SuperPDP, Bridge, OCR…), appels vers Internet bloqués
dans le navigateur. Rien ne touche la prod.

Ils se lancent depuis l'admin (**admin.newbi.fr/tests/newbi**, workflow
`.github/workflows/tests-e2e.yml`) ou en local.

## Ce qui est testé

- `socle.spec.mjs` : le compte de test est connecté et la liste des factures s'affiche.
- `factures/creation.spec.mjs` : **catalogue de cas** de création dans l'éditeur
  (complète, brouillon, particulier, remises, TVA à 0 %, plusieurs taux,
  autoliquidation, acompte…), avec vérification de ce qui est enregistré en base.
- `factures/erreurs.spec.mjs` : erreurs de saisie, message attendu et aucune facture créée.
- `factures/liste.spec.mjs` : onglets, lignes, recherche, panneau latéral et actions
  (payée, annulée, brouillon validé, brouillon supprimé), avec le compte « Liste ».

Chaque page est contrôlée d'office (`outils.mjs`) : erreur JavaScript ou console,
réponse 500, « undefined » / « NaN » affichés, appel vers l'extérieur.

## Ajouter un cas

Une entrée dans `CAS` (`factures/creation.spec.mjs`) : client, articles
(`nom`, `quantite`, `prix`, `tva`, `mention`, `remise`), actions avant création, et
l'`attendu` en base. Les actions de l'éditeur sont dans `factures/editeur.mjs`, les
données de départ dans `donnees/` (deux comptes : « Atelier », vide, et « Liste »,
pré-rempli). Toujours ouvrir avec `ouvrir()` et cliquer avec `cliquer()`
(`navigation.mjs`) : ils attendent que la page soit hydratée et que les requêtes
Next et GraphQL soient finies.

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
