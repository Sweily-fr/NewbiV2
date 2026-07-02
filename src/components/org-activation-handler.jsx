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
      const sessionId = searchParams.get("session_id");

      // Vérifier si on a déjà traité cette activation
      const hasProcessed = sessionStorage.getItem("org_activation_processed");

      if (orgCreated === "true" && paymentSuccess === "true" && !hasProcessed) {
        // Marquer comme traité IMMÉDIATEMENT pour éviter les doublons
        sessionStorage.setItem("org_activation_processed", "true");
        console.log(
          "🔄 [ORG ACTIVATION] Activation de la nouvelle organisation..."
        );

        try {
          let newOrgId = null;

          // Chemin principal : vérifier la session Stripe côté serveur.
          // verify-checkout-session crée l'organisation si le webhook n'est
          // pas encore passé et renvoie l'ID de la bonne org — pas besoin
          // d'heuristique "org la plus récente".
          if (sessionId) {
            const maxVerifyAttempts = 10;
            for (let i = 0; i < maxVerifyAttempts && !newOrgId; i++) {
              try {
                const res = await fetch(
                  `/api/verify-checkout-session?session_id=${sessionId}`
                );
                const data = await res.json();
                if (data.success && data.organizationId) {
                  newOrgId = data.organizationId;
                  console.log(
                    `✅ [ORG ACTIVATION] Organisation confirmée via Stripe: ${newOrgId}`
                  );
                  break;
                }
              } catch (verifyError) {
                console.warn(
                  "⚠️ [ORG ACTIVATION] verify-checkout-session:",
                  verifyError
                );
              }
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          // Fallback (pas de session_id ou vérification KO) : attendre que le
          // webhook crée l'organisation et prendre la plus récente (< 2 min)
          if (!newOrgId) {
            let attempts = 0;
            const maxAttempts = 10;

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
                  console.log(
                    `✅ [ORG ACTIVATION] Nouvelle organisation trouvée: ${newOrgId}`
                  );
                }
              }

              attempts++;
            }
          }

          if (newOrgId) {
            // Rafraîchir la session client (le webhook a pu la modifier en base)
            try {
              await authClient.getSession({
                fetchOptions: { cache: "no-store" },
              });
            } catch {
              // Non-fatal — setActive suffit dans la plupart des cas
            }

            // Activer la nouvelle organisation
            await authClient.organization.setActive({
              organizationId: newOrgId,
            });

            console.log(
              `✅ [ORG ACTIVATION] Organisation activée: ${newOrgId}`
            );

            // Nettoyer le sessionStorage
            sessionStorage.removeItem("pending_org_creation");
            sessionStorage.removeItem("org_activation_processed");
            sessionStorage.removeItem("create-workspace-data");

            // Afficher un message de succès
            toast.success("Organisation créée avec succès !", {
              description: "Votre abonnement est maintenant actif.",
            });

            // Nettoyer les paramètres de l'URL sans recharger
            router.replace("/dashboard");
          } else {
            console.warn(
              "⚠️ [ORG ACTIVATION] Organisation non trouvée après les tentatives"
            );
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
