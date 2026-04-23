# Roadmap — Rapprochement bancaire

> **Prochaine revue : 23/07/2026.** Relire ce doc, confronter les seuils aux données réelles, décider si on lance V2.

## V1 — Toast inbox-style (actuel)

**Livré le 23/04/2026.**

### Ce qui existe

- Carte de notification "soft UI" (fond clair, coins arrondis, ombres douces)
- Texte fluide : **Payeur** a payé **montant** — **Facture N**
- 2 actions : Ignorer (outline) / Rattacher (solid) — clic carte = voir la facture
- Deck "cartes empilées" quand 2+ paiements détectés, max 3 cartes visibles (hover = expansion)
- Persistant jusqu'à action (pas de timeout)
- Undo façon Gmail sur "Ignorer" (5s pour annuler)
- Ignore côté serveur (mutation `ignoreTransaction`) + localStorage en cache optimiste
- Matching : montant exact (1% tolérance) + nom client dans description
- Seules les suggestions "high confidence" sont affichées
- Polling Apollo toutes les 60 secondes

### Limites connues

- Ne scale pas au-delà de ~5 paiements en attente (max 3 cartes visibles dans le deck, le reste est masqué)
- Pas de workflow batch (une carte = une action)
- Pas de paiements partiels ni de split
- Pas de règles de rapprochement automatique (bank rules)
- Pas de vue historique des rapprochements effectués
- Pas de tracking analytics sur les actions du toast (voir prérequis ci-dessous)

---

## Prérequis : instrumenter le tracking

L'event `reconciliation_toast_action` **n'existe pas encore** dans notre stack analytics. Sans lui, les seuils de bascule sont inévaluables.

**Tâche** : ajouter le tracking avant de mesurer quoi que ce soit.

- Event : `reconciliation_toast_action`
- Properties : `action` (rattacher / ignorer / navigate), `suggestions_count` (nombre de suggestions affichées au moment de l'action), `transaction_id`, `confidence`
- Déclenchement : dans `handleLink`, `handleIgnore`, `handleNavigate` du `ReconciliationToastProvider`
- Tracker aussi un event `reconciliation_toast_displayed` au montage du deck (avec `suggestions_count`)

---

## Seuils de bascule — quand passer à la suite ?

| Critère                                                          | Seuil V2 (compteur sidebar)             | Seuil V3 (page dédiée)                                       |
| ---------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------ |
| Nb moyen de transactions non rapprochées par utilisateur actif   | > 3 en attente fréquemment              | > 10 en attente régulièrement                                |
| Taux d'action sur le toast (rattacher + ignorer / total affiché) | < 60% (les utilisateurs n'agissent pas) | < 40% ou feedback "trop de notifs"                           |
| Taux de rapprochements annulés/corrigés après action             | —                                       | > 10% (le toast ne donne pas assez de contexte pour décider) |
| Feedback utilisateurs                                            | "Je vois souvent le même deck"          | "Je veux tout traiter d'un coup"                             |
| Volume de transactions bancaires connectées                      | > 50 transactions/mois/utilisateur      | > 100 transactions/mois/utilisateur                          |

### Règle de priorité

Si les seuils V2 et V3 sont franchis en même temps : **V2 d'abord**. Livrer le compteur sidebar, mesurer pendant 4 à 6 semaines, puis réévaluer si V3 est toujours nécessaire. Le compteur sidebar peut suffire à absorber le volume sans nécessiter une page dédiée. Ne pas sauter d'étape.

---

## V2 — Compteur sidebar

**Effort estimé** : petit. **Impact** : gros.

### Où

- Dans la sidebar gauche du dashboard, sous l'entrée "Banque" ou "Transactions"
- Pastille numérique (badge) sur l'icône, style identique aux badges de notification existants

### Ce qu'il affiche

- Nombre de transactions non rapprochées à haute confiance
- Au hover : mini-preview des 2-3 premières suggestions (payeur + montant)
- Clic : redirige vers la page transactions avec filtre `reconciliationStatus=unmatched`

### Données

- Réutilise `useReconciliationSuggestions` avec une variante légère (sans polling agressif)
- Le hook `useReconciliationForSidebar` existe déjà — l'étendre avec un count

### Coexistence avec V1

- Le toast reste actif mais limité aux **nouvelles** suggestions apparues depuis la dernière visite
- Si > 3 suggestions en attente : le toast affiche 1 seule carte + lien "Voir les N paiements en attente" qui pointe vers la sidebar/page

---

## V3 — Page de réconciliation dédiée

**Références** : Pennylane (inbox suggestions), Xero (side-by-side, gold standard), QuickBooks (onglets For Review/Categorized/Excluded), Ramp (auto-categorization).

### Workflow batch

- Liste de toutes les transactions non rapprochées (filtre par date, montant, statut)
- Chaque ligne montre : transaction à gauche, suggestion(s) de facture à droite
- Actions inline : Rattacher (1 clic), Ignorer, Rechercher manuellement une facture
- Sélection multiple + action groupée ("Rattacher les 5 suggestions validées")
- Tri par confiance (high en haut), puis par date

### Fonctionnalités avancées

- **Paiements partiels** : rattacher une transaction à plusieurs factures (split)
- **Règles de rapprochement** : "Les virements contenant 'LOYER' vont toujours sur la facture récurrente X"
- **Auto-rapprochement** : pour les règles validées, rapprochement automatique sans intervention
- **Historique** : onglet des rapprochements passés avec possibilité de délier

### Le toast en V3

- Rôle réduit à un **nudge temps réel** : "1 nouveau paiement détecté" avec CTA vers la page dédiée
- Ne propose plus de rattacher directement depuis le toast (sauf si 1 seul paiement isolé)
- Disparaît si l'utilisateur est déjà sur la page de réconciliation

---

## Ce qu'on garde / ce qu'on jette entre chaque version

| Élément                                | V1 → V2                                                       | V2 → V3                                                         |
| -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- |
| `ReconciliationCard` (composant carte) | **Garde** — réutilisé dans le toast                           | **Garde** — réutilisable dans la page comme preview             |
| `ReconciliationDeck` (stack)           | **Garde** — limité à 1 carte + lien sidebar                   | **Jette** — remplacé par la liste batch                         |
| `ReconciliationToastProvider`          | **Garde** — logique filtrée (nouvelles suggestions seulement) | **Simplifie** — ne gère que le nudge                            |
| `useReconciliationGraphQL`             | **Garde** tel quel                                            | **Étend** — ajouter split, rules, bulk actions                  |
| `useReconciliationForSidebar`          | **Étend** — ajouter le count                                  | **Garde**                                                       |
| Ignore localStorage                    | **Garde** en cache optimiste                                  | **Jette** — le serveur fait autorité, localStorage est un cache |
| Matching algorithm (backend)           | **Garde**                                                     | **Étend** — ajouter rules engine, partial matching              |
| Undo toast (sonner)                    | **Garde**                                                     | **Garde** — applicable partout                                  |

---

## Hors scope actuel

Sujets identifiés mais non planifiés. À trancher quand le besoin se manifeste.

- **Notifications email/push pour users inactifs** — relancer les utilisateurs qui ont des rapprochements en attente depuis > 7 jours (nécessite un job backend + templates email)
- **Intégration avec les règles comptables** — associer automatiquement un compte PCG, un taux de TVA, ou une catégorie de dépense au moment du rapprochement (dépend de la maturité du module comptable)
- **Multi-devises** — le matching actuel assume EUR. Pour les utilisateurs avec des comptes en USD/GBP, il faudra gérer la conversion et la tolérance sur le taux de change
