# Plan de fix accessibilité — diagnostic décisionnel

> Run du 2026-05-01 : `PLAYWRIGHT_PROJECT=a11y npx playwright test e2e/a11y/`
> Résultat : 8 fails (2 dashboard + 6 publiques), 6 passed.
> **Évolution depuis l'audit du 30/04** : les violations `list` (×6 sur dashboard, clients, factures) et `aria-allowed-attr` (×1 critical sur kanban) ont **disparu** — soit corrigées entre temps, soit le DOM rend différemment aujourd'hui. Reste uniquement des violations **`color-contrast`** (serious).

---

## Synthèse exécutive

| Groupe                         | Pages touchées                                   | Nodes      | Composant                                                           | Portée fix                         |
| ------------------------------ | ------------------------------------------------ | ---------- | ------------------------------------------------------------------- | ---------------------------------- |
| **G1** Footer h3 sections      | CGV, mentions-légales, politique-confidentialité | 4 × 3 = 12 | `src/components/footer7.jsx:123,170,221,238`                        | **COMPONENT_LOCAL**                |
| **G2** Bouton primary CTA auth | /auth/login, /auth/signup                        | 2 × 1 = 2  | `src/components/ui/button.jsx:15` (variante primary)                | **TOKEN_GLOBAL** (1 token couleur) |
| **G3** Page 404 footer         | /dashboard/account (rendue via not-found ?)      | 1          | `app/not-found.jsx:58-59`                                           | **PAGE_LOCAL**                     |
| **G4** Landing marketing       | /                                                | 5+         | composants marketing landing (`text-neutral-400`, badges `#4F39F6`) | **COMPONENT_LOCAL** ×N             |

**Décompte total** : ~20 nodes axe, ~4 composants à toucher.

---

## G1 — Footer h3 sections (CGV, mentions-légales, politique-confidentialité)

**Pages** : `/cgv`, `/mentions-legales`, `/politique-de-confidentialite` (3 fails distincts qui pointent tous le même footer).

**Violation axe** :

- `id: color-contrast` (serious)
- 4 nodes par page (h3 "Produits", "Ressources", "Support", "Legal")
- HTML : `<h3 class="text-sm/6 font-medium text-gray-950/50 mb-2 sm:mb-3 md:mb-6">Produits</h3>`
- Foreground : `#7d7f89` (résolu de `text-gray-950/50` = `rgba(15,18,22,0.5)` sur fond `#f7f6ff`)
- Background : `#f7f6ff` (héritage `bg-[#5A50FF]/10` parent)
- **Ratio : 3.71** — requis 4.5

**Composant** : `src/components/footer7.jsx` lignes 123, 170, 221, 238 — toutes utilisent `text-gray-950/50`.

**Cause technique** : la classe `text-gray-950/50` (gris très foncé avec 50 % opacity) est appliquée sur un fond lui-même translucide (`bg-white/50` au-dessus de `bg-[#5A50FF]/10`). Le composite final donne un gris-violet pâle et un texte gris semi-transparent → ratio insuffisant.

**Hypothèse de fix** :

- Option A (low-effort) : remplacer `text-gray-950/50` par `text-gray-700` ou `text-gray-800` (opaque, ratio largement > 4.5).
- Option B : passer à `text-gray-950/70` ou `/80` — vérifier que ça passe les 4.5.
- Option C : changer le fond du footer (retirer le `bg-[#5A50FF]/10` violet pâle pour un blanc franc).

Recommandation : **Option A**. Modif minimale (4 occurrences dans `footer7.jsx`), pas de drift visuel notable (le gris reste discret).

**Portée** : COMPONENT_LOCAL — 1 fichier, 4 occurrences. Aucun impact ailleurs (footer7.jsx est utilisé sur les pages publiques).

**Owner suggéré** : design system / front.

---

## G2 — Bouton primary CTA auth (login + signup)

**Pages** : `/auth/login`, `/auth/signup` (2 fails identiques).

**Violation axe** :

- `id: color-contrast` (serious)
- 1 node par page : `<button data-slot="button" class="appearance-none rela...">` (le bouton submit du formulaire auth)
- Foreground : `#ffffff` (text-white)
- Background : `#6a61ff` — c'est `#5A50FF` rendu avec un overlay transparent (`/90` ou similaire selon état hover/active)
- **Ratio : 4.4** — requis 4.5 (manque 0.1)

**Composant** : `src/components/ui/button.jsx:15` — variante `primary` :

```js
"bg-[#5A50FF] hover:bg-[#4840D9] active:bg-[#3F37B3] text-white ...";
```

Le test capture l'état hover `bg-[#5A50FF]/90` (= rgb(106, 97, 255)) → ratio sur blanc 4.4. La couleur de base `#5A50FF` (sans opacity) donne un meilleur ratio.

**Cause technique** : la teinte primary `#5A50FF` est juste à la limite WCAG AA. Avec un overlay (`/90` au survol), elle bascule sous 4.5.

**Hypothèse de fix** :

- Option A : assombrir légèrement la teinte primary de `#5A50FF` à `#5044F0` ou `#4840D9` (la teinte hover actuelle, qui passe les 4.5).
- Option B : passer `text-white font-medium` → `font-semibold` pour bénéficier de la règle WCAG "texte large gras = ratio 3:1 suffit". Mais 14px ne qualifie pas comme large.
- Option C : retirer l'overlay `/90` au hover, garder la teinte de base.

