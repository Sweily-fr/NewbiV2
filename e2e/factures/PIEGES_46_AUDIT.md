# Audit pièges §46 — Phase 3 (étape 1)

> **Note méthodo** : `app/dashboard/outils/factures/docs/INVOICES_PAGE.md`
> n'existe PAS sur disque (vérifié via `find`). L'inventaire ci-dessous
> est reconstitué à partir des références `§46.X` dispersées dans :
>
> - `e2e/factures/AUDIT.md` (le plus exhaustif)
> - `e2e/factures/pieges-critiques.spec.js` (tests existants)
> - `e2e/REGRESSIONS_TO_FIX.md` (R9, R10 documentent §46.13 / §46.4)
> - Commentaires inline dans le code (ex. `crud-mutations.spec.js`
>   référence §46.9, `edit-delete.spec.js` référence §46.10)
>
> **§46.5, §46.6, §46.7, §46.14 ne sont mentionnés nulle part.** Soit
> ils n'existent pas (la numérotation §46 saute des numéros), soit
> ils n'ont jamais été ré-appliqués hors INVOICES_PAGE.md. Marqués
> **`INCONNU`** dans la matrice. Si tu connais leur contenu,
> précise-le et j'ajusterai.

## Tableau exhaustif

Légende :

- **Risque** : CRITIQUE (perte d'argent, fraude, non-compliance) /
  ÉLEVÉ (incident utilisateur visible) / MOYEN (UX trompeuse) /
  FAIBLE (cosmetique).
- **Couvert** : DIRECT (cité dans un test factures), INDIRECT (testé
  via une autre §X), NON, HORS SCOPE (intégration externe).
- **Testabilité** : RAW (mutation GraphQL pure), UI (Playwright UI),
  IMPOSSIBLE (limitation R10/R11 documentée), PDF/EMAIL/INTÉGRATION
  (hors scope tests fonctionnels).

| #     | Titre                                                        | Risque   | Couvert ?                                          | Testabilité   | Priorité |
| ----- | ------------------------------------------------------------ | -------- | -------------------------------------------------- | ------------- | -------- |
| 46.1  | Multi-format dates (string/number/ISO) dans la recherche     | MOYEN    | NON                                                | RAW + UI      | P3       |
| 46.2  | `finalTotalTTC` n'inclut pas l'escompte (recalcul UI)        | CRITIQUE | DIRECT — `pieges-critiques.spec.js` Test 1         | —             | DONE     |
| 46.3  | KPIs sur données filtrées (CA filtré ≠ CA total)             | MOYEN    | NON                                                | UI            | P3       |
| 46.4  | Onglet "En retard" ≠ statut OVERDUE en base                  | ÉLEVÉ    | DIRECT (partial — R10) `pieges-critiques` Test 2   | UI (limité)   | DONE\*   |
| 46.5  | **INCONNU**                                                  | ?        | ?                                                  | ?             | SKIP     |
| 46.6  | **INCONNU**                                                  | ?        | ?                                                  | ?             | SKIP     |
| 46.7  | **INCONNU**                                                  | ?        | ?                                                  | ?             | SKIP     |
| 46.8  | `cachedPdf` invalidation après update (PDF stale)            | ÉLEVÉ    | NON                                                | PDF/PUPPETEER | SKIP     |
| 46.9  | Préfixe `F-YYYYMM` figé au mois de création                  | MOYEN    | INDIRECT — `crud-mutations` (commentaire inline)   | RAW           | P2       |
| 46.10 | Suppression réelle vs annulation (COMPLETED non-supprimable) | ÉLEVÉ    | DIRECT — `edit-delete.spec.js` Tests 4 et 6        | —             | DONE     |
| 46.11 | `sendInvoice` est un no-op (pas d'envoi réel)                | FAIBLE   | NON                                                | EMAIL/SMTP    | SKIP     |
| 46.12 | Compteur par préfixe pas par année (doublons inter-année)    | ÉLEVÉ    | INDIRECT — `numbering-sequential` Test 6 (R14)     | RAW           | P2       |
| 46.13 | DRAFT renommé silencieusement (collision)                    | CRITIQUE | DIRECT — `pieges-critiques` Test 3 (R9 documentée) | —             | DONE     |
| 46.14 | **INCONNU**                                                  | ?        | ?                                                  | ?             | SKIP     |
| 46.15 | Pennylane désync (sync compta v2)                            | ÉLEVÉ    | NON                                                | PENNYLANE     | SKIP     |
| 46.16 | Routes API Next sans auth (`/api/invoices/data/[id]`, etc.)  | ÉLEVÉ    | NON                                                | INFRA / RAW   | P2       |
| 46.17 | Insensibilité aux accents dans la recherche                  | FAIBLE   | NON                                                | UI            | P3       |
| 46.18 | Bulk delete sur sélection mixte (suppression partielle)      | ÉLEVÉ    | DIRECT — `pieges-critiques` Test 4 (R9 documentée) | —             | DONE     |
| 46.19 | Limite 3 factures liées par devis                            | ÉLEVÉ    | DIRECT — `situations-conversion` Test 2            | —             | DONE     |
| 46.20 | DRAFT antédaté : validation reportée à la finalisation       | CRITIQUE | DIRECT — `pieges-critiques` Test 5                 | —             | DONE     |

\* §46.4 est marqué "partiel" — pieges Test 2 valide l'invariant
structurel (PENDING fraîche n'apparaît pas dans En retard) mais ne
peut pas matérialiser le scénario opposé "PENDING + dueDate passée"
faute de bypass backend (cf R10). Test rouge théorique non rendu.

## Récap

- **DONE (8)** : §46.2, §46.4 (partial), §46.10, §46.13, §46.18, §46.19, §46.20.
  Plus large que les 5 annoncés dans le prompt — `edit-delete` couvre
  §46.10 et `situations-conversion` couvre §46.19.
- **SKIP hors scope (5)** : §46.5, §46.6, §46.7 (inconnus), §46.14
  (inconnu), §46.8 (PDF Puppeteer), §46.11 (Email Resend), §46.15
  (Pennylane). Total 7 dont 4 inconnus.
- **À TESTER (P1+P2+P3)** : §46.1, §46.3, §46.9, §46.12, §46.16, §46.17.

## Détails par piège testable

### §46.1 — Multi-format dates (P3)

- **Risque** : MOYEN. KPIs et tris s'appuient sur le parsing de
  `issueDate`/`dueDate`. Si le format change (timestamp string →
  number, ou ISO sans T) sans que le parser suive, le tri casse en
  silence. Ne fait pas perdre d'argent directement.
- **Testabilité** : tester via mutation 3 invoices avec issueDate en
  3 formats différents (timestamp millis, ISO date, ISO datetime),
  vérifier que `latestInvoiceIssueDate` les ordonne correctement.
- **Verdict** : utile mais pas urgent. P3.

### §46.3 — KPIs sur données filtrées (P3)

- **Risque** : MOYEN. La page liste filtre par tab (Brouillons / À
  encaisser / En retard / Terminées) ; les KPIs en tête ("CA
  facturé") doivent recalculer sur le tab actif. Si quelqu'un fixe
  une régression en passant les KPIs sur le total non filtré, le
  comportement diverge.
- **Testabilité** : UI (lecture des KPIs avant/après changement
  d'onglet).
- **Verdict** : test UI 60-90s, valeur signal moyen. P3.

### §46.9 — Préfixe F-YYYYMM figé au mois de création (P2)

- **Risque** : MOYEN. Le default `F-${year}${month}` est calculé à
  la création. Si l'utilisateur revient sur un DRAFT 2 mois plus
  tard et finalise, le préfixe doit-il rester `F-202605` ou passer
  à `F-202607` ? Comportement actuel : le préfixe stocké sur le
  DRAFT est figé.
- **Testabilité** : RAW — créer DRAFT en mai (forcer prefix=F-202605),
  attendre ne marche pas, mais on peut simuler en passant un prefix
  explicite et en finalisant via changeInvoiceStatus, asserter que le
  prefix n'est PAS recalculé à la finalisation.
- **Verdict** : facile à tester en raw. P2.

### §46.12 — Compteur par préfixe pas par année (P2)

- **Risque** : ÉLEVÉ. Si l'utilisateur garde le préfixe `F-CLIENT-`
  d'une année à l'autre (au lieu de basculer F-CLIENT-2026- /
  F-CLIENT-2027-), le compteur continue de croître sans reset
  annuel. Aucune compliance issue tant que (prefix, number) reste
  unique, mais la facture #0042 de 2026 et la #0042 de 2027 ne
  peuvent pas coexister sous le même préfixe — le resolver rejette
  (cf R14).
- **Testabilité** : RAW. Crée une PENDING avec prefix=`X-`,
  number=42, issueDate=2026-X. Tente de créer une autre avec
  prefix=`X-`, number=42, issueDate=2027-X. Doit être rejetée par
  le resolver pre-check (incohérent avec l'index, R14 documenté).
- **Verdict** : recoupe R14 mais sous l'angle "compliance multi-année".
  P2. Le test serait un canary du fix R14.

### §46.16 — Routes API Next sans auth (P2)

- **Risque** : ÉLEVÉ (sécurité). Selon le commentaire AUDIT.md :
  `/api/invoices/data/[id]` et `/api/invoices/generate-pdf` seraient
  accessibles sans cookie de session. À auditer.
- **Testabilité** : RAW. Faire un GET sans cookies, asserter 401 ou 403. Si 200 → bug de sécurité documenté en R15.
- **Verdict** : test sécurité, P2. Très peu de code (un GET +
  assertion sur status). Risque CRITIQUE si fuite confirmée.

### §46.17 — Insensibilité aux accents (P3)

- **Risque** : FAIBLE. UX search ne match pas "société" si on tape
  "societe".
- **Testabilité** : UI — typer dans la barre de recherche, vérifier
  les résultats.
- **Verdict** : tertiaire. P3.

## Recommandation

Je propose 4-5 tests sur les pièges suivants, dans cet ordre :

1. **§46.16** (P2 — sécurité) — test RAW rapide ; signal très fort
   si rouge, devient un audit security automatique. Peu de risque
   d'être flaky.
2. **§46.9** (P2 — préfixe figé) — test RAW simple, fixe un
   invariant compliance évident.
3. **§46.12** (P2 — compteur multi-année) — recoupe R14, ajoute un
   canary explicite.
4. **§46.1** (P3 — multi-format dates) — test RAW, valide la
   robustesse du parser.
5. (Optionnel) **§46.3** (P3 — KPIs filtrés) — test UI, plus lent.

**Ne pas tester** :

- §46.17 (insensibilité accents) : signal faible, ROI bas pour
  un test UI 60s.
- §46.5, §46.6, §46.7, §46.14 : inconnus (à clarifier au préalable).
- §46.8, §46.11, §46.15 : hors scope (intégrations externes).

**Total estimé** : 4 tests (option 1-4) ou 5 si on prend §46.3.
~80-150 lignes de code, 2-4 min de run.

---

## Étape 3 — Status final après écriture des tests

| #     | Test ajouté                        | Résultat                                                                                |
| ----- | ---------------------------------- | --------------------------------------------------------------------------------------- |
| 46.16 | `pieges-critiques.spec.js` Test 6  | ✅ VERT — 401 sur GET/POST sans auth, 403 cross-tenant. Auth + isolation confirmées     |
| 46.9  | `pieges-critiques.spec.js` Test 7  | ⚠️ PARTIEL — invariant statique testé ; le dynamique requiert MongoDB replica set (R15) |
| 46.12 | (skip)                             | ✅ DÉJÀ COUVERT par `numbering-sequential.spec.js` Test 6 (R14)                         |
| 46.1  | `pieges-critiques.spec.js` Test 9  | ✅ VERT — ISO date + ISO datetime acceptés, gibberish rejeté                            |
| 46.3  | `pieges-critiques.spec.js` Test 10 | ✅ VERT — sous-ensemble Brouillons ≤ Toutes, retour à Toutes stable                     |

**Pièges désormais couverts (12/20)** :

- Direct : §46.2, §46.4 (partial R10), §46.10, §46.13, §46.18, §46.19,
  §46.20, **§46.16, §46.9 (partial R15), §46.1, §46.3** (nouveaux phase 3)
- Indirect : §46.12 (numbering-sequential R14)

**Pièges hors scope (8/20)** :

- §46.5, §46.6, §46.7, §46.14 — INCONNUS (doc INVOICES_PAGE.md absente)
- §46.8 (PDF Puppeteer), §46.11 (sendInvoice no-op), §46.15 (Pennylane),
  §46.17 (insensibilité accents) — intégrations externes / faible ROI

## Régression découverte

Aucun bug applicatif détecté. Test 6 §46.16 a initialement reporté un
"200" (faux positif faux-rouge) qui s'est révélé être un effet de bord
du `storageState` global du projet chromium : `request.newContext()`
héritait silencieusement les cookies. Fix : passer un `storageState`
vide explicite au context anonyme. Comportement backend correct
(`requireSession` / `requireOrgMembership`) confirmé.

**R15 documenté** : transactions MongoDB requises par
`changeInvoiceStatus` ne tournent pas sur le test e2e standalone
(replica set absent). Empêche le test du flow dynamique §46.9.
