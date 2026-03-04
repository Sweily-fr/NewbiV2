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

      // Vérifier si on a déjà traité cette activation
      const hasProcessed = sessionStorage.getItem("org_activation_processed");

      if (orgCreated === "true" && paymentSuccess === "true" && !hasProcessed) {
        // Marquer comme traité IMMÉDIATEMENT pour éviter les doublons
        sessionStorage.setItem("org_activation_processed", "true");

        try {
          // Attendre que le webhook crée l'organisation (max 5 secondes)
          let attempts = 0;
          const maxAttempts = 10;
          let newOrgId = null;

          while (attempts < maxAttempts && !newOrgId) {
            await new Promise((resolve) => setTimeout(resolve, 500));

            // Récupérer la liste des organisations
            const { data: organizations } =
              await authClient.organization.list();

            if (organizations && organizations.length > 0) {
              // Trier par date de création (la plus récente en premier)
              const sortedOrgs = [...organizations].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
              );

              // La nouvelle organisation est la plus récente
              const newestOrg = sortedOrgs[0];

              // Vérifier si elle a été créée il y a moins de 2 minutes
              const createdAt = new Date(newestOrg.createdAt);
              const now = new Date();
              const diffMinutes = (now - createdAt) / 1000 / 60;

              if (diffMinutes < 2) {
                newOrgId = newestOrg.id;
              }
            }

            attempts++;
          }

          if (newOrgId) {
            // Activer la nouvelle organisation
            await authClient.organization.setActive({
              organizationId: newOrgId,
            });

            // Nettoyer le sessionStorage
            sessionStorage.removeItem("pending_org_creation");
            sessionStorage.removeItem("org_activation_processed");

            // Afficher un message de succès
            toast.success("Organisation créée avec succès !", {
              description: "Votre abonnement est maintenant actif.",
            });

            // Nettoyer les paramètres de l'URL sans recharger
            router.replace("/dashboard");
          } else {
            sessionStorage.removeItem("org_activation_processed");
            toast.error("Erreur lors de l'activation de l'organisation", {
              description: "Veuillez rafraîchir la page.",
            });
            router.replace("/dashboard");
          }
        } catch (error) {
          console.error("❌ [ORG ACTIVATION] Erreur:", error);
          sessionStorage.removeItem("org_activation_processed");
          toast.error("Erreur lors de l'activation de l'organisation");
          router.replace("/dashboard");
        }
      }
    };

    handleOrgActivation();
  }, [searchParams, router]);

  return null; // Composant invisible
}
