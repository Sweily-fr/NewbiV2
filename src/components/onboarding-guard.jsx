"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/src/lib/auth-client";
import { useActiveOrganization } from "@/src/lib/organization-client";
import { LoaderCircle } from "lucide-react";

/**
 * Guard pour rediriger vers l'onboarding si l'utilisateur ne l'a pas complété
 * Vérifie à la fois le statut utilisateur (hasSeenOnboarding) et organisation (onboardingCompleted)
 */
export default function OnboardingGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const { organization, loading: orgLoading } = useActiveOrganization();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isPending || orgLoading) return;

    // Si pas de session, laisser le middleware gérer la redirection
    if (!session?.user) return;

    // Si déjà sur la page d'onboarding, ne rien faire
    if (pathname?.startsWith("/onboarding")) return;

    // Vérifier si l'utilisateur a complété l'onboarding
    const hasSeenOnboarding = session.user.hasSeenOnboarding;

    // Vérifier si l'organisation a complété l'onboarding (nouveau champ)
    const orgOnboardingCompleted = organization?.onboardingCompleted;

    // Si l'onboarding n'est pas complété (utilisateur OU organisation), rediriger
    if (!hasSeenOnboarding || (organization && !orgOnboardingCompleted)) {
      console.log("🎯 [ONBOARDING GUARD] Redirection vers /onboarding");
      console.log("   - hasSeenOnboarding:", hasSeenOnboarding);
      console.log("   - orgOnboardingCompleted:", orgOnboardingCompleted);
      router.push("/onboarding");
    }
  }, [session, isPending, pathname, router, organization, orgLoading]);

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

  // Vérifier si l'onboarding est complété (utilisateur ET organisation)
  const hasSeenOnboarding = session.user.hasSeenOnboarding;
  const orgOnboardingCompleted = organization?.onboardingCompleted;
  const isOnboardingComplete =
    hasSeenOnboarding && (!organization || orgOnboardingCompleted);

  // Si onboarding non complété et pas sur la page onboarding, ne rien afficher
  // (la redirection va se faire)
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
