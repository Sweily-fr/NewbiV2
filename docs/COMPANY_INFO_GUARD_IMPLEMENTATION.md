# 🔒 Système de Contrôle d'Accès avec AlertDialog Informatif

## 📋 Vue d'ensemble

Système complet de contrôle d'accès pour les outils **Factures** et **Devis** qui affiche un AlertDialog détaillé listant précisément les champs manquants avant de rediriger l'utilisateur vers les paramètres.

## ✨ Fonctionnalités

### 1. **AlertDialog Informatif Détaillé**

Lorsqu'un utilisateur clique sur un outil verrouillé, un dialog s'affiche avec :

- **Icône d'alerte** rouge avec titre "Configuration requise"
- **Liste précise des champs manquants** organisée par catégorie :
  - 📋 **Informations générales** (si manquantes)
  - 📄 **Informations légales** (si manquantes)
- **Icône AlertCircle** rouge à côté de chaque champ manquant
- **Encadré bleu avec astuce** expliquant l'utilité des informations
- **Deux boutons d'action** :
  - "Annuler" : Ferme le dialog
  - "Compléter les informations" : Ouvre les paramètres au bon onglet

### 2. **Validation Complète**

Le système vérifie **TOUTES** les informations requises :

#### Informations Générales (Onglet "Générale")
- ✅ Nom de l'entreprise
- ✅ Email de contact
- ✅ Rue
- ✅ Ville
- ✅ Code postal
- ✅ Pays

#### Informations Légales (Onglet "Informations légales")
- ✅ SIRET
- ✅ Forme juridique

### 3. **Logique Intelligente d'Ouverture**

Le système détermine automatiquement quel onglet ouvrir :
- Si **informations générales manquantes** → Onglet "Générale"
- Si **générales OK mais légales manquantes** → Onglet "Informations légales"

## 🎨 Design de l'Interface

### AlertDialog des Champs Manquants

```jsx
┌─────────────────────────────────────────┐
│  🔴  Configuration requise              │
│      Informations d'entreprise          │
│      incomplètes                        │
├─────────────────────────────────────────┤
│                                         │
│  Pour utiliser les outils de           │
│  Facturation et Devis, vous devez      │
│  compléter les informations suivantes: │
│                                         │
│  🔴 Informations générales              │
│     ⚠️ Nom de l'entreprise             │
│     ⚠️ Email de contact                │
│     ⚠️ Rue                             │
│                                         │
│  🔴 Informations légales                │
│     ⚠️ SIRET                           │
│     ⚠️ Forme juridique                 │
│                                         │
│  💡 Astuce : Ces informations seront   │
│     automatiquement utilisées pour     │
│     générer vos documents              │
│     professionnels.                    │
│                                         │
├─────────────────────────────────────────┤
│        [Annuler]  [Compléter ➜]        │
└─────────────────────────────────────────┘
```

### Bouton sur les Cartes d'Outils

```jsx
┌──────────────────────────────────┐
│  Créer une Facture               │
│  Créez et gérez facilement...    │
│                                  │
│  [🔒 Configuration requise]      │
└──────────────────────────────────┘
```

## 📁 Fichiers Modifiés/Créés

### Frontend

#### 1. **`/src/hooks/useCompanyInfoGuard.js`** ✅
- Vérifie TOUTES les informations (générales + légales)
- Fonction `isCompanyInfoComplete()` mise à jour
- Retourne `organization` au lieu de `company`

#### 2. **`/src/components/section-cards.jsx`** ✅
- Fonction `getMissingFields()` pour analyser les champs manquants
- AlertDialog détaillé avec liste des champs par catégorie
- Bouton unique "Configuration requise" (suppression "Accéder" et "En savoir plus")
- Logique d'ouverture intelligente des paramètres

#### 3. **`/src/components/company-info-guard.jsx`** ✅ (NOUVEAU)
- Composant Guard réutilisable pour protéger les pages individuelles
- Affiche le même AlertDialog détaillé
- Redirection automatique si informations incomplètes
- Utilisé dans les pages de création de factures et devis

#### 4. **`/app/dashboard/outils/factures/new/page.jsx`** ✅
- Ajout du `CompanyInfoGuard` autour du contenu
- Protection double : ProRouteGuard + CompanyInfoGuard

#### 5. **`/app/dashboard/outils/devis/new/page.jsx`** ✅
- Ajout du `CompanyInfoGuard` autour du contenu
- Protection double : ProRouteGuard + CompanyInfoGuard

### Backend

#### 6. **`/newbi-api/src/middlewares/company-info-guard.js`** ✅
- Validation complète des informations générales ET légales
- Messages d'erreur détaillés avec liste des champs manquants
- Protection de toutes les mutations GraphQL

## 🔄 Flux Utilisateur

### Scénario 1 : Clic sur la carte d'outil (Dashboard)

```
1. Utilisateur clique sur "Créer une Facture" ou "Créer un Devis"
   ↓
2. Système vérifie les informations d'entreprise
   ↓
3. Si incomplètes → AlertDialog s'affiche avec :
   - Liste précise des champs manquants
   - Séparation Générales / Légales
   - Icônes d'alerte rouges
   ↓
4. Utilisateur clique "Compléter les informations"
   ↓
5. Modal de paramètres s'ouvre sur le bon onglet
   ↓
6. Utilisateur complète les informations
   ↓
7. Retour au dashboard → Outils déverrouillés
```

