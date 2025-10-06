# 🔄 Guide de migration vers le nouveau système de contrôle d'accès

## 📋 Vue d'ensemble

Ce guide vous aidera à migrer vos pages existantes vers le nouveau système de contrôle d'accès amélioré.

---

## 🎯 Objectifs de la migration

- ✅ Éliminer les redirections intempestives
- ✅ Améliorer l'expérience utilisateur
- ✅ Centraliser la logique d'accès
- ✅ Ajouter des messages d'erreur clairs

---

## 📊 Statut de migration

### ✅ Pages déjà migrées

- [x] `/dashboard` - ProRouteGuard amélioré
- [x] `/dashboard/outils/factures` - ProRouteGuard amélioré
- [x] `/dashboard/outils/devis` - ProRouteGuard amélioré
- [x] `/dashboard/outils/gestion-depenses` - ProRouteGuard amélioré
- [x] `/dashboard/outils/transferts-fichiers` - ProRouteGuard réactivé
- [x] `/dashboard/clients` - ProRouteGuard amélioré
- [x] `/dashboard/catalogues` - ProRouteGuard avec requirePaidSubscription
- [x] `/dashboard/collaborateurs` - ProRouteGuard amélioré

### ⏳ Pages à migrer (si nécessaire)

- [ ] Autres pages personnalisées
- [ ] Composants avec vérification d'accès manuelle
- [ ] Modals avec restrictions

---

## 🔧 Migration étape par étape

### Étape 1 : Pages avec ProRouteGuard simple

**Avant :**
```jsx
// Ancien ProRouteGuard (avec problèmes de redirection)
export default function MaPage() {
  return (
    <ProRouteGuard pageName="Ma Page">
      <MonContenu />
    </ProRouteGuard>
  );
}
```

**Après :**
```jsx
// Nouveau ProRouteGuard (amélioré)
// Aucun changement nécessaire ! Le composant a été amélioré en interne
export default function MaPage() {
  return (
    <ProRouteGuard pageName="Ma Page">
      <MonContenu />
    </ProRouteGuard>
  );
}
```

**✅ Action requise :** Aucune ! Le composant a été amélioré automatiquement.

---

### Étape 2 : Pages nécessitant un abonnement payant

**Avant :**
```jsx
// Vérification manuelle dans le composant
function CataloguesContent() {
  const { subscription } = useSubscription();
  
  if (subscription?.status !== "active") {
    return <div>Abonnement payant requis</div>;
  }
  
  return <MonContenu />;
}
```

**Après :**
```jsx
// Utiliser requirePaidSubscription
export default function CataloguesPage() {
  return (
    <ProRouteGuard pageName="Catalogues" requirePaidSubscription={true}>
      <CataloguesContent />
    </ProRouteGuard>
  );
}
```

**✅ Action requise :** Ajouter `requirePaidSubscription={true}` au ProRouteGuard.

---

### Étape 3 : Composants avec vérification manuelle

**Avant :**
```jsx
function MonComposant() {
  const { isActive } = useSubscription();
  
  if (!isActive()) {
    return <div>Accès refusé</div>;
  }
  
  return <MonContenu />;
}
```

**Après (Option 1 - Recommandée) :**
```jsx
import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { AccessDeniedCard } from "@/src/components/access-denied-card";

function MonComposant() {
  const { hasAccess, reason, loading } = useFeatureAccess("ma-fonctionnalite");
  
  if (loading) return <Skeleton />;
  
  if (!hasAccess) {
    return <AccessDeniedCard reason={reason} featureName="Ma Fonctionnalité" />;
  }
  
  return <MonContenu />;
}
```

**Après (Option 2 - Simple) :**
```jsx
// Entourer la page avec ProRouteGuard
export default function MaPage() {
  return (
    <ProRouteGuard pageName="Ma Page">
      <MonComposant />
    </ProRouteGuard>
  );
}
```

**✅ Action requise :** Choisir l'option selon vos besoins.

---

### Étape 4 : Ajouter des bannières d'information

**Avant :**
```jsx
function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <MonContenu />
    </div>
  );
}
```

