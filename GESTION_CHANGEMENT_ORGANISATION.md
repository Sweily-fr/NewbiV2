# 🔄 Gestion des changements d'organisation

## 🎯 Problème résolu

Quand un utilisateur change d'organisation alors qu'il est sur une page de détail (ex: `/dashboard/outils/kanban/68e386bde84bd34ddc2cfa1e`), l'ID de la ressource n'existe pas dans la nouvelle organisation, ce qui causait une **page blanche**.

---

## ✅ Solution implémentée

### 1. **Hook `useOrganizationChange`**

Hook intelligent qui détecte les changements d'organisation et redirige automatiquement vers la liste appropriée.

**Fichier :** `/src/hooks/useOrganizationChange.js`

**Fonctionnalités :**
- ✅ Détecte les changements d'organisation via Better Auth
- ✅ Compare l'ID d'organisation précédent avec l'actuel
- ✅ Redirige automatiquement vers la liste si la ressource n'existe plus
- ✅ Logs détaillés pour le débogage

**Utilisation :**
```javascript
import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";

useOrganizationChange({
  resourceId: "68e386bde84bd34ddc2cfa1e",
  resourceExists: !!board && !error,
  listUrl: "/dashboard/outils/kanban",
  enabled: !loading,
});
```

### 2. **Composant `ResourceNotFound`**

Composant élégant pour afficher un message quand une ressource n'existe pas.

**Fichier :** `/src/components/resource-not-found.jsx`

