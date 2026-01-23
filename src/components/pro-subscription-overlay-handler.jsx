"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProSubscriptionOverlay } from "./pro-subscription-overlay";

export function ProSubscriptionOverlayHandler() {
  const searchParams = useSearchParams();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Détecter les paramètres de succès de paiement
    const paymentSuccess = searchParams.get("payment_success") === "true";
    const subscriptionSuccess =
      searchParams.get("subscription_success") === "true";

    if (paymentSuccess || subscriptionSuccess) {
      console.log("🎉 Paiement réussi détecté, affichage de l'animation Pro");
      setShowAnimation(true);

      // Nettoyer l'URL des paramètres
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, [searchParams]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    console.log("✅ Animation Pro terminée");
  };

  return (
    <ProSubscriptionOverlay
      isVisible={showAnimation}
      onComplete={handleAnimationComplete}
    />
  );
}
