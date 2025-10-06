# 🧪 Tests de protection des routes

## 🎯 Objectif

Vérifier que toutes les routes sont correctement protégées selon le plan d'abonnement.

---

## ✅ Test 1 : Utilisateur FREE

### Accès autorisés (doivent fonctionner)

```bash
# Pages accessibles
✅ http://localhost:3000/dashboard/outils
✅ http://localhost:3000/dashboard/outils/kanban
✅ http://localhost:3000/dashboard/outils/kanban/new
✅ http://localhost:3000/dashboard/outils/signatures-mail
✅ http://localhost:3000/dashboard/outils/signatures-mail/new
```

**Résultat attendu :**
- Page s'affiche normalement
- Pas de redirection
- Contenu accessible

### Accès refusés (doivent rediriger)

```bash
# Dashboard principal
❌ http://localhost:3000/dashboard
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Factures
❌ http://localhost:3000/dashboard/outils/factures
❌ http://localhost:3000/dashboard/outils/factures/new
❌ http://localhost:3000/dashboard/outils/factures/[id]
❌ http://localhost:3000/dashboard/outils/factures/[id]/editer
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Devis
❌ http://localhost:3000/dashboard/outils/devis
❌ http://localhost:3000/dashboard/outils/devis/new
❌ http://localhost:3000/dashboard/outils/devis/[id]/editer
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Gestion des dépenses
❌ http://localhost:3000/dashboard/outils/gestion-depenses
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Transferts de fichiers
❌ http://localhost:3000/dashboard/outils/transferts-fichiers
❌ http://localhost:3000/dashboard/outils/transferts-fichiers/new
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Clients
❌ http://localhost:3000/dashboard/clients
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Catalogues
❌ http://localhost:3000/dashboard/catalogues
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre

# Collaborateurs
❌ http://localhost:3000/dashboard/collaborateurs
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing s'ouvre
```

**Résultat attendu :**
- Skeleton affiché pendant 300ms
- Redirection automatique vers `/dashboard/outils?access=restricted`
- Modal de pricing s'ouvre automatiquement
- Message "Fonctionnalité Premium"

---

## ✅ Test 2 : Utilisateur PRO (Trial)

### Accès autorisés (doivent fonctionner)

```bash
# Toutes les routes sauf catalogues
✅ http://localhost:3000/dashboard
✅ http://localhost:3000/dashboard/outils
✅ http://localhost:3000/dashboard/outils/factures
✅ http://localhost:3000/dashboard/outils/factures/new
✅ http://localhost:3000/dashboard/outils/devis
✅ http://localhost:3000/dashboard/outils/devis/new
✅ http://localhost:3000/dashboard/outils/gestion-depenses
✅ http://localhost:3000/dashboard/outils/transferts-fichiers
✅ http://localhost:3000/dashboard/outils/kanban
✅ http://localhost:3000/dashboard/outils/signatures-mail
✅ http://localhost:3000/dashboard/clients
✅ http://localhost:3000/dashboard/collaborateurs
```

**Résultat attendu :**
- Page s'affiche normalement
- Bannière "X jours restants" affichée (si < 14 jours)
- Pas de redirection
- Logs console : `accessGranted: true`

### Accès refusés (doivent rediriger)

```bash
# Catalogues (nécessite abonnement payant)
❌ http://localhost:3000/dashboard/catalogues
→ Redirige vers /dashboard/outils?access=restricted
→ Modal pricing avec message "Abonnement payant requis"
```

**Résultat attendu :**
- Redirection automatique
- Modal avec message spécifique pour abonnement payant
- Logs console : `requirePaidSubscription: true, isPaidSubscription: false`

---

## ✅ Test 3 : Utilisateur PRO (Payant)

### Accès autorisés (doivent fonctionner)

```bash
# Toutes les routes sans exception
✅ http://localhost:3000/dashboard
✅ http://localhost:3000/dashboard/outils
✅ http://localhost:3000/dashboard/outils/factures
✅ http://localhost:3000/dashboard/outils/factures/new
✅ http://localhost:3000/dashboard/outils/devis
✅ http://localhost:3000/dashboard/outils/devis/new
✅ http://localhost:3000/dashboard/outils/gestion-depenses
✅ http://localhost:3000/dashboard/outils/transferts-fichiers
✅ http://localhost:3000/dashboard/outils/kanban
✅ http://localhost:3000/dashboard/outils/signatures-mail
✅ http://localhost:3000/dashboard/clients
✅ http://localhost:3000/dashboard/catalogues
✅ http://localhost:3000/dashboard/collaborateurs
```

