'use client';

import { useSubscription } from '@/src/hooks/useSubscription';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { 
  CrownIcon, 
  ClockIcon, 
  AlertTriangleIcon,
  CheckCircleIcon 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import PricingModal from '@/src/components/pricing-modal';
import { useState } from 'react';

export function SubscriptionStatus({ variant = 'badge', className = '' }) {
  const router = useRouter();
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

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 w-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Version badge simple
  if (variant === 'badge') {
    if (hasActiveSubscription) {
      return (
        <Badge variant="outline" className={`bg-green-50 text-green-700 border-green-200 ${className}`}>
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Pro
        </Badge>
      );
    }

    if (isInTrial) {
      return (
        <Badge variant="outline" className={`bg-blue-50 text-blue-700 border-blue-200 ${className}`}>
          <ClockIcon className="w-3 h-3 mr-1" />
          Essai ({trialDaysRemaining}j)
        </Badge>
      );
    }

    if (isTrialExpired) {
      return (
        <Badge variant="outline" className={`bg-red-50 text-red-700 border-red-200 ${className}`}>
          <AlertTriangleIcon className="w-3 h-3 mr-1" />
          Expiré
        </Badge>
      );
    }
  }

  // Version détaillée avec bouton
  if (variant === 'detailed') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {hasActiveSubscription && (
          <>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircleIcon className="w-3 h-3 mr-1" />
              Plan Pro
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settings?tab=billing')}
            >
              Gérer
            </Button>
          </>
        )}

        {isInTrial && (
          <>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <ClockIcon className="w-3 h-3 mr-1" />
              Essai gratuit - {trialDaysRemaining} jour(s)
            </Badge>
            <Button
              size="sm"
              onClick={openPricingModal}
            >
              <CrownIcon className="w-4 h-4 mr-1" />
              Passer Pro
            </Button>
          </>
        )}

        {isTrialExpired && (
          <>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              <AlertTriangleIcon className="w-3 h-3 mr-1" />
              Essai expiré
            </Badge>
            <Button
              size="sm"
              onClick={openPricingModal}
            >
              <CrownIcon className="w-4 h-4 mr-1" />
              Choisir un plan
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {variant === 'detailed' && <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} />}
      {null}
    </>
  );
}
