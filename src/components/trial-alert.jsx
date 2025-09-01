'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/src/hooks/useSubscription';
import { Alert, AlertDescription } from '@/src/components/ui/alert';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { 
  ClockIcon, 
  CrownIcon, 
  XIcon,
  AlertTriangleIcon 
} from 'lucide-react';
import PricingModal from '@/src/components/pricing-modal';

export function TrialAlert() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const {
    isInTrial,
    isTrialExpired,
    trialDaysRemaining,
    hasActiveSubscription,
    loading
  } = useSubscription();
  
  const openPricingModal = () => {
    setIsPricingModalOpen(true);
  };

  // Ne pas afficher si loading, si l'utilisateur a un abonnement actif, ou si l'alerte est fermée
  if (loading || hasActiveSubscription || dismissed) {
    return null;
  }

  // Alerte d'expiration (priorité haute)
  if (isTrialExpired) {
    return (
      <>
        <Alert className="border-red-200 bg-red-50 mb-6">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <span className="font-medium text-red-800">
                  Votre période d'essai a expiré
                </span>
                <p className="text-sm text-red-700 mt-1">
                  Choisissez un plan pour continuer à utiliser toutes les fonctionnalités de Newbi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                onClick={openPricingModal}
                className="bg-red-600 hover:bg-red-700"
              >
                <CrownIcon className="w-4 h-4 mr-1" />
                Choisir un plan
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      </>
    );
  }

  // Alerte d'essai (derniers jours)
  if (isInTrial && trialDaysRemaining <= 3) {
    return (
      <>
        <Alert className="border-orange-200 bg-orange-50 mb-6">
          <ClockIcon className="h-4 w-4 text-orange-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-orange-800">
                    Votre essai gratuit expire bientôt
                  </span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                    {trialDaysRemaining} jour(s) restant(s)
                  </Badge>
                </div>
                <p className="text-sm text-orange-700">
                  Passez au plan payant pour continuer à profiter de toutes les fonctionnalités.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissed(true)}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <XIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={openPricingModal}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <CrownIcon className="w-4 h-4 mr-1" />
                Voir les plans
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      </>
    );
  }

  // Alerte d'essai (information générale)
  if (isInTrial && trialDaysRemaining > 3) {
    return (
      <>
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <ClockIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-800">
                    Période d'essai gratuit
                  </span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {trialDaysRemaining} jour(s) restant(s)
                  </Badge>
                </div>
                <p className="text-sm text-blue-700">
                  Profitez de toutes les fonctionnalités gratuitement pendant votre essai.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDismissed(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <XIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openPricingModal}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Voir les plans
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />
      </>
    );
  }

  return null;
}

// Ajouter le composant PricingModal à la fin du fichier pour l'exporter
export { PricingModal };
