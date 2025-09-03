"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { ClockIcon, CrownIcon, XIcon, ArrowRightIcon } from "lucide-react";
import { useSubscription } from "@/src/contexts/subscription-context";
import { useSession } from "@/src/lib/auth-client";
import { useRouter } from "next/navigation";
import PricingModal from "@/src/components/pricing-modal";

export function SidebarTrialCard() {
  const { subscription, loading, isActive } = useSubscription();
  const { data: session } = useSession();

  const [dismissed, setDismissed] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const router = useRouter();

  const openPricingModal = () => {
    setIsPricingModalOpen(true);
  };

  // Calculer les informations d'essai
  const getTrialInfo = () => {
    if (!session?.user)
      return { isInTrial: false, isTrialExpired: false, trialDaysRemaining: 0, isFreeMode: false };

    const createdAt = new Date(session.user.createdAt);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    const trialDaysRemaining = Math.max(0, Math.ceil(14 - daysSinceCreation));

    const isInTrial = daysSinceCreation <= 14 && !isActive();
    const isTrialExpired = daysSinceCreation > 14 && !isActive();
    // Mode gratuit : utilisateur sans abonnement actif (peu importe la période d'essai)
    const isFreeMode = !isActive();

    return { isInTrial, isTrialExpired, trialDaysRemaining, isFreeMode };
  };

  const { isInTrial, isTrialExpired, trialDaysRemaining, isFreeMode } = getTrialInfo();

  // Reset dismissed state when trial status changes
  useEffect(() => {
    setDismissed(false);
  }, [isInTrial, isTrialExpired, isActive()]);

  // Ne pas afficher si loading, dismissed, ou si l'utilisateur a un abonnement actif
  // Attendre que les données soient complètement chargées avant d'afficher
  if (loading || dismissed || (isActive() && !subscription)) {
    return null;
  }
  
  // Si l'utilisateur a un abonnement actif avec les données chargées, ne pas afficher
  if (isActive() && subscription) {
    return null;
  }

  // Rendu du modal de pricing
  const renderPricingModal = () => {
    return (
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    );
  };

  // Essai expiré
  if (isTrialExpired) {
    return (
      <>
        <Card className="mx-3 mb-3 border-red-200 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <CrownIcon className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800 text-sm">
                  Essai expiré
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                onClick={() => setDismissed(true)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-red-700 mb-3">
              Passez à un plan payant pour continuer à utiliser toutes les
              fonctionnalités.
            </p>
            <Button
              size="sm"
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
              onClick={openPricingModal}
            >
              Choisir un plan
            </Button>
          </CardContent>
        </Card>
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </>
    );
  }

  // Essai urgent (3 jours ou moins)
  if (isInTrial && trialDaysRemaining <= 3) {
    return (
      <>
        <Card className="mx-3 mb-3 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-800 text-sm">
                  Essai bientôt terminé
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-orange-400 hover:text-orange-600"
                onClick={() => setDismissed(true)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Badge
                variant="outline"
                className="bg-orange-100 text-orange-800 border-orange-300 text-xs"
              >
                {trialDaysRemaining} jour(s) restant(s)
              </Badge>
            </div>
            <p className="text-xs text-orange-700 mb-3">
              Ne perdez pas l'accès à vos données.
            </p>
            <Button
              size="sm"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs"
              onClick={openPricingModal}
            >
              Passer au premium
            </Button>
          </CardContent>
        </Card>
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </>
    );
  }

  // Afficher la card pour les utilisateurs en mode gratuit (essai expiré ou jamais eu d'essai)
  if (isFreeMode) {
    // Déterminer si c'est un utilisateur qui n'a jamais eu d'essai ou dont l'essai a expiré
    const showFreeContent = !isInTrial || isTrialExpired;
    
    return (
      <>
        <Card className="mb-2 bg-transparent shadow-xs py-3 rounded-md">
          <CardContent className="px-3">
            <div className="flex items-start gap-2">
              {/* Icône en haut à gauche */}
              <div className="flex-shrink-0 mt-[1px]">
                <CrownIcon className="h-3.5 w-3.5 text-[#5B4FFF]" />
              </div>

              {/* Contenu aligné à droite */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold dark:text-white text-[12px] text-gray-900">
                    Débloquez toutes les fonctionnalités
                  </h3>
                </div>

                <p className="text-[12px] text-gray-600 dark:text-white/80 mb-2">
                  Vous êtes actuellement en mode gratuit avec des fonctionnalités limitées
                </p>

                <div
                  className="w-full text-xs font-semibold flex items-center justify-between p-0 h-auto cursor-pointer"
                  onClick={openPricingModal}
                >
                  <span>
                    Passer au premium
                  </span>
                  <ArrowRightIcon className="w-4 h-4 self-center stroke-[2]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </>
    );
  }

  return null;
}

// Ajouter le composant PricingModal à la fin du fichier pour l'exporter
export { PricingModal };