**Fonctionnalités :**
- ✅ Message clair et informatif
- ✅ Explication du contexte (changement d'organisation)
- ✅ Conseils pour l'utilisateur
- ✅ Boutons d'action (retour liste, retour outils)
- ✅ Design cohérent avec l'interface

**Utilisation :**
```javascript
import { ResourceNotFound } from "@/src/components/resource-not-found";

if (!loading && !board && !error) {
  return (
    <ResourceNotFound
      resourceType="tableau"
      resourceName="Ce tableau Kanban"
      listUrl="/dashboard/outils/kanban"
      homeUrl="/dashboard/outils"
    />
  );
}
```

---

## 📋 Pages modifiées

### Kanban

**`/dashboard/outils/kanban/[id]/page.jsx`**
- ✅ Hook `useOrganizationChange` ajouté
- ✅ Composant `ResourceNotFound` pour les tableaux inexistants
- ✅ Redirection automatique vers `/dashboard/outils/kanban`

### Factures

**`/dashboard/outils/factures/[id]/page.jsx`**
- ✅ Hook `useOrganizationChange` ajouté
- ✅ Composant `ResourceNotFound` pour les factures inexistantes
- ✅ Redirection automatique vers `/dashboard/outils/factures`

**`/dashboard/outils/factures/components/modern-invoice-editor.jsx`**
- ✅ Détection des factures inexistantes en mode edit
- ✅ Affichage du composant `ResourceNotFound`
- ✅ Hook retourne maintenant `invoice` et `error`

**`/dashboard/outils/factures/hooks/use-invoice-editor.js`**
- ✅ Retour de `invoice` et `error` dans le hook
- ✅ Détection automatique des ressources inexistantes

### Devis

**`/dashboard/outils/devis/components/modern-quote-editor.jsx`**
- ✅ Hook `useOrganizationChange` ajouté
- ✅ Composant `ResourceNotFound` pour les devis inexistants
- ✅ Redirection automatique vers `/dashboard/outils/devis`

**`/dashboard/outils/devis/hooks/use-quote-editor.js`**
- ✅ Retour de `quote` et `error` dans le hook
- ✅ Détection automatique des ressources inexistantes

---

## 🔄 Flux utilisateur

### Scénario : Changement d'organisation sur une page de détail

```
1. Utilisateur sur /dashboard/outils/kanban/68e386bde84bd34ddc2cfa1e
   Organisation A (ID: org-123)
   
2. Utilisateur change d'organisation via TeamSwitcher
   Organisation B (ID: org-456)
   
3. Hook useOrganizationChange détecte le changement
   previousOrgId: org-123
   currentOrgId: org-456
   
4. Vérification : board existe dans org-456 ?
   resourceExists: false
   
5. Redirection automatique
   → /dashboard/outils/kanban
   
6. Utilisateur voit la liste des tableaux de l'organisation B
```

### Scénario : Accès direct à une ressource inexistante

```
1. Utilisateur tape manuellement une URL
   /dashboard/outils/factures/999999
   
2. Query GraphQL : facture 999999 n'existe pas
   invoice: null
   error: true
   
3. Composant ResourceNotFound s'affiche
   Message : "Cette facture n'existe pas ou n'est pas accessible"
   
4. Utilisateur clique "Retour à la liste"
   → /dashboard/outils/factures
```

---

## 🎨 Interface ResourceNotFound

### Éléments affichés

```
┌─────────────────────────────────────┐
│         🟠 (Icône AlertCircle)      │
│                                     │
│    Ce tableau Kanban introuvable    │
│                                     │
│  Ce tableau n'existe pas ou n'est   │
│  pas accessible dans cette          │
│  organisation.                      │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 💡 Astuce :                   │  │
│  │ Vous avez peut-être changé    │  │
│  │ d'organisation. Les données   │  │
│  │ sont isolées par organisation │  │
│  │ pour votre sécurité.          │  │
│  └───────────────────────────────┘  │
│                                     │
│  Que faire ?                        │
│  • Vérifiez que vous êtes dans la   │
│    bonne organisation               │
│  • Retournez à la liste pour voir   │
│    les tableaux disponibles         │
│  • Créez un nouveau tableau si      │
│    nécessaire                       │
│                                     │
│  [← Retour à la liste des tableaux] │
│  [🏠 Retour aux outils]             │
└─────────────────────────────────────┘
```

---

## 🔧 Implémentation technique

### Hook useOrganizationChange

```javascript
export function useOrganizationChange({ 
  resourceId,        // ID de la ressource actuelle
  resourceExists,    // boolean - la ressource existe-t-elle ?
  listUrl,          // URL de la liste à rediriger
  enabled = true    // Activer/désactiver le hook
}) {
  const { data: activeOrganization } = authClient.useActiveOrganization();
  const previousOrgIdRef = useRef(activeOrganization?.id);

  useEffect(() => {
    const currentOrgId = activeOrganization.id;
    const previousOrgId = previousOrgIdRef.current;

    // Changement d'organisation détecté
    if (previousOrgId && previousOrgId !== currentOrgId) {
      // Si ressource n'existe pas, rediriger
      if (resourceId && resourceExists === false) {
        router.push(listUrl);
      }
    }

    previousOrgIdRef.current = currentOrgId;
  }, [activeOrganization?.id, resourceId, resourceExists, listUrl]);
}
```

### Composant ResourceNotFound

```javascript
export function ResourceNotFound({ 
  resourceType = "ressource",
  resourceName = "cette ressource",
  listUrl,
  homeUrl = "/dashboard/outils",
  message,
}) {
  return (
    <Card>
      <CardHeader>
        <AlertCircle /> {/* Icône orange */}
        <CardTitle>{resourceName} introuvable</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Astuce sur le changement d'organisation */}
        {/* Conseils pour l'utilisateur */}
      </CardContent>
      
      <CardFooter>
        <Button onClick={() => router.push(listUrl)}>
          Retour à la liste
        </Button>
        <Button variant="outline" onClick={() => router.push(homeUrl)}>
          Retour aux outils
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

## 📊 Ressources supportées

| Ressource | Page de détail | Liste | Hook ajouté | Composant ajouté |
|-----------|---------------|-------|-------------|------------------|
| **Kanban** | `/kanban/[id]` | `/kanban` | ✅ | ✅ |
| **Factures** | `/factures/[id]` | `/factures` | ✅ | ✅ |
| **Factures (edit)** | `/factures/[id]/editer` | `/factures` | ✅ | ✅ |
| **Avoirs** | `/factures/[id]/avoir/[creditNoteId]` | `/factures` | ⏳ | ⏳ |
| **Devis** | `/devis/[id]/editer` | `/devis` | ✅ | ✅ |

---

## 🧪 Tests à effectuer

### Test 1 : Changement d'organisation sur Kanban

```bash
1. Se connecter avec Organisation A
2. Créer un tableau Kanban
3. Accéder au tableau : /dashboard/outils/kanban/[id]
4. Changer d'organisation vers Organisation B (via TeamSwitcher)
5. Observer le comportement

✅ Résultat attendu :
- Redirection automatique vers /dashboard/outils/kanban
- Liste des tableaux de l'Organisation B affichée
- Pas de page blanche
- Logs console : "[useOrganizationChange] Changement d'organisation détecté"
```

### Test 2 : Accès direct à une ressource inexistante

```bash
1. Se connecter avec Organisation A
2. Taper manuellement : /dashboard/outils/factures/999999
3. Observer le comportement

✅ Résultat attendu :
- Composant ResourceNotFound affiché
- Message : "Cette facture n'existe pas ou n'est pas accessible"
- Bouton "Retour à la liste des factures"
- Bouton "Retour aux outils"
```

### Test 3 : Édition d'une facture après changement d'organisation

```bash
1. Se connecter avec Organisation A
2. Créer une facture
3. Accéder à l'édition : /dashboard/outils/factures/[id]/editer
4. Changer d'organisation vers Organisation B
5. Observer le comportement

✅ Résultat attendu :
- Redirection automatique vers /dashboard/outils/factures
- Liste des factures de l'Organisation B affichée
- Pas d'erreur dans la console
```

---

## 🎨 Améliorations UX

### Avant

```
Changement d'organisation
  ↓
Page blanche 😞
  ↓
Confusion de l'utilisateur
  ↓
Retour manuel nécessaire
```

### Après

```
Changement d'organisation
  ↓
Détection automatique 🔍
  ↓
Redirection intelligente ➡️
  ↓
Liste de la nouvelle organisation 📋
  ↓
Utilisateur peut continuer son travail ✅
```

**OU**

```
Ressource inexistante
  ↓
Message clair et informatif 💬
  ↓
Explication du contexte 📖
  ↓
Actions proposées 🎯
  ↓
Utilisateur comprend et agit ✅
```

---

## 🔍 Logs de débogage

### Hook useOrganizationChange

```javascript
[useOrganizationChange] Changement d'organisation détecté {
  previousOrgId: "68a977bb650c98cdffe1a9fc",
  currentOrgId: "68932751626f06764f62ca2e",
  resourceId: "68e386bde84bd34ddc2cfa1e",
  resourceExists: false,
  pathname: "/dashboard/outils/kanban/68e386bde84bd34ddc2cfa1e"
}

