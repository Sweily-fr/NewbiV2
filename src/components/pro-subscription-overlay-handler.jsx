"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Overlay (framer-motion, ~40 kB gz) chargé seulement quand l'animation se
// joue, après un paiement réussi : il était téléchargé à chaque chargement du
// dashboard.
const ProSubscriptionOverlay = dynamic(
  () =>
    import("./pro-subscription-overlay").then((m) => m.ProSubscriptionOverlay),
  { ssr: false },
);

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

      // Nettoyer l'URL des paramètres
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);

      // Attendre que le dashboard soit rendu avant de lancer l'animation
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    console.log("✅ Animation Pro terminée");
  };

  if (!showAnimation) return null;
  return (
    <ProSubscriptionOverlay isVisible onComplete={handleAnimationComplete} />
  );
}
