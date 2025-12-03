"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StripeConnectOnboardingModal } from "./stripe-connect-onboarding-modal";
import { useStripeConnect } from "@/src/hooks/useStripeConnect";
import { useWorkspace } from "@/src/hooks/useWorkspace";
import { useSession } from "@/src/lib/auth-client";

/**
 * Composant global qui gère l'ouverture automatique du modal Stripe Connect
 * en fonction des paramètres URL (stripe_step1_complete)
 */
export function StripeConnectUrlHandler() {
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const { data: session } = useSession();
  const { activeOrganization } = useWorkspace();

  const { connectStripe, openStripeDashboard, refetchStatus } =
    useStripeConnect(activeOrganization?.id);

  useEffect(() => {
    const stripeStep1Complete = searchParams.get("stripe_step1_complete");

    if (stripeStep1Complete === "true") {
      console.log(
        "🔔 Détection stripe_step1_complete - Ouverture modal étape 2"
      );

      // Ouvrir le modal à l'étape 2
      setModalStep(2);
      setIsModalOpen(true);

      // Rafraîchir le statut Stripe
      refetchStatus();

      // Nettoyer l'URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams, refetchStatus]);

  return (
    <StripeConnectOnboardingModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      currentStep={modalStep}
      onStartConfiguration={async () => {
        // Étape 1 : Configuration initiale
        if (session?.user?.email) {
          await connectStripe(session.user.email);
        }
      }}
      onVerifyIdentity={async () => {
        // Étape 2 : Vérification d'identité
        await openStripeDashboard();
      }}
    />
  );
}
