'use client';

import { useState } from 'react';
import { useSubscription } from '@/src/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Separator } from '@/src/components/ui/separator';
import { Progress } from '@/src/components/ui/progress';
import { 
  CreditCardIcon, 
  CalendarIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  ExternalLinkIcon,
  CrownIcon,
  ClockIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function BillingSection({ session }) {
  const {
    subscription,
    isInTrial,
    isTrialExpired,
    trialDaysRemaining,
    hasActiveSubscription,
    createCheckoutSession,
    createCustomerPortal,
    loading
  } = useSubscription();

  const [processingAction, setProcessingAction] = useState(null);

  const handleUpgrade = async () => {
    try {
      setProcessingAction('upgrade');
      // Remplacez par votre vrai Price ID Stripe
      await createCheckoutSession('price_pro_monthly');
    } catch (error) {
      toast.error('Erreur lors de la redirection vers le paiement');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setProcessingAction('portal');
      await createCustomerPortal();
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du portail de gestion');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = () => {
    if (isInTrial) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <ClockIcon className="w-3 h-3 mr-1" />
          Essai gratuit
        </Badge>
      );
    }
    
    if (hasActiveSubscription) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircleIcon className="w-3 h-3 mr-1" />
          Actif
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        <AlertTriangleIcon className="w-3 h-3 mr-1" />
        Expiré
      </Badge>
    );
  };

  const getTrialProgress = () => {
    const totalDays = 14;
    const remainingDays = trialDaysRemaining;
    const usedDays = totalDays - remainingDays;
    return (usedDays / totalDays) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut de l'abonnement */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CrownIcon className="w-5 h-5" />
                Statut de l'abonnement
              </CardTitle>
              <CardDescription>
                Gérez votre plan et vos informations de facturation
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInTrial && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-blue-900">Période d'essai gratuit</h3>
                  <p className="text-sm text-blue-700">
                    {trialDaysRemaining} jour(s) restant(s) sur 14
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-900">
                    {trialDaysRemaining}
                  </div>
                  <div className="text-xs text-blue-600">jours restants</div>
                </div>
              </div>
              <Progress value={getTrialProgress()} className="h-2 mb-3" />
              <p className="text-sm text-blue-700">
                Profitez de toutes les fonctionnalités gratuitement pendant votre essai.
              </p>
            </div>
          )}

          {hasActiveSubscription && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-green-900">Abonnement actif</h3>
                  <p className="text-sm text-green-700">
                    Votre abonnement est actif et à jour
                  </p>
                </div>
              </div>
            </div>
          )}

          {isTrialExpired && !hasActiveSubscription && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-900">Période d'essai expirée</h3>
                  <p className="text-sm text-red-700">
                    Votre essai gratuit a expiré. Choisissez un plan pour continuer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations du plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Plan actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-lg">
                {isInTrial ? 'Essai Gratuit' : hasActiveSubscription ? 'Plan Professionnel' : 'Aucun plan'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isInTrial 
                  ? `Expire dans ${trialDaysRemaining} jour(s)`
                  : hasActiveSubscription 
                    ? 'Facturé mensuellement'
                    : 'Choisissez un plan pour continuer'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {isInTrial ? 'Gratuit' : hasActiveSubscription ? '29€' : '0€'}
              </div>
              {(isInTrial || hasActiveSubscription) && (
                <div className="text-sm text-muted-foreground">
                  {isInTrial ? 'pendant 14 jours' : 'par mois'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Gérez votre abonnement et vos informations de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {(isInTrial || isTrialExpired) && (
            <Button
              onClick={handleUpgrade}
              disabled={processingAction === 'upgrade'}
              className="w-full"
            >
              <CreditCardIcon className="w-4 h-4 mr-2" />
              {processingAction === 'upgrade' 
                ? 'Redirection...' 
                : isTrialExpired 
                  ? 'Choisir un plan' 
                  : 'Passer au plan payant'
              }
            </Button>
          )}

          {hasActiveSubscription && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={processingAction === 'portal'}
              className="w-full"
            >
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              {processingAction === 'portal' 
                ? 'Ouverture...' 
                : 'Gérer l\'abonnement'
              }
            </Button>
          )}

          <Separator />

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Compte créé le {new Date(session?.user?.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {subscription && (
              <p className="flex items-center gap-2">
                <CreditCardIcon className="w-4 h-4" />
                Prochaine facturation le {new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Fonctionnalités incluses */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités incluses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              'Factures illimitées',
              'Gestion des clients',
              'Tableau de bord financier',
              'OCR pour reçus',
              'Connexion bancaire',
              'Support par email',
              ...(hasActiveSubscription ? [
                'Stockage illimité',
                'Exports PDF/Excel',
                'Support prioritaire',
                'Multi-utilisateurs'
              ] : [])
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
