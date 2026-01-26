"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Loader2 } from "lucide-react";
import { ProSubscriptionOverlay } from "@/src/components/pro-subscription-overlay";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [showAnimation, setShowAnimation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const completeOnboarding = async () => {
      try {
        console.log("✅ [ONBOARDING-SUCCESS] Finalisation de l'onboarding...");

        // Marquer l'onboarding comme complété
        await authClient.updateUser({
          hasSeenOnboarding: true,
        });

        console.log("✅ [ONBOARDING-SUCCESS] Utilisateur mis à jour");

        // Gérer les invitations en attente
        const pendingInvitation = localStorage.getItem("pendingInvitation");
        if (pendingInvitation) {
          try {
            const invitation = JSON.parse(pendingInvitation);
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            if (Date.now() - invitation.timestamp < sevenDaysInMs) {
              const response = await fetch(
                `/api/invitations/${invitation.invitationId}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "accept" }),
                }
              );

              if (response.ok) {
                console.log("✅ [ONBOARDING-SUCCESS] Invitation acceptée");
              }
            }

            localStorage.removeItem("pendingInvitation");
          } catch (invError) {
            console.error("Erreur acceptation invitation:", invError);
          }
        }

        // Afficher l'animation de succès
        setIsProcessing(false);
        setShowAnimation(true);
      } catch (err) {
        console.error("❌ [ONBOARDING-SUCCESS] Erreur:", err);
        // En cas d'erreur, rediriger quand même vers le dashboard
        router.push("/dashboard");
      }
    };

    completeOnboarding();
  }, [router]);

  const handleAnimationComplete = () => {
    console.log("🚀 [ONBOARDING-SUCCESS] Animation terminée, redirection...");
    router.push("/dashboard?welcome=true");
  };

  // Afficher un loader pendant le traitement
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#5A50FF] mx-auto" />
          <p className="text-muted-foreground">
            Finalisation de votre inscription...
          </p>
        </div>
      </div>
    );
  }

  // Afficher l'animation de succès
  return (
    <div className="min-h-screen bg-background">
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
          <Loader2 className="w-10 h-10 animate-spin text-[#5A50FF]" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
