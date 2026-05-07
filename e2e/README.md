# Tests E2E

Stack : Playwright + Better Auth + Mongo (`invoice-app-test`) + backend dédié sur `:4001`.

## Prérequis

- MongoDB local sur `localhost:27017` (db `invoice-app-test` est créée à la volée par le seed).
- Aucun process sur `:3000` (frontend), `:4000` (dev API), `:4001` (e2e API).
- `.env.test` à la racine de `NewbiV2/` (les variables sont injectées par `playwright.config.js`).

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:4001 | xargs kill -9 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null
```

## Mode normal (CLI)

Playwright démarre le backend (`npm run dev:e2e` côté `newbi-api`) et le frontend Next en mode dev (`npm run dev:e2e` côté `NewbiV2`). Le `globalSetup` purge l'utilisateur stale, fait un `sign-up` Better Auth, puis seede orga / membre / abonnement / fixtures.

```bash
# Suite complète factures (serial, ~7 min en local)
npx playwright test e2e/factures/ --workers=1 --reporter=line

# Un seul test ciblé
npx playwright test e2e/factures/avoirs.spec.js -g "Test 1" --project=chromium --reporter=line
```

## Mode UI (interactif)

Particularité : Playwright UI **ne ré-exécute pas** `globalSetup` à chaque run. L'environnement (DB seedée + cookies dans `e2e/.auth/user.json`) doit déjà être prêt avant d'ouvrir l'UI, sinon les tests partent sans session valide.

**Étape 1** — préparer l'environnement (seed + cookies) en lançant une fois en mode normal :

```bash
# Suffit de lancer un test rapide pour faire tourner setup + globalSetup une fois
npx playwright test e2e/factures/avoirs.spec.js -g "Test 1" --project=chromium --reporter=line
```

À la fin, `e2e/.auth/user.json` existe et `invoice-app-test` contient le user + l'orga.

**Étape 2** — ouvrir l'UI :

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:4001 | xargs kill -9 2>/dev/null

npx playwright test e2e/factures/ --ui
```

Lancer les tests un par un depuis l'interface. Si la session expire ou si l'utilisateur a été nettoyé manuellement, refaire l'étape 1.

## Diagnostic

- **Échec dans `globalSetup`** : le seed log toujours le `status` du sign-up et le contenu de la DB cible quand un user attendu manque (voir `e2e/global-setup.ts`).
- **Cookies périmés / sessions cassées** : supprimer `e2e/.auth/user.json` et relancer.
- **DB polluée** : `mongosh invoice-app-test --eval 'db.dropDatabase()'` puis relancer en mode normal.
- **Tests UI qui partent sans session** : symptôme d'une `.auth/user.json` absente — refaire l'étape 1 du mode UI.

## Pourquoi pas le build prod ?

Le couple `npm run build:e2e && npm run start:e2e` accélère le premier hit mais introduit des régressions sur certains tests (validation RHF, picker client Radix). On garde le mode dev (Turbopack) par défaut pour la fiabilité ; les scripts `build:e2e` / `start:e2e` restent dans `package.json` pour usage ponctuel.
