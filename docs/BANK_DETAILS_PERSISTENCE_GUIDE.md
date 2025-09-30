# Guide de Test - Persistance des Coordonnées Bancaires

## Fonctionnalité Implémentée

L'activation et la désactivation de l'affichage des coordonnées bancaires dans les factures sont maintenant sauvegardées dans les paramètres d'organisation. Cela évite de devoir retourner dans les paramètres à chaque création de facture.

## Modifications Apportées

### 1. Hook `use-invoice-editor.js`

**Ligne 148** - Utilisation de la valeur d'organisation :
```javascript
setValue("showBankDetails", organization.showBankDetails || false);
```

**Ligne 425** - Valeur par défaut dans `getInitialFormData` :
```javascript
showBankDetails: organization?.showBankDetails || false,
```

**Lignes 326-348** - Fonction `saveSettingsToOrganization` (déjà existante) :
```javascript
const organizationData = {
  // ... autres paramètres
  showBankDetails: currentFormData.showBankDetails || false,
};
```

### 2. Schéma Better Auth

Le champ `showBankDetails` est déjà défini dans `auth-plugins.js` :
```javascript
showBankDetails: {
  type: "boolean",
  input: true,
  required: false,
}
```

## Test Manuel

### Étape 1 : Créer une nouvelle facture
1. Aller sur `/dashboard/outils/factures`
2. Cliquer sur "Nouvelle facture"
3. Vérifier l'état initial de la checkbox "Afficher les coordonnées bancaires"

### Étape 2 : Modifier les paramètres
1. Cliquer sur l'icône "Paramètres" (engrenage)
2. Cocher/décocher "Afficher les coordonnées bancaires"
3. Cliquer sur "Enregistrer les modifications"
4. Vérifier que le toast de confirmation apparaît

### Étape 3 : Vérifier la persistance
1. Fermer l'éditeur de facture (retour à la liste)
2. Créer une nouvelle facture
3. **Vérifier que l'état de la checkbox correspond au dernier paramétrage**

### Étape 4 : Test avec plusieurs factures
1. Créer une facture avec coordonnées bancaires activées
2. Sauvegarder en brouillon
3. Créer une nouvelle facture
4. **Vérifier que les coordonnées bancaires sont toujours activées par défaut**

## Test Automatisé

Exécuter le script de test :
```bash
cd NewbiV2
node scripts/test-bank-details-persistence.js
```

Ce script vérifie :
- La présence du champ `showBankDetails` dans l'organisation
- La capacité de mise à jour du champ
- La persistance des modifications

## Comportement Attendu

### Avant la Correction
- ❌ `showBankDetails` toujours à `false` par défaut
- ❌ Paramètres non sauvegardés entre les sessions
- ❌ Utilisateur doit reconfigurer à chaque facture

### Après la Correction
- ✅ `showBankDetails` utilise la valeur de l'organisation
- ✅ Paramètres sauvegardés via "Enregistrer les modifications"
- ✅ Nouvelles factures héritent du dernier paramétrage
- ✅ Cohérence entre toutes les factures de l'organisation

## Architecture

```
Création facture → getInitialFormData() → organization.showBankDetails
                                                    ↑
Paramètres UI → "Enregistrer" → saveSettingsToOrganization() → updateOrganization()
```

## Dépannage

### Problème : Paramètres non persistés
1. Vérifier que `organization.showBankDetails` existe en base
2. Vérifier les logs de `saveSettingsToOrganization()`
3. Vérifier que `updateOrganization()` fonctionne

### Problème : Valeur par défaut incorrecte
1. Vérifier que `organization` est bien passé au hook
2. Vérifier les logs de `getInitialFormData()`
3. Vérifier la récupération de l'organisation dans `ModernInvoiceEditor`

## Compatibilité

Cette modification est **rétrocompatible** :
- Les factures existantes ne sont pas affectées
- Les organisations sans `showBankDetails` utilisent `false` par défaut
- Aucune migration de données nécessaire

## Prochaines Étapes

Cette implémentation peut être étendue à d'autres paramètres :
- Couleurs d'apparence par défaut
- Notes d'en-tête/bas de page par défaut
- Conditions générales par défaut
- Méthodes de paiement préférées