**Résultat attendu :**
- Toutes les pages s'affichent normalement
- Pas de bannière d'information
- Pas de redirection
- Logs console : `accessGranted: true, isPaidSubscription: true`

---

## 🔄 Test 4 : Rechargement de page

### Pour chaque type d'utilisateur

**Procédure :**
1. Accéder à une route autorisée
2. Attendre le chargement complet
3. Recharger la page (F5 ou Cmd+R)
4. Observer le comportement

**Résultat attendu :**
- ✅ Skeleton affiché pendant ~300ms
- ✅ Pas de redirection intempestive
- ✅ Contenu s'affiche correctement
- ✅ Pas de flash de contenu non autorisé
- ✅ Logs console cohérents

---

## 🎨 Test 5 : Interface utilisateur

### Page /dashboard/outils

**Utilisateur FREE :**
- ✅ Cartes Kanban et Signatures de mail : Bouton "Accéder"
- ✅ Autres cartes : Bouton "Passer Pro" (orange)
- ✅ Clic sur "Passer Pro" : Modal pricing s'ouvre

**Utilisateur PRO (Trial) :**
- ✅ Toutes les cartes : Bouton "Accéder"
- ✅ Bannière bleue : "X jours restants"
- ✅ Clic sur carte Catalogues : Bouton "Passer Pro" (abonnement payant requis)

**Utilisateur PRO (Payant) :**
- ✅ Toutes les cartes : Bouton "Accéder"
- ✅ Pas de bannière
- ✅ Accès complet à tout

---

## 📊 Logs de débogage

### Logs à vérifier dans la console

```javascript
// Au chargement d'une page protégée
[ProRouteGuard] Factures {
  hasActiveSubscription: boolean,
  isPaidSubscription: boolean,
  requirePaidSubscription: boolean,
  accessGranted: boolean,
  subscriptionStatus: string,
  trialActive: boolean,
  trialDaysRemaining: number
}

// Si accès refusé
[ProRouteGuard] Factures - Accès refusé - Redirection vers /dashboard/outils

// Si accès autorisé
[ProRouteGuard] Factures - Accès autorisé
```

---

## 🚨 Problèmes potentiels et solutions

### Problème 1 : Redirection en boucle

**Symptôme :** La page redirige continuellement.

**Solution :**
```javascript
// Vérifier que hasRedirectedRef fonctionne
const hasRedirectedRef = useRef(false);
// Doit empêcher les redirections multiples
```

### Problème 2 : Modal ne s'ouvre pas

**Symptôme :** Redirection vers /dashboard/outils mais pas de modal.

**Solution :**
```javascript
// Vérifier dans /dashboard/outils/page.jsx
const shouldOpenPricing = 
  (searchParams.get("pricing") === "true" && !isActive()) ||
  (searchParams.get("access") === "restricted" && !isActive());
```

### Problème 3 : Skeleton ne s'affiche pas

**Symptôme :** Contenu s'affiche directement sans skeleton.

**Solution :**
```javascript
// Vérifier la condition dans ProRouteGuard
if (isChecking || loading || !hasInitialized) {
  return <Skeleton />; // Doit s'afficher
}
```

### Problème 4 : Utilisateur PRO redirigé

**Symptôme :** Utilisateur avec abonnement actif est redirigé.

**Solution :**
```javascript
// Vérifier dans la console
console.log({
  subscription: subscription?.status,
  isActive: isActive(),
  trial: trial?.isTrialActive
});
// L'un des trois doit être true
```

---

## ✅ Checklist finale

Avant de considérer les tests terminés :

- [ ] Tous les tests utilisateur FREE passent
- [ ] Tous les tests utilisateur PRO Trial passent
- [ ] Tous les tests utilisateur PRO Payant passent
- [ ] Rechargement de page fonctionne sans redirection
- [ ] Modal pricing s'ouvre automatiquement sur accès refusé
- [ ] Skeleton s'affiche pendant la vérification
- [ ] Logs console sont cohérents
- [ ] Pas de flash de contenu non autorisé
- [ ] Bannières d'information s'affichent correctement
- [ ] Navigation entre pages fluide

---

## 🎉 Validation

Une fois tous les tests passés, le système de protection des routes est **100% fonctionnel** et prêt pour la production !

**Points clés validés :**
- ✅ Protection complète des routes PRO
- ✅ Accès FREE aux outils de base
- ✅ Redirections intelligentes avec modal
- ✅ Pas de redirections intempestives
- ✅ UX optimale avec skeleton et bannières
