# Guide : Onboarding basé sur le champ User

## Nouvelle logique implémentée

L'onboarding s'affiche maintenant en fonction du champ **`hasSeenOnboarding`** dans la collection `user` de Better Auth.

## Conditions d'affichage

L'onboarding apparaît si et seulement si :

1. ✅ **L'utilisateur est connecté** (`session?.user` existe)
2. ✅ **L'utilisateur est OWNER** (`session.user.role === "owner"`)
3. ✅ **N'a jamais vu l'onboarding** (`session.user.hasSeenOnboarding === false`)

## Fonctionnement technique

### Vérification du champ hasSeenOnboarding

```javascript
const isOwner = session.user.role === "owner";
const hasSeenOnboarding = session.user.hasSeenOnboarding;

if (isOwner && !hasSeenOnboarding && !isOnboardingOpen) {
  setIsOnboardingOpen(true);
}
```

### Fermeture de l'onboarding

Lorsque l'utilisateur clique sur "Commencer" ou "Passer" :
- Le champ `hasSeenOnboarding` est mis à `true` dans la collection `user`
- Le modal se ferme
- L'onboarding ne s'affichera plus jamais pour cet utilisateur

```javascript
await authClient.updateUser({
  hasSeenOnboarding: true,
});
```

## Avantages de cette approche

✅ **Simple** : Un seul champ boolean dans le user  
✅ **Fiable** : Pas de dépendance aux sessions ou organisations  
✅ **Performant** : Lecture directe depuis la session, pas de requête supplémentaire  
✅ **Clair** : Intention explicite (`hasSeenOnboarding`)  
✅ **Persistant** : Indépendant des déconnexions/reconnexions  
✅ **Scalable** : Fonctionne sur tous les appareils

## Comportement attendu

### Scénario 1 : Nouvel utilisateur owner
1. Inscription → Première connexion
2. `hasSeenOnboarding = false` → **Onboarding s'affiche** ✅
3. Clique sur "Commencer" → `hasSeenOnboarding = true`
4. Modal se ferme
5. Plus jamais affiché, même après déconnexion/reconnexion

### Scénario 2 : Utilisateur owner existant
1. Reconnexion (même ou autre appareil)
2. `hasSeenOnboarding = true` → **Onboarding ne s'affiche pas** ❌

### Scénario 3 : Membre invité
1. Connexion en tant que membre (non-owner)
2. `isOwner = false` → **Onboarding ne s'affiche pas** ❌

## Configuration Better Auth requise

Le champ `hasSeenOnboarding` doit être ajouté dans `auth.js` :

```javascript
user: {
  additionalFields: {
    // ... autres champs
    hasSeenOnboarding: {
      type: "boolean",
      required: false,
      defaultValue: false,
    },
  },
},
```

## Champ ajouté dans la collection User

```javascript
{
  _id: ObjectId,
  id: "user_id",
  email: "user@example.com",
  role: "owner",
  hasSeenOnboarding: false, // ← Nouveau champ
  // ... autres champs
}
```

## Tests recommandés

### Test 1 : Première connexion
```bash
1. Créer un nouveau compte owner
2. Vérifier que l'onboarding s'affiche
3. Cliquer sur "Commencer"
4. Vérifier que le modal se ferme
5. Rafraîchir la page
6. Vérifier que l'onboarding ne s'affiche plus
```

### Test 2 : Reconnexion
```bash
1. Se déconnecter
2. Se reconnecter avec le même compte
3. Vérifier que l'onboarding ne s'affiche pas
4. Vérifier que hasSeenOnboarding = true dans la BDD
```

### Test 3 : Membre non-owner
```bash
1. Inviter un membre (non-owner)
2. Se connecter avec ce compte
3. Vérifier que l'onboarding ne s'affiche jamais
```

## Debugging

Pour voir l'état de l'onboarding en temps réel :

```javascript
// Dans le composant
const { shouldShowOnboarding } = useDashboardLayoutContext();
console.log("Devrait afficher onboarding:", shouldShowOnboarding);
console.log("hasSeenOnboarding:", session?.user?.hasSeenOnboarding);
```

## Migration depuis l'ancienne logique

Si vous aviez des utilisateurs existants :
- ⚠️ **Migration requise** : Tous les users existants auront `hasSeenOnboarding = false` par défaut
- 💡 **Solution** : Exécuter un script pour mettre `hasSeenOnboarding = true` pour tous les users existants
- ✅ Les nouveaux users auront automatiquement `hasSeenOnboarding = false`

## Notes importantes

✅ **Persistant** : Le champ reste même après déconnexion/reconnexion

✅ **Multi-device** : Fonctionne sur tous les appareils (synchronisé via la BDD)

✅ **Simple** : Pas de dépendance aux sessions ou organisations
