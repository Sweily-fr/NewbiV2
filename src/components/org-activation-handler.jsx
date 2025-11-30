"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { toast } from "@/src/components/ui/sonner";

/**
 * Composant pour gérer l'activation automatique de l'organisation après création
 * Utilisé après le retour de Stripe Checkout
 */
export function OrgActivationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleOrgActivation = async () => {
      // Vérifier si on revient de la création d'organisation
      const orgCreated = searchParams.get("org_created");
      const paymentSuccess = searchParams.get("payment_success");

      if (orgCreated === "true" && paymentSuccess === "true") {
        console.log(
          "🔄 [ORG ACTIVATION] Activation de la nouvelle organisation..."
        );

        try {
          // Récupérer les données de l'organisation depuis sessionStorage
          const pendingOrgData = sessionStorage.getItem("pending_org_creation");

          if (pendingOrgData) {
            const orgData = JSON.parse(pendingOrgData);
            console.log("📋 [ORG ACTIVATION] Données organisation:", orgData);
          }

          // Rafraîchir la session pour récupérer la nouvelle organisation
          const { data: session } = await authClient.getSession();

          if (session?.session?.activeOrganizationId) {
            console.log(
              `✅ [ORG ACTIVATION] Organisation active: ${session.session.activeOrganizationId}`
            );

            // Nettoyer le sessionStorage
            sessionStorage.removeItem("pending_org_creation");

            // Afficher un message de succès
            toast.success("Organisation créée avec succès !", {
              description: "Votre abonnement est maintenant actif.",
            });

            // Nettoyer les paramètres de l'URL
            router.replace("/dashboard");

            // Recharger la page pour mettre à jour l'UI
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            console.warn(
              "⚠️ [ORG ACTIVATION] Aucune organisation active trouvée"
            );

            // Attendre un peu et réessayer (le webhook peut prendre du temps)
            setTimeout(async () => {
              const { data: retrySession } = await authClient.getSession();

              if (retrySession?.session?.activeOrganizationId) {
                console.log(
                  "✅ [ORG ACTIVATION] Organisation active (2ème tentative)"
                );
                sessionStorage.removeItem("pending_org_creation");
                toast.success("Organisation créée avec succès !");
                router.replace("/dashboard");
                setTimeout(() => window.location.reload(), 500);
              } else {
                toast.error("Erreur lors de l'activation de l'organisation", {
                  description: "Veuillez rafraîchir la page.",
                });
              }
            }, 2000);
          }
        } catch (error) {
          console.error("❌ [ORG ACTIVATION] Erreur:", error);
          toast.error("Erreur lors de l'activation de l'organisation");
        }
      }
    };

    handleOrgActivation();
  }, [searchParams, router]);

  return null; // Composant invisible
}
