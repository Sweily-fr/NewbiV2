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
  const [isProcessing, setIsProcessing] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Finalisation de votre inscription...");
  const hasStartedRef = useRef(false);

  useEffect(() => {
    // Éviter les doubles exécutions en mode strict
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const completeOnboarding = async () => {
      try {
        console.log("✅ [ONBOARDING-SUCCESS] Démarrage de la finalisation...");

        // 🔒 ÉTAPE 1: Attendre que l'abonnement Stripe soit créé
        // Le webhook peut prendre quelques secondes
        setStatusMessage("Vérification de votre paiement...");

        const session = await authClient.getSession();
        const organizationId = session?.data?.session?.activeOrganizationId;

        if (!organizationId) {
          console.error("❌ [ONBOARDING-SUCCESS] Pas d'organisation active");
          router.push("/onboarding");
          return;
        }

        // Polling pour attendre l'abonnement (max 60 secondes)
        let subscriptionFound = false;
        let attempts = 0;
        const maxAttempts = 30;

        while (!subscriptionFound && attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 [ONBOARDING-SUCCESS] Vérification abonnement (${attempts}/${maxAttempts})...`);

          try {
            const response = await fetch(`/api/organizations/${organizationId}/subscription`);
            const data = await response.json();

            if (response.ok && (data.status === "active" || data.status === "trialing")) {
              subscriptionFound = true;
              console.log("✅ [ONBOARDING-SUCCESS] Abonnement confirmé:", data.plan);
              break;
            }
          } catch (fetchError) {
            console.warn("⚠️ [ONBOARDING-SUCCESS] Erreur fetch:", fetchError);
          }

          // Attendre 2 secondes avant la prochaine tentative
          if (!subscriptionFound && attempts < maxAttempts) {
            setStatusMessage(`Activation de votre abonnement... (${attempts}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }

        // 🔒 Si l'abonnement n'est pas trouvé après 60 secondes, rediriger vers onboarding
        if (!subscriptionFound) {
          console.error("❌ [ONBOARDING-SUCCESS] Timeout - abonnement non trouvé");
          setStatusMessage("Problème lors de l'activation. Redirection...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          router.push("/onboarding?error=subscription_timeout");
          return;
        }

        // 🔒 ÉTAPE 2: Maintenant que l'abonnement est confirmé, marquer l'onboarding comme complété
        setStatusMessage("Configuration de votre compte...");

        await authClient.updateUser({
          hasSeenOnboarding: true,
        });

        console.log("✅ [ONBOARDING-SUCCESS] hasSeenOnboarding défini après confirmation abonnement");

        // Gérer les invitations en attente
        const pendingInvitation = localStorage.getItem("pendingInvitation");
        if (pendingInvitation) {
          try {
            const invitation = JSON.parse(pendingInvitation);
            const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

            if (Date.now() - invitation.timestamp < sevenDaysInMs) {
              console.log(`📨 [ONBOARDING-SUCCESS] Tentative d'acceptation de l'invitation ${invitation.invitationId}`);

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
              } else {
                const errorData = await response.json();
                console.error("❌ [ONBOARDING-SUCCESS] Erreur acceptation:", errorData);
              }
            } else {
              console.log("⚠️ [ONBOARDING-SUCCESS] Invitation expirée (> 7 jours)");
            }

            localStorage.removeItem("pendingInvitation");
            console.log("🗑️ [ONBOARDING-SUCCESS] localStorage nettoyé");
          } catch (invError) {
            console.error("Erreur acceptation invitation:", invError);
            localStorage.removeItem("pendingInvitation");
          }
        }

        // ✅ Afficher l'animation de succès
        setIsProcessing(false);
        setShowAnimation(true);
      } catch (err) {
        console.error("❌ [ONBOARDING-SUCCESS] Erreur:", err);
        setStatusMessage("Une erreur est survenue. Redirection...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        router.push("/onboarding?error=unknown");
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
            {statusMessage}
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