[useOrganizationChange] Ressource inexistante - Redirection vers /dashboard/outils/kanban
```

---

## 📊 Statistiques d'amélioration

| Métrique | Avant | Après |
|----------|-------|-------|
| **Page blanche** | ❌ Oui | ✅ Non |
| **Message d'erreur** | ❌ Aucun | ✅ Clair |
| **Redirection automatique** | ❌ Non | ✅ Oui |
| **Explication contexte** | ❌ Non | ✅ Oui |
| **Actions proposées** | ❌ Non | ✅ Oui |
| **Confusion utilisateur** | 😞 Élevée | 😊 Faible |

---

## 🚀 Prochaines étapes possibles

### Court terme

1. **Ajouter sur d'autres ressources**
   - [ ] Avoirs (`/factures/[id]/avoir/[creditNoteId]`)
   - [ ] Transferts de fichiers (`/transferts-fichiers/[id]`)
   - [ ] Signatures de mail (`/signatures-mail/[id]`)

2. **Améliorer les messages**
   - [ ] Messages personnalisés par type de ressource
   - [ ] Suggestions intelligentes (créer une nouvelle ressource)
   - [ ] Liens vers la documentation

### Moyen terme

1. **Analytics**
   - [ ] Tracker les changements d'organisation
   - [ ] Mesurer la fréquence des ressources inexistantes
   - [ ] Identifier les patterns de navigation

2. **Optimisations**
   - [ ] Cache des ressources récentes
   - [ ] Préchargement des listes
   - [ ] Suggestions de ressources similaires

### Long terme

1. **Fonctionnalités avancées**
   - [ ] Historique de navigation par organisation
   - [ ] Favoris multi-organisations
   - [ ] Recherche globale inter-organisations

---

## ✅ Checklist d'implémentation

Pour ajouter la gestion sur une nouvelle ressource :

- [ ] **Importer les dépendances**
  ```javascript
  import { useOrganizationChange } from "@/src/hooks/useOrganizationChange";
  import { ResourceNotFound } from "@/src/components/resource-not-found";
  ```

- [ ] **Ajouter le hook dans le composant**
  ```javascript
  useOrganizationChange({
    resourceId: id,
    resourceExists: !!resource && !error,
    listUrl: "/dashboard/outils/ma-ressource",
    enabled: !loading,
  });
  ```

- [ ] **Ajouter la condition d'affichage**
  ```javascript
  if (!loading && !resource && !error) {
    return (
      <ResourceNotFound
        resourceType="ma ressource"
        resourceName="Cette ressource"
        listUrl="/dashboard/outils/ma-ressource"
        homeUrl="/dashboard/outils"
      />
    );
  }
  ```

- [ ] **Tester les scénarios**
  - [ ] Changement d'organisation
  - [ ] Accès direct à une ressource inexistante
  - [ ] Rechargement de page

---

## 🎉 Résultat final

**L'utilisateur ne voit plus jamais de page blanche !**

Quand il change d'organisation :
- ✅ Redirection automatique vers la liste appropriée
- ✅ Message clair si accès direct à une ressource inexistante
- ✅ Explication du contexte (isolation des données)
- ✅ Actions proposées pour continuer
- ✅ Expérience fluide et professionnelle

**Le système est maintenant robuste et user-friendly ! 🚀**
