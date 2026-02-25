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
  const [error, setError] = useState(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Éviter les doubles exécutions en mode strict
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const completeOnboarding = async () => {
      console.log("✅ [ONBOARDING-SUCCESS] Paiement réussi, vérification via polling...");

      if (!sessionId) {
        console.warn("⚠️ [ONBOARDING-SUCCESS] Pas de session_id, affichage direct");
        setShowAnimation(true);
        return;
      }

      // Poll verify-checkout-session every 2s, up to 30s
      const maxAttempts = 15;
      for (let i = 0; i < maxAttempts; i++) {
        try {
          const res = await fetch(`/api/verify-checkout-session?session_id=${sessionId}`);
          const data = await res.json();

          if (data.success) {
            console.log(`✅ [ONBOARDING-SUCCESS] Vérification réussie (tentative ${i + 1})`);
            setShowAnimation(true);
            return;
          }

          console.log(`🔄 [ONBOARDING-SUCCESS] Tentative ${i + 1}/${maxAttempts} - pas encore prêt`);
        } catch (err) {
          console.warn(`⚠️ [ONBOARDING-SUCCESS] Erreur tentative ${i + 1}:`, err.message);
        }

        // Attendre 2s avant la prochaine tentative
        await new Promise((r) => setTimeout(r, 2000));
      }

      // Timeout: afficher une erreur avec option de retry
      console.error("❌ [ONBOARDING-SUCCESS] Timeout après 30s de polling");
      setError("Le traitement prend plus de temps que prévu. Veuillez réessayer.");
    };

    completeOnboarding();
  }, [router, sessionId]);

  const handleRetry = () => {
    setError(null);
    hasStartedRef.current = false;
    // Force re-trigger
    window.location.reload();
  };

  const handleAnimationComplete = async () => {
    console.log("🚀 [ONBOARDING-SUCCESS] Animation terminée, préparation redirection...");

    // Nettoyer le localStorage
    localStorage.removeItem("active_organization_id");
    localStorage.removeItem("user_role");

    // S'assurer que l'organisation est active avant de rediriger
    try {
      const { data: organizations } = await authClient.organization.list();
      if (organizations && organizations.length > 0) {
        await authClient.organization.setActive({
          organizationId: organizations[0].id,
        });
        console.log(`✅ [ONBOARDING-SUCCESS] Organisation activée: ${organizations[0].id}`);
      }
    } catch (error) {
      console.warn("⚠️ [ONBOARDING-SUCCESS] Erreur activation org:", error);
    }

    router.push("/dashboard?welcome=true");
  };

  // Afficher l'erreur avec retry
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md px-4">
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-[#5A50FF] text-white rounded-lg hover:bg-[#4A40EF] transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

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
