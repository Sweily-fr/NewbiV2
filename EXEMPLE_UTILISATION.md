# Exemples d'utilisation du système de contrôle d'accès

## Exemple 1 : Page simple avec ProRouteGuard

```jsx
// app/dashboard/outils/factures/page.jsx
"use client";

import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { Button } from "@/src/components/ui/button";

function FacturesContent() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Factures</h1>
      <Button>Créer une facture</Button>
    </div>
  );
}

export default function FacturesPage() {
  return (
    <ProRouteGuard pageName="Factures">
      <FacturesContent />
    </ProRouteGuard>
  );
}
```

## Exemple 2 : Page avec vérification manuelle et message personnalisé

```jsx
// app/dashboard/outils/catalogues/page.jsx
"use client";

import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { AccessDeniedCard } from "@/src/components/access-denied-card";
import { FeatureAccessBanner } from "@/src/components/feature-access-banner";
import { Skeleton } from "@/src/components/ui/skeleton";

function CataloguesContent() {
  const {
    hasAccess,
    reason,
    loading,
    subscriptionInfo,
  } = useFeatureAccess("catalogues");

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <AccessDeniedCard
        reason={reason}
        featureName="Catalogues"
      />
    );
  }

  return (
    <div className="p-6">
      <FeatureAccessBanner subscriptionInfo={subscriptionInfo} />
      
      <h1 className="text-2xl font-bold mb-4">Catalogues</h1>
      <p>Gérez vos produits et services</p>
    </div>
  );
}

export default function CataloguesPage() {
  return <CataloguesContent />;
}
```

## Exemple 3 : Composant avec vérification conditionnelle

```jsx
// components/invoice-actions.jsx
"use client";

import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { Button } from "@/src/components/ui/button";
import { Crown } from "lucide-react";
import { useState } from "react";
import { PricingModal } from "@/src/components/pricing-modal";

export function InvoiceActions() {
  const { hasAccess, subscriptionInfo } = useFeatureAccess("factures");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  if (!hasAccess) {
    return (
      <>
        <Button
          variant="outline"
          className="border-orange-500 text-orange-600"
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

  return (
    <div className="space-y-2">
      {subscriptionInfo.isTrial && (
        <p className="text-sm text-orange-600">
          Période d'essai : {subscriptionInfo.daysRemaining} jours restants
        </p>
      )}
      <Button>Créer une facture</Button>
    </div>
  );
}
```

## Exemple 4 : Section de carte avec badge Pro

```jsx
// components/feature-card.jsx
"use client";

import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Crown, Lock } from "lucide-react";
import Link from "next/link";

export function FeatureCard({ featureName, title, description, href }) {
  const { hasAccess, reason, getAccessMessage } = useFeatureAccess(featureName);

  const accessMessage = !hasAccess ? getAccessMessage() : null;

  return (
    <Card className={!hasAccess ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {!hasAccess && (
            <Badge variant="outline" className="border-orange-500 text-orange-600">
              <Crown className="mr-1 h-3 w-3" />
              Pro
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
        
        {!hasAccess && accessMessage && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  {accessMessage.title}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  {accessMessage.description}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {hasAccess && (
          <Link href={href}>
            <Button className="mt-4 w-full">Accéder</Button>
          </Link>
        )}
      </CardHeader>
    </Card>
  );
}
```

## Exemple 5 : Dashboard avec bannière d'abonnement

```jsx
// app/dashboard/page.jsx
"use client";

import { ProRouteGuard } from "@/src/components/pro-route-guard";
import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { FeatureAccessBanner } from "@/src/components/feature-access-banner";
import { useState } from "react";
import { PricingModal } from "@/src/components/pricing-modal";

function DashboardContent() {
  const { subscriptionInfo } = useFeatureAccess("dashboard");
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  return (
    <div className="p-6">
      <FeatureAccessBanner
        subscriptionInfo={subscriptionInfo}
        onUpgrade={() => setIsPricingModalOpen(true)}
      />

      <h1 className="text-3xl font-bold mb-6">Tableau de bord</h1>
      
      {/* Contenu du dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistiques, graphiques, etc. */}
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
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

## Exemple 6 : Hook personnalisé pour une fonctionnalité spécifique

```jsx
// hooks/useInvoiceAccess.js
"use client";

import { useFeatureAccess } from "@/src/hooks/useFeatureAccess";
import { useSession } from "@/src/lib/auth-client";
import { isCompanyInfoComplete } from "@/src/hooks/useCompanyInfoGuard";

export function useInvoiceAccess() {
  const { data: session } = useSession();
  const featureAccess = useFeatureAccess("factures");

  // Vérifications supplémentaires spécifiques aux factures
  const hasCompanyInfo = session?.user?.organization
    ? isCompanyInfoComplete(session.user.organization)
    : false;

  const canCreateInvoice = featureAccess.hasAccess && hasCompanyInfo;

  const getBlockingReason = () => {
    if (!featureAccess.hasAccess) {
      return {
        type: "subscription",
        message: "Abonnement Pro requis",
        action: "upgrade",
      };
    }

    if (!hasCompanyInfo) {
      return {
        type: "company_info",
        message: "Informations d'entreprise incomplètes",
        action: "complete_profile",
      };
    }

    return null;
  };

  return {
    ...featureAccess,
    canCreateInvoice,
    hasCompanyInfo,
    blockingReason: getBlockingReason(),
  };
}
```

## Exemple 7 : Utilisation dans un formulaire

```jsx
// components/invoice-form.jsx
"use client";

import { useInvoiceAccess } from "@/hooks/useInvoiceAccess";
import { Button } from "@/src/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/src/components/ui/alert";

export function InvoiceForm() {
  const { canCreateInvoice, blockingReason, loading } = useInvoiceAccess();

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!canCreateInvoice && blockingReason) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {blockingReason.message}
          {blockingReason.action === "upgrade" && (
            <Button className="ml-4" size="sm">
              Passer Pro
            </Button>
          )}
          {blockingReason.action === "complete_profile" && (
            <Button className="ml-4" size="sm" variant="outline">
              Compléter mon profil
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form className="space-y-4">
      {/* Champs du formulaire */}
      <Button type="submit">Créer la facture</Button>
    </form>
  );
}
```

## Exemple 8 : Middleware de vérification côté serveur

```javascript
// middleware.js (pour Next.js)
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Routes protégées nécessitant un abonnement Pro
  const protectedRoutes = [
    "/dashboard/outils/factures",
    "/dashboard/outils/devis",
    "/dashboard/outils/gestion-depenses",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Vérifier l'abonnement côté serveur
    // (à implémenter selon votre système d'authentification)
    const hasProAccess = await checkProAccess(request);

    if (!hasProAccess) {
      return NextResponse.redirect(
        new URL("/dashboard/outils?access=restricted", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
```

Ces exemples couvrent les cas d'usage les plus courants du système de contrôle d'accès. Vous pouvez les adapter selon vos besoins spécifiques.
