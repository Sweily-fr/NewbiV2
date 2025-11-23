'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSubscription } from "@/src/contexts/dashboard-layout-context";
import { useSession } from '@/src/lib/auth-client';
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
  const { subscription, loading, isActive } = useSubscription();
  const { data: session } = useSession();
  
  // Calculer les informations d'essai
  const getTrialInfo = () => {
    if (!session?.user) return { isInTrial: false, isTrialExpired: false, trialDaysRemaining: 0 };
    
    const createdAt = new Date(session.user.createdAt);
    const now = new Date();
    const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);
    const trialDaysRemaining = Math.max(0, Math.ceil(180 - daysSinceCreation));
    
    const isInTrial = daysSinceCreation <= 180 && !isActive();
    const isTrialExpired = daysSinceCreation > 180 && !isActive();
    
    return { isInTrial, isTrialExpired, trialDaysRemaining };
  };

  const { isInTrial, isTrialExpired, trialDaysRemaining } = getTrialInfo();
  const hasActiveSubscription = isActive();
  
  // 🧪 MODE TEST : Décommentez pour forcer un état spécifique
  // const isInTrial = true;
  // const isTrialExpired = false;
  // const trialDaysRemaining = 2; // Changez pour tester différents jours
  // const hasActiveSubscription = false;
  
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
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <CrownIcon className="h-4 w-4 text-[#5B4FFF]" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <span className="font-medium text-blue-800">
                  Débloquez toutes les fonctionnalités
                </span>
                <p className="text-sm text-blue-700 mt-1">
                  Votre période d'essai est terminée. Passez au premium pour continuer.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                size="sm"
                onClick={openPricingModal}
                className="bg-[#5B4FFF] hover:bg-[#4a3fcc]"
              >
                <CrownIcon className="w-4 h-4 mr-1" />
                Passer au premium
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
        <Alert className="border-blue-200 bg-blue-50 mb-6">
          <CrownIcon className="h-4 w-4 text-[#5B4FFF]" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-800">
                    Débloquez toutes les fonctionnalités
                  </span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    {trialDaysRemaining} jour(s) restant(s)
                  </Badge>
                </div>
                <p className="text-sm text-blue-700">
                  Plus que {trialDaysRemaining} jour(s) d'essai. Passez au premium pour continuer.
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
                size="sm"
                onClick={openPricingModal}
                className="bg-[#5B4FFF] hover:bg-[#4a3fcc]"
              >
                <CrownIcon className="w-4 h-4 mr-1" />
                Passer au premium
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