**Après :**
```jsx
import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { FeatureAccessBanner } from "@/src/components/feature-access-banner";

function Dashboard() {
  const { subscriptionInfo } = useFeatureAccess("dashboard");
  
  return (
    <div>
      <FeatureAccessBanner subscriptionInfo={subscriptionInfo} />
      <h1>Dashboard</h1>
      <MonContenu />
    </div>
  );
}
```

**✅ Action requise :** Ajouter la bannière dans les pages principales.

---

### Étape 5 : Configurer une nouvelle fonctionnalité

**Fichier :** `/src/hooks/useFeatureAccess.js`

```javascript
const featureConfig = {
  // ... fonctionnalités existantes
  
  // Ajouter votre nouvelle fonctionnalité
  "ma-nouvelle-fonctionnalite": {
    requiresPro: true,                    // Nécessite un abonnement Pro
    requiresCompanyInfo: false,           // Nécessite les infos d'entreprise
    requiresPaidSubscription: false,      // Nécessite un abonnement payant (pas de trial)
  },
};
```

**✅ Action requise :** Ajouter la configuration de votre fonctionnalité.

---

## 🔍 Checklist de migration par page

Pour chaque page à migrer :

- [ ] **Identifier le type de protection**
  - [ ] Pro (trial accepté)
  - [ ] Pro payant uniquement
  - [ ] Informations d'entreprise requises

- [ ] **Choisir l'approche**
  - [ ] ProRouteGuard (protection de route)
  - [ ] useFeatureAccess (vérification dans le composant)
  - [ ] Les deux (protection + bannière)

- [ ] **Implémenter les changements**
  - [ ] Ajouter/modifier ProRouteGuard
  - [ ] Ajouter useFeatureAccess si nécessaire
  - [ ] Ajouter AccessDeniedCard si nécessaire
  - [ ] Ajouter FeatureAccessBanner si nécessaire

- [ ] **Configurer la fonctionnalité**
  - [ ] Ajouter dans featureConfig
  - [ ] Définir les restrictions

- [ ] **Tester**
  - [ ] Utilisateur Free
  - [ ] Utilisateur Trial
  - [ ] Utilisateur Pro payant
  - [ ] Rechargement de page
  - [ ] Messages d'erreur

---

## 📝 Exemples de migration complets

### Exemple 1 : Page simple

**Avant :**
```jsx
// app/dashboard/outils/factures/page.jsx
"use client";

function FacturesContent() {
  const { isActive } = useSubscription();
  
  if (!isActive()) {
    return <div>Abonnement Pro requis</div>;
  }
  
  return <div>Mes factures</div>;
}

export default function FacturesPage() {
  return <FacturesContent />;
}
```

**Après :**
```jsx
// app/dashboard/outils/factures/page.jsx
"use client";

import { ProRouteGuard } from "@/src/components/pro-route-guard";

function FacturesContent() {
  return <div>Mes factures</div>;
}

export default function FacturesPage() {
  return (
    <ProRouteGuard pageName="Factures">
      <FacturesContent />
    </ProRouteGuard>
  );
}
```

---

### Exemple 2 : Page avec bannière

**Avant :**
```jsx
// app/dashboard/page.jsx
"use client";

function DashboardContent() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenue</p>
    </div>
  );
}

export default function Dashboard() {
  return <DashboardContent />;
}
```

**Après :**
```jsx
// app/dashboard/page.jsx
"use client";

import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { FeatureAccessBanner } from "@/src/components/feature-access-banner";

function DashboardContent() {
  const { subscriptionInfo } = useFeatureAccess("dashboard");
  
  return (
    <div>
      <FeatureAccessBanner subscriptionInfo={subscriptionInfo} />
      <h1>Dashboard</h1>
      <p>Bienvenue</p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProRouteGuard pageName="Tableau de bord">
      <DashboardContent />
    </ProRouteGuard>
  );
}
```

---

### Exemple 3 : Composant avec message personnalisé

