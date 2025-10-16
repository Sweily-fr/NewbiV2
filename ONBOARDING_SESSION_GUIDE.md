# Guide : Onboarding basé sur les Sessions Better Auth

## Nouvelle logique implémentée

L'onboarding s'affiche maintenant en fonction du **nombre de sessions** de l'utilisateur au lieu de `hasCompletedOnboarding` dans l'organization.

## Conditions d'affichage

L'onboarding apparaît si et seulement si :

1. ✅ **L'utilisateur est connecté** (`session?.user` existe)
2. ✅ **L'utilisateur est OWNER** (`session.user.role === "owner"`)
3. ✅ **C'est la première session** (`sessionCount === 1`)

## Fonctionnement technique

### Récupération du nombre de sessions

```javascript
const { data: sessions } = await authClient.multiSession.listSessions();
const userSessionCount = sessions.length;
```

Better Auth `multiSession.listSessions()` retourne toutes les sessions actives de l'utilisateur connecté.

### Logique de décision

```javascript
if (isOwner && userSessionCount === 1 && !isOnboardingOpen) {
  setIsOnboardingOpen(true);
}
```

### Fermeture de l'onboarding

Lorsque l'utilisateur clique sur "Commencer" ou "Passer" :
- Le modal se ferme simplement
- **Aucune donnée n'est sauvegardée** dans la base de données
- L'onboarding ne s'affichera plus car `sessionCount > 1` lors des prochaines connexions

## Avantages de cette approche

✅ **Automatique** : Pas besoin de gérer un flag `hasCompletedOnboarding`  
✅ **Basé sur l'utilisation réelle** : Première connexion = première session  
✅ **Simple** : Pas de mutation de données, juste une lecture  
✅ **Fiable** : Better Auth gère automatiquement les sessions  
✅ **Multi-device** : Chaque appareil compte comme une session différente

## Comportement attendu

### Scénario 1 : Nouvel utilisateur owner
1. Inscription → Première connexion
2. `sessionCount = 1` → **Onboarding s'affiche** ✅
3. Clique sur "Commencer" → Modal se ferme
4. Reste connecté → `sessionCount = 1` mais `isOnboardingOpen = false`

### Scénario 2 : Utilisateur existant
1. Deuxième connexion (nouveau navigateur/appareil)
2. `sessionCount = 2` → **Onboarding ne s'affiche pas** ❌

### Scénario 3 : Membre invité
1. Connexion en tant que membre (non-owner)
2. `isOwner = false` → **Onboarding ne s'affiche pas** ❌

## Configuration Better Auth requise

Le plugin `multiSessionClient` doit être activé dans `auth-client.js` :

```javascript
import { multiSessionClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    multiSessionClient(), // ✅ Déjà configuré
    // ... autres plugins
  ],
});
```

## API Better Auth utilisée

### `multiSession.listSessions()`

Retourne toutes les sessions actives de l'utilisateur connecté.

**Réponse :**
```javascript
{
  data: [
    {
      id: "session_id_1",
      userId: "user_id",
      expiresAt: "2025-10-23T20:00:00.000Z",
      // ... autres champs
    },
    // ... autres sessions
  ]
}
```

## Nettoyage effectué

Les champs suivants ne sont **plus utilisés** pour l'onboarding :
- ❌ `organization.hasCompletedOnboarding` (peut être supprimé)
- ❌ `organization.onboardingStep` (peut être supprimé)

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

### Test 2 : Multi-sessions
```bash
1. Se connecter sur Chrome
2. Vérifier sessionCount via DevTools
3. Se connecter sur Firefox (même compte)
4. Vérifier que sessionCount = 2
5. Vérifier que l'onboarding ne s'affiche pas
```

### Test 3 : Membre non-owner
```bash
1. Inviter un membre (non-owner)
2. Se connecter avec ce compte
3. Vérifier que l'onboarding ne s'affiche jamais
```

## Debugging

Pour voir le nombre de sessions en temps réel :

```javascript
// Dans le composant
const { sessionCount } = useDashboardLayoutContext();
console.log("Nombre de sessions:", sessionCount);
```

## Migration depuis l'ancienne logique

Si vous aviez des utilisateurs avec `hasCompletedOnboarding = true` :
- ✅ Pas de migration nécessaire
- ✅ La nouvelle logique se base uniquement sur `sessionCount`
- ✅ Les anciens champs peuvent être ignorés ou supprimés

## Notes importantes

⚠️ **Sessions vs Connexions** : Une session = une connexion active. Si l'utilisateur se déconnecte puis se reconnecte, une nouvelle session est créée.

⚠️ **Expiration des sessions** : Better Auth gère automatiquement l'expiration (7 jours par défaut). Les sessions expirées ne sont pas comptées.

⚠️ **Multi-device** : Chaque appareil/navigateur compte comme une session distincte.
