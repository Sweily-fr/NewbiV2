"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Loader2 } from "lucide-react";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [showAnimation, setShowAnimation] = useState(false);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Éviter les doubles exécutions en mode strict
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const completeOnboarding = async () => {
      console.log("✅ [ONBOARDING-SUCCESS] Paiement réussi, affichage animation...");

      // ✅ SIMPLIFIÉ: Le webhook Stripe a déjà tout fait:
      // - Créé l'organisation
      // - Créé le membre owner
      // - Mis à jour les sessions avec activeOrganizationId
      // - Créé l'abonnement
      // - Mis hasSeenOnboarding: true sur l'utilisateur
      // - Mis onboardingCompleted: true sur l'organisation

      // Court délai pour laisser le webhook se terminer si pas encore fait
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Afficher directement l'animation de succès
      setShowAnimation(true);
    };

    completeOnboarding();
  }, [router, sessionId]);

  const handleAnimationComplete = async () => {
    console.log("🚀 [ONBOARDING-SUCCESS] Animation terminée, préparation redirection...");

    // ✅ Nettoyer le localStorage pour éviter qu'un ancien org ID soit envoyé par Apollo
    // avant que useWorkspace ne soit initialisé sur le dashboard
    localStorage.removeItem("active_organization_id");
    localStorage.removeItem("user_role");

    // S'assurer que l'organisation est active avant de rediriger
    try {
      const { data: organizations } = await authClient.organization.list();
      if (organizations && organizations.length > 0) {
        await authClient.organization.setActive({
          organizationId: organizations[0].id
        });
        console.log(`✅ [ONBOARDING-SUCCESS] Organisation activée: ${organizations[0].id}`);
      }
    } catch (error) {
      console.warn("⚠️ [ONBOARDING-SUCCESS] Erreur activation org:", error);
    }

    router.push("/dashboard?welcome=true");
  };

  // Afficher l'animation de succès (ou un bref loader pendant le délai initial)
  return (
    <div className="min-h-screen bg-background">
      {!showAnimation && (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      )}
      <ProSubscriptionOverlay
        isVisible={showAnimation}
        onComplete={handleAnimationComplete}
      />
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
