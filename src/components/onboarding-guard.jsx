"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { LoaderCircle } from "lucide-react";

/**
 * Guard pour rediriger vers l'onboarding si l'utilisateur ne l'a pas complété
 * Vérifie le statut utilisateur (hasSeenOnboarding) comme source principale
 * Le check d'abonnement est fait côté serveur dans dashboard/layout.jsx
 */
export default function OnboardingGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { organization, loading: orgLoading } = useActiveOrganization();
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(null);

  // Vérifier l'abonnement si hasSeenOnboarding est true mais orgOnboardingCompleted est false
  // Cela permet de gérer la rétrocompatibilité avec les anciens comptes
  useEffect(() => {
    const checkSubscription = async () => {
      if (!organization?.id) return;

      // Si l'utilisateur a vu l'onboarding mais l'organisation n'a pas le flag
      // On vérifie s'il a un abonnement actif (rétrocompatibilité)
      if (session?.user?.hasSeenOnboarding && !organization?.onboardingCompleted) {
        try {
          const response = await fetch(
            `/api/organizations/${organization.id}/subscription`
          );
          const data = await response.json();

          const isActive =
            data.status === "active" ||
            data.status === "trialing" ||
            (data.status === "canceled" &&
              data.periodEnd &&
              new Date(data.periodEnd) > new Date());

          setHasActiveSubscription(isActive);

          // Si abonnement actif, mettre à jour onboardingCompleted (migration automatique)
          if (isActive && !organization?.onboardingCompleted) {
            try {
              await fetch(`/api/organizations/${organization.id}/complete-onboarding`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });
              console.log("✅ [ONBOARDING GUARD] Migration automatique: onboardingCompleted mis à true");
            } catch (migrationError) {
              console.warn("⚠️ [ONBOARDING GUARD] Erreur migration:", migrationError);
            }
          }
        } catch (error) {
          console.warn("⚠️ [ONBOARDING GUARD] Erreur vérification abonnement:", error);
          setHasActiveSubscription(false);
        }
      }

      setHasCheckedSubscription(true);
    };

    if (session?.user && organization && !hasCheckedSubscription) {
      checkSubscription();
    }
  }, [session, organization, hasCheckedSubscription]);

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isPending || orgLoading) return;

    // Si pas de session, laisser le middleware gérer la redirection
    if (!session?.user) return;

    // Si déjà sur la page d'onboarding, ne rien faire
    if (pathname?.startsWith("/onboarding")) return;

    // Vérifier si l'utilisateur a complété l'onboarding
    const hasSeenOnboarding = session.user.hasSeenOnboarding;

    // Vérifier si l'organisation a complété l'onboarding
    const orgOnboardingCompleted = organization?.onboardingCompleted;

    // Si l'onboarding n'est pas complété, rediriger
    // Mais attendre la vérification d'abonnement si nécessaire
    if (!hasSeenOnboarding) {
      console.log("🎯 [ONBOARDING GUARD] Redirection vers /onboarding (hasSeenOnboarding=false)");
      router.push("/onboarding");
    } else if (organization && !orgOnboardingCompleted && hasCheckedSubscription && !hasActiveSubscription) {
      console.log("🎯 [ONBOARDING GUARD] Redirection vers /onboarding (pas d'abonnement actif)");
      router.push("/onboarding");
    }
  }, [session, isPending, pathname, router, organization, orgLoading, hasActiveSubscription, hasCheckedSubscription]);

  // Pendant le chargement, afficher un loader
  if (isPending || orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas de session, laisser passer (le middleware va gérer)
  if (!session?.user) {
    return children;
  }

  // Vérifier si l'onboarding est complété
  const hasSeenOnboarding = session.user.hasSeenOnboarding;
  const orgOnboardingCompleted = organization?.onboardingCompleted;

  // L'onboarding est complété si hasSeenOnboarding ET (orgOnboardingCompleted OU abonnement actif)
  const isOnboardingComplete =
    hasSeenOnboarding &&
    (!organization || orgOnboardingCompleted || hasActiveSubscription === true);

  // Si on attend encore la vérification d'abonnement pour la rétrocompatibilité
  if (hasSeenOnboarding && !orgOnboardingCompleted && !hasCheckedSubscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  // Si onboarding non complété et pas sur la page onboarding, afficher loader pendant redirection
  if (!isOnboardingComplete && !pathname?.startsWith("/onboarding")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Redirection...</p>
        </div>
      </div>
    );
  }

  // Sinon, afficher le contenu normalement
  return children;
}
