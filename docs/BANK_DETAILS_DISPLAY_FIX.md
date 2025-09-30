# Correction - Affichage des Coordonnées Bancaires

## Problème Identifié

1. **Affichage par défaut incorrect** : Les coordonnées bancaires s'affichaient dans la preview même quand la case n'était pas cochée
2. **Données par défaut hardcodées** : Le PDF utilisait des valeurs par défaut comme "Sweily" au lieu des vraies données utilisateur

## Corrections Apportées

### 1. Condition d'affichage corrigée dans `UniversalPreviewPDF.jsx`

**Avant :**
```javascript
{(data.showBankDetails === undefined ||
  data.showBankDetails === true) &&
  type !== "quote" &&
  !isCreditNote && (
```

**Après :**
```javascript
{data.showBankDetails === true &&
  type !== "quote" &&
  !isCreditNote && (
```

### 2. Sources de données bancaires améliorées

**Avant :**
```javascript
{data.bankDetails?.bankName || "Sweily"}
{data.bankDetails?.bic || data.bankDetails?.bic || ""}
{data.bankDetails?.iban || data.bankDetails?.iban || ""}
```

**Après :**
```javascript
{data.bankDetails?.bankName || data.userBankDetails?.bankName || data.companyInfo?.bankDetails?.bankName || ""}
{data.bankDetails?.bic || data.userBankDetails?.bic || data.companyInfo?.bankDetails?.bic || ""}
{data.bankDetails?.iban || data.userBankDetails?.iban || data.companyInfo?.bankDetails?.iban || ""}
```

### 3. Trait de séparation corrigé

La condition pour afficher le trait de séparation a également été corrigée pour être cohérente.

## Comportement Corrigé

### **Avant la Correction**
- ❌ Coordonnées bancaires affichées par défaut même sans cocher la case
- ❌ Valeurs hardcodées "Sweily" affichées
- ❌ Affichage incohérent avec l'état de la checkbox

### **Après la Correction**
- ✅ Coordonnées bancaires affichées **uniquement** si `showBankDetails === true`
- ✅ Utilise les vraies données de l'utilisateur/organisation
- ✅ Cohérence parfaite entre checkbox et preview
- ✅ Fallback propre vers chaîne vide si pas de données

## Ordre de Priorité des Données Bancaires

1. **`data.bankDetails`** : Données spécifiques à la facture (si modifiées)
2. **`data.userBankDetails`** : Données de l'utilisateur/organisation
3. **`data.companyInfo.bankDetails`** : Données de l'entreprise (fallback)
4. **Chaîne vide** : Si aucune donnée disponible

## Test de la Correction

### Étape 1 : Vérifier l'état initial
1. Créer une nouvelle facture
2. **Vérifier que les coordonnées bancaires ne s'affichent PAS dans la preview**
3. La checkbox "Afficher les coordonnées bancaires" doit être décochée

### Étape 2 : Activer l'affichage
1. Aller dans les paramètres (icône engrenage)
2. Cocher "Afficher les coordonnées bancaires"
3. **Vérifier que les coordonnées s'affichent immédiatement dans la preview**
4. **Vérifier que ce sont les vraies données de l'organisation, pas "Sweily"**

### Étape 3 : Désactiver l'affichage
1. Décocher "Afficher les coordonnées bancaires"
2. **Vérifier que les coordonnées disparaissent de la preview**

### Étape 4 : Persistance
1. Cocher la case et enregistrer les paramètres
2. Créer une nouvelle facture
3. **Vérifier que les coordonnées s'affichent par défaut**

## Données Attendues

Quand `showBankDetails === true`, le PDF doit afficher :

```
Détails du paiement
Nom du bénéficiaire    [Nom de l'entreprise]
Nom de la banque       [Nom de la banque de l'organisation]
BIC                    [BIC de l'organisation]
IBAN                   [IBAN de l'organisation]
```

**Pas de valeurs hardcodées comme "Sweily"**

## Impact

- ✅ **Factures** : Correction appliquée
- ✅ **Devis** : Non concernés (coordonnées bancaires désactivées)
- ✅ **Avoirs** : Non concernés (coordonnées bancaires désactivées)

## Compatibilité

Cette correction est **rétrocompatible** :
- Les factures existantes ne sont pas affectées
- Seul l'affichage dans la preview est corrigé
- Aucune migration de données nécessaire