Recommandation : **Option A** = changer le token primary brand. Mais c'est **TOKEN_GLOBAL** — la couleur `#5A50FF` est utilisée partout (boutons CTA, headers de doc PDF, accents). Tester que les visual-regression baselines tiennent.

**Portée** : TOKEN_GLOBAL si on touche `#5A50FF` — impacte tous les écrans. COMPONENT_LOCAL si on retire juste l'overlay hover sur le bouton primary (Option C).

**Owner suggéré** : design (validation visuelle requise) + front.

---

## G3 — Page 404 (rendue sur /dashboard/account)

**Pages** : `/dashboard/account` (1 fail).

**Violation axe** :

- `id: color-contrast` (serious)
- 1 node : `<p class="text-xs text-gray-400 font-mono">Erreur 404</p>`
- Foreground : `#99a1af` (text-gray-400)
- Background : `#ffffff`
- **Ratio : 2.6** — requis 4.5

**Composant** : `app/not-found.jsx:58-59`. Le `<p>Erreur 404</p>` est rendu par la page Next.js `not-found`.

**Question préalable importante** : pourquoi `/dashboard/account` rend-il la page 404 ? Soit la route n'existe plus (régression), soit le test attend une page qui n'a jamais existé. À vérifier — `app/dashboard/account/` ne contient que des composants, pas de `page.jsx`. **C'est une régression de routing OU le test devrait pointer ailleurs**.

**Hypothèse de fix** :

- Si la route est légitimement disparue : retirer `/dashboard/account` de la liste des pages auditées dans `e2e/a11y/dashboard-a11y.spec.js:18`.
- Si elle devrait exister : restaurer `app/dashboard/account/page.jsx` (probable régression de route).

Pour la 404 elle-même : `text-gray-400` (= `#99a1af`) sur blanc → passer à `text-gray-600` (= `#4b5563`, ratio ~7) ou `text-gray-500` (`#6b7280`, ratio ~4.83).

**Portée** : PAGE_LOCAL pour la 404 (1 ligne), + investigation routing pour `/dashboard/account`.

**Owner suggéré** : front (routing) + design (404 styling).

---

## G4 — Landing page (/)

**Pages** : `/` (1 fail, mais 5+ nodes).

**Violations axe** :

- `id: color-contrast` (serious), nodes multiples sur la landing :
  - **Badge "+3 500€"** : `bg-[#4F39F6]/20 text-[#4F39F6]` sur fond sombre `#353155` — ratio **1.88** (≪ 4.5). Texte minuscule (10px).
  - **Texts neutral-400** sur fond blanc : `<p class="text-xs text-neutral-400">Julien Marchand</p>`, `Débité le 15 décembre 2025`, `Ce mois` — ratio **2.58**.
  - … plusieurs autres nodes du hero / cartes marketing avec `text-neutral-400` sur cartes blanches.

**Composants** : à localiser dans `app/(main)/page.jsx` ou `src/components/landing/*` — multiples composants marketing (Hero, FeatureCards, BankCard…).

**Cause technique** :

- Pour le badge `text-[#4F39F6]/...` sur fond sombre : couleur d'accent violet trop similaire au fond mauve `#353155`.
- Pour `text-neutral-400` (`#a1a1a1`) sur blanc : couleur secondaire trop pâle.

**Hypothèse de fix** :

- Badge : changer `text-[#4F39F6]` en `text-white` ou un violet beaucoup plus clair sur fond sombre.
- `text-neutral-400` → `text-neutral-600` (`#525252`, ratio ~7) — modif globale possible si la convention "labels secondaires" devient `neutral-600`.

**Portée** : COMPONENT_LOCAL pour les composants landing (potentiellement plusieurs fichiers). Si on standardise `text-neutral-400` → `text-neutral-600` au niveau du token, c'est TOKEN_GLOBAL et probablement pas souhaitable (ça assombrit les "secondary text" partout).

Recommandation : traiter cas par cas, par composant landing concerné. Pas de fix global.

**Owner suggéré** : marketing (validation copy/design landing) + front.

---

## Hors-scope (à classer séparément)

### Test `Devis (/dashboard/outils/devis)` — TimeoutError, pas a11y

```
TimeoutError: page.goto: Timeout 45000ms exceeded.
```

Ce fail apparaît dans le run a11y mais n'est PAS une violation accessibilité — c'est une régression de chargement (page > 45s à monter). Cohérent avec l'observation TODO.md ligne 137 sur d'autres pages "lentes" (analytiques, account/settings). À traiter en **R5 perf** distinct dans `REGRESSIONS_TO_FIX.md`.

---

## Plan de bataille recommandé (ordre d'exécution)

1. **G1 — footer7.jsx** (4 lignes, 3 pages, ratio facile à corriger). 30 min, gain : 3 fails sur 8.
2. **G3 — investigation routing /dashboard/account** + fix 404 styling (2 fronts indépendants). 30 min.
3. **G2 — bouton primary** : décision design requise (toucher la marque ou retirer l'overlay hover). Bloqué tant que pas de validation produit.
4. **G4 — landing** : itératif, par composant. Pas critique tant que le marketing ne pousse pas une refonte. À planifier.

Estimation pour atteindre **0 fail a11y SERIOUS/CRITICAL** : ~3 h de dev + validation design pour G2. G4 peut être décalé sans dette grave (la landing reste lisible visuellement, c'est un échec WCAG strict pas un blocker UX).

**Décision attendue** : ordre d'attaque + validation design pour G2.