**Avant :**
```jsx
// components/invoice-button.jsx
"use client";

function InvoiceButton() {
  const { isActive } = useSubscription();
  
  if (!isActive()) {
    return <Button disabled>Pro requis</Button>;
  }
  
  return <Button>Créer une facture</Button>;
}
```

**Après :**
```jsx
// components/invoice-button.jsx
"use client";

import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { Crown } from "lucide-react";

function InvoiceButton() {
  const { hasAccess } = useFeatureAccess("factures");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  
  if (!hasAccess) {
    return (
      <>
        <Button 
          variant="outline"
          onClick={() => setIsPricingModalOpen(true)}
        >
          <Crown className="mr-2 h-4 w-4" />
          Passer Pro pour créer des factures
        </Button>
        <PricingModal 
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </>
    );
  }
  
  return <Button>Créer une facture</Button>;
}
```

---

## 🐛 Problèmes courants et solutions

### Problème 1 : Redirections multiples

**Symptôme :** La page redirige en boucle.

**Solution :**
```jsx
// Le nouveau ProRouteGuard gère cela automatiquement avec hasRedirectedRef
// Aucune action nécessaire
```

---

### Problème 2 : Flash de contenu non autorisé

**Symptôme :** Le contenu s'affiche brièvement avant la redirection.

**Solution :**
```jsx
// Le nouveau ProRouteGuard affiche un skeleton pendant la vérification
// Aucune action nécessaire
```

---

### Problème 3 : Fonctionnalité non reconnue

**Symptôme :** `useFeatureAccess` retourne `hasAccess: false` avec `reason: "unknown_feature"`.

**Solution :**
```javascript
// Ajouter la fonctionnalité dans featureConfig
const featureConfig = {
  "ma-fonctionnalite": {
    requiresPro: true,
    requiresCompanyInfo: false,
    requiresPaidSubscription: false,
  },
};
```

---

### Problème 4 : Trial non accepté pour une fonctionnalité

**Symptôme :** Les utilisateurs en trial ne peuvent pas accéder.

**Solution :**
```jsx
// Utiliser requirePaidSubscription={true}
<ProRouteGuard pageName="Ma Page" requirePaidSubscription={true}>
  <MonContenu />
</ProRouteGuard>
```

---

## ✅ Validation de la migration

Après la migration, vérifier :

1. **Pas de redirections intempestives**
   - [ ] Rechargement de page → Pas de redirection
   - [ ] Navigation entre pages → Fluide

2. **Messages d'erreur appropriés**
   - [ ] Utilisateur Free → Message "Passer Pro"
   - [ ] Trial sur fonctionnalité payante → Message "Abonnement payant requis"
   - [ ] Infos entreprise manquantes → Message "Compléter profil"

3. **Skeleton pendant le chargement**
   - [ ] Skeleton affiché pendant la vérification
   - [ ] Pas de flash de contenu

4. **Bannières d'information**
   - [ ] Bannière trial affichée correctement
   - [ ] Bannière masquée pour utilisateurs payants
   - [ ] Bouton d'upgrade fonctionnel

5. **Logs de débogage**
   - [ ] Logs `[ProRouteGuard]` dans la console
   - [ ] Informations détaillées sur l'accès

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Consulter la documentation**
   - `FEATURE_ACCESS_GUIDE.md`
   - `EXEMPLE_UTILISATION.md`
   - `AMELIORATIONS_SYSTEME_ACCES.md`

2. **Vérifier les logs**
   - Console : `[ProRouteGuard]`
   - Tester manuellement : `useFeatureAccess("nom-fonctionnalite")`

3. **Vérifier la configuration**
   - `/src/hooks/useFeatureAccess.js`
   - Fonctionnalité bien configurée ?

---

## 🎉 Conclusion

La migration est simple et apporte de nombreux avantages :
- ✅ Meilleure expérience utilisateur
- ✅ Code plus maintenable
- ✅ Messages d'erreur clairs
- ✅ Bannières d'information
- ✅ Pas de redirections intempestives

**Temps estimé de migration par page :** 5-10 minutes

**Bénéfices immédiats :**
- Élimination des redirections intempestives
- Meilleure UX pendant le chargement
- Messages d'erreur plus clairs
