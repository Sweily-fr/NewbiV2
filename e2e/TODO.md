# TODO E2E — non-bloquants pour Phase P0

## A11y violations réelles (à surfacer côté produit)

Découvertes lors du run complet du 30 avril 2026 (commit `feat/e2e-p0-coverage`).
Ces violations existaient avant l'élagage — elles étaient masquées par le fait
que tous les tests authentifiés skippaient silencieusement (seed cassé :
`member.userId` en string au lieu d'ObjectId).

### color-contrast (serious) — 6 pages

- `/` (Landing)
- `/auth/login`
- `/auth/signup`
- `/cgv`
- `/mentions-legales`
- `/politique-de-confidentialite`

Probable cause : un token de couleur CSS (variable du design system) qui ne
respecte pas le ratio WCAG AA (4.5:1 pour le texte normal, 3:1 pour le
texte large).

### list/listitem mal structurés (serious) — 1 page

- `/dashboard` : 2 violations `<ul>` and `<ol>` must only directly contain
  `<li>`, `<script>` or `<template>` elements + `<li>` elements must be
  contained in a `<ul>` or `<ol>`

Probable cause : un composant qui rend des `<li>` sans `<ul>` parent, ou un
`<ul>` qui contient autre chose que des `<li>`.

### color-contrast (serious) — 2 pages dashboard

- `/dashboard/account`
- `/dashboard/catalogues`

## Timeouts perf (>45s en local)

Pages qui prennent plus de 45 secondes à charger sur la machine de dev locale —
anormal et probablement régression depuis un refactor récent.

- `/dashboard/outils/analytiques`
- `/dashboard/account/settings` (parfois)
- `/dashboard/outils/factures-achat`
- `/dashboard/outils/avoirs` (credit-notes)

À investiguer : cascade Apollo ? Suspense React ? backend lent ? Lighthouse
timing en local ?

## Specs SÉLECTEUR cassés (à archiver ou réparer au cas par cas)

Les specs ci-dessous ont des sélecteurs qui ne matchent plus l'UI actuelle.
Décision : ne pas réparer en bloc, traiter au cas par cas quand on touche
aux zones concernées du code applicatif.

- `e2e/clients/client-crud.spec.js` (strict mode violations — manque `.first()` partout)
- `e2e/email-signatures/signatures-crud.spec.js`
- `e2e/factures-achat/factures-achat-list.spec.js`
- `e2e/invoices/create-invoice.spec.js` (sera remplacé par nouveau P0 facture acompte)
- `e2e/invoices/edit-delete-invoice.spec.js`
- `e2e/kanban/kanban-crud.spec.js` (sera remplacé par nouveau P0 subscription temps réel)
- `e2e/onboarding/onboarding-steps.spec.js`

## Crash mid-test

- `e2e/calendar/calendar-page.spec.js` — page closed mid-test ("Target page,
  context or browser has been closed"). À investiguer si on remet la
  couverture calendar dans le périmètre P0.

## Dépendances externes

- `e2e/onboarding/onboarding.spec.js:177` — fetch Stripe externe sur
  `/api/create-org-subscription`. À mocker avec `route.fulfill()` ou
  utiliser une clé Stripe test_mode dédiée.

## Assertions value mismatch

- `e2e/dashboard/dashboard-home.spec.js:17` — `expect(received).toBe(expected)`
- `e2e/dashboard/dashboard-home.spec.js:51` — `expect(received).toBeGreaterThanOrEqual`
- `e2e/dashboard/dashboard-home.spec.js:65` — `expect(received).toBe(expected)`

Probable cause : la page d'accueil dashboard ne charge plus le même contenu
(stats, badges, cards) qu'au moment où le spec a été écrit. À traiter avec
le P0 dashboard si on en écrit un.

---

## Verdict global du run du 30 avril 2026

```
83 passed | 48 failed | 128 skipped (sur projet=chromium uniquement, 24 min)
```

Distribution des fails :

- SÉLECTEUR : ~28 (58 %) → archive, fix au cas par cas
- LOGIQUE : ~19 (40 %) → vraies régressions UI à fixer côté produit
- DÉPENDANCE : ~1 (2 %) → mock à mettre en place

L'absence quasi-totale de fail "logique métier critique" (mutations qui
échouent, données mal sauvées) est un bon signal : la régression silencieuse
qu'on craignait n'a pas eu lieu, sinon les 83 specs qui passent
maintenant l'auraient détectée à un moment.