### Scénario 2 : Accès direct à l'URL (ex: /factures/new)

```
1. Utilisateur accède directement à /factures/new
   ↓
2. ProRouteGuard vérifie l'abonnement
   ↓
3. CompanyInfoGuard vérifie les informations
   ↓
4. Si incomplètes → AlertDialog s'affiche
   ↓
5. Deux options :
   - "Retour aux outils" → Retour au dashboard
   - "Compléter les informations" → Paramètres
```

## 🎯 Avantages de l'Implémentation

### ✅ Expérience Utilisateur Améliorée
- **Transparence totale** : L'utilisateur sait exactement quoi remplir
- **Guidage précis** : Liste détaillée des champs manquants
- **Gain de temps** : Pas de navigation à l'aveugle dans les paramètres
- **Feedback visuel** : Icônes et couleurs pour une meilleure compréhension

### ✅ Sécurité et Validation
- **Protection double** : Frontend + Backend
- **Validation complète** : Toutes les informations requises vérifiées
- **Messages d'erreur clairs** : Backend retourne des détails précis
- **Prévention des erreurs** : Impossible de créer des documents incomplets

### ✅ Maintenabilité
- **Code réutilisable** : Composant `CompanyInfoGuard` pour toutes les pages
- **Logique centralisée** : Fonction `getMissingFields()` unique
- **Cohérence** : Même validation frontend et backend
- **Documentation** : Code commenté et structure claire

## 🧪 Tests Recommandés

### Test 1 : Informations Générales Manquantes
1. Vider les champs : nom, email, adresse
2. Cliquer sur "Créer une Facture"
3. ✅ Vérifier que le dialog liste les 6 champs généraux
4. ✅ Vérifier que "Compléter" ouvre l'onglet "Générale"

### Test 2 : Informations Légales Manquantes
1. Remplir les informations générales
2. Vider SIRET et forme juridique
3. Cliquer sur "Créer un Devis"
4. ✅ Vérifier que le dialog liste les 2 champs légaux
5. ✅ Vérifier que "Compléter" ouvre l'onglet "Informations légales"

### Test 3 : Toutes Informations Manquantes
1. Vider tous les champs
2. Cliquer sur un outil
3. ✅ Vérifier que le dialog liste 8 champs (6 généraux + 2 légaux)
4. ✅ Vérifier les deux sections séparées

### Test 4 : Accès Direct URL
1. Accéder à `/dashboard/outils/factures/new` directement
2. ✅ Vérifier que le CompanyInfoGuard bloque l'accès
3. ✅ Vérifier que le dialog s'affiche
4. ✅ Vérifier que "Retour aux outils" fonctionne

### Test 5 : Informations Complètes
1. Remplir tous les champs requis
2. ✅ Vérifier que les boutons "Accéder" et "En savoir plus" s'affichent
3. ✅ Vérifier que l'accès aux outils est autorisé
4. ✅ Vérifier qu'aucun dialog ne s'affiche

## 📊 Exemple de Données Affichées

### Cas : Toutes informations manquantes

```
Configuration requise
Informations d'entreprise incomplètes

Pour utiliser les outils de Facturation et Devis,
vous devez compléter les informations suivantes :

🔴 Informations générales
   ⚠️ Nom de l'entreprise
   ⚠️ Email de contact
   ⚠️ Rue
   ⚠️ Ville
   ⚠️ Code postal
   ⚠️ Pays

🔴 Informations légales
   ⚠️ SIRET
   ⚠️ Forme juridique

💡 Astuce : Ces informations seront automatiquement
   utilisées pour générer vos documents professionnels.
```

## 🚀 Déploiement

### Checklist Avant Déploiement

- [x] Hook `useCompanyInfoGuard` mis à jour
- [x] Composant `section-cards.jsx` avec AlertDialog
- [x] Composant `CompanyInfoGuard` créé
- [x] Pages factures protégées
- [x] Pages devis protégées
- [x] Middleware backend mis à jour
- [x] Tests manuels effectués
- [x] Documentation créée

### Variables d'Environnement

Aucune variable supplémentaire requise.

### Migration

Aucune migration de base de données nécessaire.

## 📝 Notes Importantes

1. **Ordre des Guards** : Toujours mettre `ProRouteGuard` en premier, puis `CompanyInfoGuard`
2. **Performance** : Le dialog utilise les données déjà en cache (pas d'appel API supplémentaire)
3. **Responsive** : Le dialog s'adapte automatiquement aux petits écrans
4. **Dark Mode** : Tous les styles supportent le mode sombre
5. **Accessibilité** : Utilisation de composants shadcn/ui accessibles

## 🎉 Résultat Final

Un système de contrôle d'accès **complet**, **informatif** et **user-friendly** qui guide précisément l'utilisateur vers les informations à compléter, améliorant considérablement l'expérience utilisateur et la qualité des données.
